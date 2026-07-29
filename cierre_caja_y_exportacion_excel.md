# Módulo de Cierre de Caja y Exportación Automática a Excel (Especificación Técnica Completa)

Este documento detalla la especificación técnica completa del flujo de arqueo contable al cerrar la sesión de caja diaria de la carnicería, las colecciones en **Cloud Firestore**, la unificación de balances y la exportación de reportes desatendidos.

---

## 🏗️ Flujo de Negocio

Al finalizar el turno comercial, el cajero realiza el cierre de caja mediante los siguientes pasos:
1. **Conteo de Valores Físicos:** El cajero declara el saldo real disponible en la caja física:
   - Efectivo físico en pesos (`actualCash`).
   - Comprobantes de transacciones electrónicas (`actualElectronic` - tarjetas/transferencias).
   - Cheques en cartera (`actualCheck`).
   - Notas aclaratorias u observaciones (`notes`).
2. **Cálculo de Esperado vs Declarado:** El sistema compara estos valores contra el balance acumulado teóricamente en la base de datos local y determina los sobrantes o faltantes individuales.
3. **Guardado y Sincronización:** Tras confirmar el cierre, la sesión pasa a estado `CLOSED` y se sincroniza automáticamente con Firestore.
4. **Exportación Silenciosa a Excel:** Se genera el archivo `.xlsx` de arqueo con la nomenclatura:
   `Cierre_Caja_{NombreCarniceria}_{dd-MM-yyyy_HH-mm-ss}.xlsx`

---

## 🗄️ Modelo de Datos Local y Firestore

### 1. Entidad Local de Sesión de Caja (`CashSessionEntity`)
```kotlin
@Entity(tableName = "cash_sessions")
data class CashSessionEntity(
    @PrimaryKey val id: String,
    val openedAt: Long,             // Timestamp ms epoch de apertura
    val closedAt: Long?,            // Timestamp ms epoch de cierre (null si está OPEN)
    val status: String,             // "OPEN" o "CLOSED"
    val operatorEmail: String,
    val initialCash: Double,        // Fondo inicial de caja ($)
    val expectedCash: Double,       // Efectivo teórico ($)
    val expectedElectronic: Double, // Cobros electrónicos teóricos ($)
    val expectedCheck: Double,      // Cheques teóricos ($)
    val expectedDebt: Double,       // Ventas a Cuenta Corriente teóricas ($)
    val totalExpenses: Double,      // Gastos pagados en caja ($)
    val actualCash: Double?,        // Efectivo físico declarado por el cajero ($)
    val actualElectronic: Double?,  // Electrónico declarado por el cajero ($)
    val actualCheck: Double?,       // Cheques declarados por el cajero ($)
    val notes: String = "",         // Observaciones del cajero
    val isDirty: Boolean = false,
    val isDeleted: Boolean = false,
    val updatedAt: Long = 0L
)
```

---

## 🔥 Estructura y Colecciones en Cloud Firestore

Las sesiones de caja y las extracciones de efectivo se sincronizan en tiempo real en Cloud Firestore para su consumo web o desde paneles de control externos.

### 📌 Colección 1: Sesiones de Caja (`cash_sessions/{sessionId}`)

#### **Esquema JSON del Documento:**
```json
{
  "openedAt": 1784966400000,
  "closedAt": 1785009600000,
  "status": "CLOSED",
  "operatorEmail": "cajero.sucursal1@fabrica.com",
  "initialCash": 50000.0,
  "expectedCash": 320500.0,
  "expectedElectronic": 145000.0,
  "expectedCheck": 80000.0,
  "expectedDebt": 65000.0,
  "totalExpenses": 12000.0,
  "actualCash": 320000.0,
  "actualElectronic": 145000.0,
  "actualCheck": 80000.0,
  "notes": "Faltante de $500 en efectivo por cambio de vuelto al inicio del turno.",
  "updatedAt": 1785009600000
}
```

