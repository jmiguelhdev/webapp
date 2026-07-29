# Implementación de Notas de Crédito, Débito y Facturación Electrónica ARCA / AFIP (Especificación Técnica Completa)

## 1. Visión General

Esta documentación describe la arquitectura, reglas de negocio e impositivas, esquemas de datos en **Cloud Firestore**, y flujo de funcionamiento para la emisión y consumo de **Facturas**, **Notas de Crédito (NC)** y **Notas de Débito (ND)** electrónicas ante **ARCA (ex-AFIP)** desde la aplicación móvil/escritorio y aplicaciones web externas.

La implementación permite registrar comprobantes, mantenido consistencia en:
- La solicitud de CAE vía Web Services de Facturación Electrónica (**WSFEv1** de ARCA o proxy **AFIP SDK**).
- La relación impositiva de comprobantes asociados (`CbtesAsoc` / `associatedCbteTipo`).
- El saldo de la Cuenta Corriente del cliente (`AccountTransactionEntity`).
- El inventario físico de lotes de materia prima cuando corresponde restitución de stock por Nota de Crédito.
- La sincronización en tiempo real con **Cloud Firestore** en la colección `fiscal_invoices`.

---

## 2. Códigos de Comprobante ARCA (`CbteTipo`)

La clase `VoucherType` (`com.jmhsg.fabrica.core.domain.model.VoucherType`) mapea el tipo de comprobante seleccionado y la condición fiscal del cliente al código oficial de ARCA:

| Condición IVA Emisor | Tipo Receptor / Condición | Comprobante Emitido | Código `CbteTipo` |
| :--- | :--- | :--- | :---: |
| **Responsable Inscripto** | CUIT válido (Receptor RI) | Factura A | `1` |
| **Responsable Inscripto** | CUIT válido (Receptor RI) | Nota de Débito A | `2` |
| **Responsable Inscripto** | CUIT válido (Receptor RI) | Nota de Crédito A | `3` |
| **Responsable Inscripto** | Consumidor Final / Sin CUIT | Factura B | `6` |
| **Responsable Inscripto** | Consumidor Final / Sin CUIT | Nota de Débito B | `7` |
| **Responsable Inscripto** | Consumidor Final / Sin CUIT | Nota de Crédito B | `8` |
| **Monotributista** | Todos | Factura C | `11` |
| **Monotributista** | Todos | Nota de Débito C | `12` |
| **Monotributista** | Todos | Nota de Crédito C | `13` |
| **Responsable Inscripto** | Receptor Clase M | Factura M | `51` |
| **Responsable Inscripto** | Receptor Clase M | Nota de Débito M | `52` |
| **Responsable Inscripto** | Receptor Clase M | Nota de Crédito M | `53` |

---

## 3. Requisito Obligatorio: Comprobante Asociado (`CbtesAsoc`)

Para toda **Nota de Crédito** o **Nota de Débito** es **obligatorio** vincular el comprobante original que le da origen.

### 3.1 Estructura XML del Nodo ARCA
```xml
<ar:CbtesAsoc>
   <ar:CbteAsoc>
      <ar:Tipo>6</ar:Tipo> <!-- Tipo del comprobante asociado (ej. Factura B) -->
      <ar:PtoVta>1</ar:PtoVta>
      <ar:Nro>124</ar:Nro>
      <ar:CbteFch>20260722</ar:CbteFch>
      <ar:Cuit>20409378472</ar:Cuit> <!-- Opcional si coincide emisor -->
   </ar:CbteAsoc>
</ar:CbtesAsoc>
```

### 3.2 Reglas de Compatibilidad de Familia de Comprobantes
El método `VoucherType.isAssociatedTypeCompatible(targetCbteTipo, associatedCbteTipo)` valida que:
- **NC/ND Clase A (2, 3)** $\rightarrow$ Asociadas únicamente a comprobantes Clase A (`1, 2, 3, 4`).
- **NC/ND Clase B (7, 8)** $\rightarrow$ Asociadas únicamente a comprobantes Clase B (`6, 7, 8, 9`).
- **NC/ND Clase C (12, 13)** $\rightarrow$ Asociadas únicamente a comprobantes Clase C (`11, 12, 13, 15`).
- **NC/ND Clase M (52, 53)** $\rightarrow$ Asociadas únicamente a comprobantes Clase M (`51, 52, 53, 54`).

---

## 🔥 4. Estructura y Colecciones en Cloud Firestore (`fiscal_invoices`)

Todos los comprobantes fiscales aprobados con **CAE** se suben a la colección `fiscal_invoices` de Firestore.

### 📌 Colección: `fiscal_invoices/{invoiceId}`

#### **Esquema JSON del Documento:**
```json
{
  "saleId": "SALE_1784980000000_123",
  "tipoComprobante": 8,
  "puntoVenta": 1,
  "numeroComprobante": 125,
  "fechaEmision": "20260725",
  "concepto": 1,
  "tipoDocReceptor": 99,
  "nroDocReceptor": 0,
  "nombreReceptor": "Consumidor Final",
  "importeTotal": 15500.0,
  "importeNetoNoGravado": 0.0,
  "importeExento": 0.0,
  "importeNetoGravado": 12809.92,
  "importeTributos": 0.0,
  "importeIva": 2690.08,
  "cae": "74283920194829",
  "caeVencimiento": 1785542400000,
  "moneda": "PES",
  "cotizacionMoneda": 1.0,
  "associatedCbteTipo": 6,
  "associatedPtoVta": 1,
  "associatedNro": 124,
  "associatedCbteFch": "20260722",
  "associatedCuit": "20409378472",
  "storeId": "Carnicería Sucursal Centro",
  "updatedAt": 1784995200000,
  "items": [
    {
      "id": "ITEM_101",
      "codigo": "PM-10",
      "descripcion": "Asado de Tira Novillito",
      "cantidad": 2.5,
      "unidadMedida": 7,
      "precioUnitario": 6200.0,
      "porcentajeBonificacion": 0.0,
      "importeBonificacion": 0.0,
      "subtotal": 15500.0,
      "codigoIva": 5,
      "importeIva": 2690.08
    }
  ],
  "vats": [
    {
      "codigoIva": 5,
      "baseImponible": 12809.92,
      "importeIva": 2690.08
    }
  ],
  "taxes": []
}
```

#### **Descripción de Campos:**
- `saleId` *(string)*: ID de la venta correspondiente en el sistema local.
- `tipoComprobante` *(number)*: Código ARCA (`1`=Factura A, `6`=Factura B, `8`=NC B, `3`=NC A, etc.).
- `puntoVenta` *(number)*: Número de punto de venta configurado ante ARCA (ej: `1`).
- `numeroComprobante` *(number)*: Número correlativo del comprobante otorgado por ARCA.
- `fechaEmision` *(string)*: Fecha de emisión en formato `YYYYMMDD` (ej: `"20260725"`).
- `concepto` *(number)*: `1` = Productos / Mercaderías, `2` = Servicios, `3` = Productos y Servicios.
- `tipoDocReceptor` *(number)*: `80` = CUIT, `96` = DNI, `99` = Consumidor Final / Sin Documento.
- `nroDocReceptor` *(number)*: Número de CUIT o DNI del cliente. `0` si es sin documento.
- `nombreReceptor` *(string)*: Razon social o nombre del cliente.
- `importeTotal` *(number)*: Monto final del comprobante ($).
- `importeNetoGravado` *(number)*: Base imponible sobre la cual se calcula el IVA ($).
- `importeIva` *(number)*: Monto acumulado de IVA ($).
- `cae` *(string | null)*: Código de Autorización Electrónico asignado por ARCA.
- `caeVencimiento` *(number | null)*: Timestamp ms epoch del vencimiento del CAE.
- `associatedCbteTipo` / `associatedPtoVta` / `associatedNro` / `associatedCbteFch`: Datos del comprobante original en caso de ser Nota de Crédito o Débito.
- `storeId` *(string)*: Identificador de la sucursal emisora.
- `items` *(array)*: Lista de renglones/productos facturados (`FiscalInvoiceItemDto`).
- `vats` *(array)*: Desglose de bases imponibles por alícuota de IVA (`codigoIva` `5`=21%, `4`=10.5%).
- `taxes` *(array)*: Percepciones u otros tributos aplicados.

---

## 💻 5. Integración en TypeScript / Web (Ejemplo para OTRAS IAs)