#### **Descripción de Campos:**
- `openedAt` *(number)*: Timestamp epoch (ms) del momento de apertura de caja.
- `closedAt` *(number | null)*: Timestamp epoch (ms) del momento del cierre. `null` si la caja está abierta (`status == "OPEN"`).
- `status` *(string)*: Estado de la caja: `"OPEN"` (abierta) o `"CLOSED"` (cerrada).
- `operatorEmail` *(string)*: Email o usuario del cajero que operó la sesión.
- `initialCash` *(number)*: Fondo o cambio inicial de caja en efectivo ($).
- `expectedCash` *(number)*: Efectivo esperado calculado por el sistema ($).
- `expectedElectronic` *(number)*: Total de cobros en tarjeta / transferencia ($).
- `expectedCheck` *(number)*: Total de cobros en cheques ($).
- `expectedDebt` *(number)*: Total de ventas fiadas a Cuenta Corriente ($).
- `totalExpenses` *(number)*: Total de gastos operativos abonados desde la caja ($).
- `actualCash` *(number | null)*: Efectivo real contado y declarado por el cajero ($).
- `actualElectronic` *(number | null)*: Total de cupones/comprobantes electrónicos declarados ($).
- `actualCheck` *(number | null)*: Total de cheques físicos declarados ($).
- `notes` *(string)*: Aclaraciones u observaciones del operador al momento del cierre.
- `updatedAt` *(number)*: Timestamp epoch (ms) de sincronización.

---

### 📌 Colección 2: Retiros de Efectivo (`cash_extractions/{extractionId}`)
Registra los retiros parciales de efectivo entregados al camión de caudales o al guardia de seguridad durante el turno.

#### **Esquema JSON del Documento:**
```json
{
  "cashSessionId": "SESSION_2026_07_25_001",
  "amount": 150000.0,
  "description": "Entrega a Seguridad de Turno Tarde - Guardia González",
  "timestamp": 1784995200000,
  "butcheryName": "Carnicería Sucursal Centro",
  "billeteBreakdownJson": "[{\"denominacion\":10000,\"fajos\":1,\"sueltos\":5},{\"denominacion\":2000,\"fajos\":2,\"sueltos\":0}]",
  "updatedAt": 1784995200000
}
```

#### **Desglose de Billetes en `billeteBreakdownJson`:**
El campo `billeteBreakdownJson` contiene un string JSON serializado con el detalle de denominaciones:
```json
[
  {
    "denominacion": 10000,
    "fajos": 1,
    "sueltos": 5
  },
  {
    "denominacion": 2000,
    "fajos": 2,
    "sueltos": 0
  }
]
```
* **Fórmula Subtotal por Denominación:**
  $$\text{Subtotal} = ((\text{fajos} \times 100) + \text{sueltos}) \times \text{denominacion}$$
  *Ejemplo:* (1 fajo $\times$ 100 + 5 sueltos) $\times$ $10.000 = 105 \times 10.000 = \mathbf{\$1.050.000}$.

---

## 🧮 Algoritmo y Reglas de Arqueo y Cuadre de Caja

### 1. Clasificación por Métodos de Cobro
- **`CASH` (Efectivo):** Suma al saldo líquido en caja.
- **`CARD` / `TRANSFER` (Electrónico):** Suma al saldo de billetera / posnet.
- **`CHECK` (Cheques):** Suma al saldo en cartera de cheques.
- **`ACCOUNT` (Cuenta Corriente / Fiado):** Se acumula en `expectedDebt`. **NO cuenta para el saldo físico en caja**, evitando distorsionar el efectivo líquido real.

---

### 2. Cálculo del Efectivo Esperado (`expectedCash`)
El saldo teórico de efectivo en caja se calcula mediante la fórmula:

$$\text{expectedCash} = \text{initialCash} + \sum \text{VentasEfectivo} - \sum \text{GastosCaja} - \sum \text{RetirosEfectivo}$$

---

### 3. Cálculo de Diferencias (Sobrantes / Faltantes)

Al cerrar la caja, el sistema compara lo declarado vs lo esperado:

- **Diferencia de Efectivo:** $\Delta_{\text{Efectivo}} = \text{actualCash} - \text{expectedCash}$
  - Si $\Delta > 0$: **Sobrante de caja (+)**.
  - Si $\Delta < 0$: **Faltante de caja (-)**.