### Interfaces TypeScript
```typescript
export interface FiscalInvoiceItemDto {
  id: string;
  codigo: string;
  descripcion: string;
  cantidad: number;
  unidadMedida: number; // 7 = Kilos, 1 = Unidades
  precioUnitario: number;
  porcentajeBonificacion: number;
  importeBonificacion: number;
  subtotal: number;
  codigoIva: number; // 5 = 21%, 4 = 10.5%
  importeIva: number;
}

export interface FiscalInvoiceVatDto {
  codigoIva: number;
  baseImponible: number;
  importeIva: number;
}

export interface FiscalInvoiceTaxDto {
  codigoTributo: number;
  descripcion: string;
  baseImponible: number;
  alicuota: number;
  importeTributo: number;
}

export interface FiscalInvoiceDto {
  saleId: string;
  tipoComprobante: number; // 1=Factura A, 6=Factura B, 8=NC B, etc.
  puntoVenta: number;
  numeroComprobante: number;
  fechaEmision: string; // "YYYYMMDD"
  concepto: number;
  tipoDocReceptor: number;
  nroDocReceptor: number;
  nombreReceptor: string;
  importeTotal: number;
  importeNetoNoGravado: number;
  importeExento: number;
  importeNetoGravado: number;
  importeTributos: number;
  importeIva: number;
  cae: string | null;
  caeVencimiento: number | null; // ms epoch
  moneda: string;
  cotizacionMoneda: number;
  associatedCbteTipo?: number | null;
  associatedPtoVta?: number | null;
  associatedNro?: number | null;
  associatedCbteFch?: string | null;
  associatedCuit?: string | null;
  storeId: string;
  updatedAt: number;
  items: FiscalInvoiceItemDto[];
  vats: FiscalInvoiceVatDto[];
  taxes: FiscalInvoiceTaxDto[];
}
```

### Consulta Firestore Web (Firebase Web SDK v9+)
```typescript
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "./firebaseConfig";

/**
 * Consulta todas las facturas y notas de crédito de una sucursal
 */
export async function getInvoicesByStore(storeId: string): Promise<FiscalInvoiceDto[]> {
  const invoicesRef = collection(db, "fiscal_invoices");
  const q = query(
    invoicesRef,
    where("storeId", "==", storeId),
    orderBy("updatedAt", "desc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as FiscalInvoiceDto);
}

/**
 * Busca las Notas de Crédito asociadas a una Factura dada
 */
export async function CreditNotesForInvoice(cbteTipo: number, ptoVta: number, nro: number): Promise<FiscalInvoiceDto[]> {
  const invoicesRef = collection(db, "fiscal_invoices");
  const q = query(
    invoicesRef,
    where("associatedCbteTipo", "==", cbteTipo),
    where("associatedPtoVta", "==", ptoVta),
    where("associatedNro", "==", nro)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as FiscalInvoiceDto);
}
```

---

## 6. Impacto en Cuenta Corriente y Stock

### 6.1 Transacciones de Cuenta Corriente (`AccountTransactionEntity`)
- **Factura y Nota de Débito**: Generan una transacción de tipo `"DEBT"`.
  $$\text{Saldo Cliente} = \text{Saldo Actual} + \text{Monto Total}$$
- **Nota de Crédito**: Genera una transacción de tipo `"CREDIT"`.
  $$\text{Saldo Cliente} = \text{Saldo Actual} - \text{Monto Total}$$

### 6.2 Restitución Físico-Inventario de Materia Prima
Al emitir una **Nota de Crédito** por devolución física de mercadería:
- En la interfaz de usuario se habilita el switch *"Restituir stock de materia prima"*.
- Si está activado, la cantidad en kilogramos devuelta se incrementa automáticamente en el lote de materia prima activo del producto (`currentWeight = currentWeight + item.weight`).

---

## 7. Excepción de IVA para Comprobantes Clase C

Para comprobantes C (`11, 12, 13`):
- Los montos gravados e impositivos se resumen en `totalNet = totalAmount` e `importeIva = 0.00`.
- **No** se emite el nodo `<ar:Iva>` en la solicitud XML enviada a ARCA.

---

## 8. Código QR e Impresión de Tickets

En el ticket HTML generado por `ReportTemplates.buildSalesTicket`:
1. **Encabezado Dinámico**: Se ajusta a `"NOTA DE CRÉDITO"`, `"NOTA DE DÉBITO"` o `"COMPROBANTE DE DESPACHO"`.
2. **Sección Fiscal**: Incluye el tipo exacto (ej. `"NOTA DE CRÉDITO B"`), número de CAE, fecha de vencimiento y datos del comprobante asociado.
3. **Código QR (RG 4892/2020)**: Se codifica en Base64 la URL `https://www.arca.gob.ar/fe/qr/?p=...` conteniendo en `tipoCodCbte` el código oficial exacto (`2, 3, 7, 8, 12, 13`, etc.).