- **Diferencia Electrónica:** $\Delta_{\text{Electrónico}} = \text{actualElectronic} - \text{expectedElectronic}$
- **Diferencia Cheques:** $\Delta_{\text{Cheques}} = \text{actualCheck} - \text{expectedCheck}$

---

## 💻 Ejemplos de Definiciones de Tipo (para Integración web / OTRAS IAs)

### Interfaces TypeScript (Node.js / React / Next.js)

```typescript
export interface CashSessionDto {
  openedAt: number; // Timestamp ms
  closedAt: number | null; // null si está OPEN
  status: 'OPEN' | 'CLOSED';
  operatorEmail: string;
  initialCash: number;
  expectedCash: number;
  expectedElectronic: number;
  expectedCheck: number;
  expectedDebt: number;
  totalExpenses: number;
  actualCash: number | null;
  actualElectronic: number | null;
  actualCheck: number | null;
  notes: string;
  updatedAt: number;
}

export interface BilleteDetalle {
  denominacion: number;
  fajos: number;
  sueltos: number;
}

export interface CashExtractionDto {
  cashSessionId: string;
  amount: number;
  description: string;
  timestamp: number;
  butcheryName: string;
  billeteBreakdownJson: string; // Parsear con JSON.parse() -> BilleteDetalle[]
  updatedAt: number;
}

/**
 * Función de utilidad en JS/TS para analizar el balance de la caja
 */
export function analyzeCashSession(session: CashSessionDto) {
  if (session.status !== 'CLOSED' || session.actualCash === null) {
    return { isClosed: false, diffCash: 0, diffElectronic: 0, diffCheck: 0 };
  }

  const diffCash = session.actualCash - session.expectedCash;
  const diffElectronic = (session.actualElectronic ?? 0) - session.expectedElectronic;
  const diffCheck = (session.actualCheck ?? 0) - session.expectedCheck;

  return {
    isClosed: true,
    diffCash,
    diffElectronic,
    diffCheck,
    hasCashShortage: diffCash < 0,
    hasCashSurplus: diffCash > 0
  };
}

/**
 * Parsea el desglose de billetes de un retiro de efectivo
 */
export function parseBilleteBreakdown(jsonStr: string): { items: BilleteDetalle[]; calculatedTotal: number } {
  if (!jsonStr) return { items: [], calculatedTotal: 0 };
  try {
    const items: BilleteDetalle[] = JSON.parse(jsonStr);
    const calculatedTotal = items.reduce((acc, b) => {
      const totalBilletes = (b.fajos * 100) + b.sueltos;
      return acc + (totalBilletes * b.denominacion);
    }, 0);
    return { items, calculatedTotal };
  } catch (e) {
    return { items: [], calculatedTotal: 0 };
  }
}
```

---

## 📊 Estructura del Reporte Excel Generado (`FastExcel`)

El archivo `.xlsx` de Cierre de Caja consta de dos pestañas:

### Hoja 1: "Resumen de Caja"
1. **Encabezado Comercial:** Nombre de la carnicería, email del operador, fecha y hora de apertura y cierre.
2. **Cuadro Comparativo de Arqueo:**
   - Filas: `Efectivo en Caja`, `Cobros Electrónicos (Tarjetas/Transf.)`, `Cheques en Cartera`.
   - Columnas: `Esperado ($)`, `Declarado ($)`, `Diferencia ($)` (con formato condicional).
3. **Cobros a Cuenta Corriente (Fiado):** Muestra el total `Ventas a Cuenta Corriente` informativo.
4. **Notas del Cierre:** Caja de texto con las observaciones declaradas por el operador.
5. **Retiros de Efectivo (Entregas a Seguridad):** Tabla con fecha/hora, detalle/guardia, monto retirado y el desglose de billetes (fajos, sueltos y subtotales por denominación).

### Hoja 2: "Detalle de Movimientos"
- Registro cronológico de todas las ventas, gastos y extracciones ocurridos durante la sesión de caja con número de comprobante, tipo de pago y monto.
