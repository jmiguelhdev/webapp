# Documentación de la Colección Firestore: `cash_extractions` (Especificación Técnica Completa)

Esta documentación detalla la estructura y el esquema de la colección de Cloud Firestore para los retiros de efectivo de caja (entregas de fajos y sobrantes a personal de seguridad / caudales), permitiendo su consumo fácil y directo por aplicaciones web, paneles de administración, microservicios o dashboards en tiempo real.

---

## 🗂️ Información General de la Colección

* **Nombre de la Colección en Firestore:** `cash_extractions`
* **Tipo de Documento:** Cada documento representa un retiro individual de efectivo realizado durante un turno de caja activo.
* **ID del Documento:** Generado dinámicamente con el formato `EXTRACT_{timestamp}_{random}` (ej: `EXTRACT_1783478239000_4821`).

---

## 📋 Estructura del Documento (Esquema JSON)

```json
{
  "cashSessionId": "SESSION_1783478100000",
  "amount": 150000.0,
  "description": "Guardia Juan Pérez - Precinto #48210",
  "butcheryName": "Carnicería Sucursal Centro",
  "timestamp": 1783478239000,
  "billeteBreakdownJson": "[{\"denominacion\":10000,\"fajos\":1,\"sueltos\":5},{\"denominacion\":2000,\"fajos\":2,\"sueltos\":0}]",
  "updatedAt": 1783478239000
}
```

---

## 🔍 Descripción de Campos

| Campo | Tipo | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- |
| `cashSessionId` | **String** | ID de la sesión de caja de origen (`cash_sessions`). | `"SESSION_1783478100000"` |
| `amount` | **Number** | Monto total de efectivo retirado ($). | `150000.00` |
| `description` | **String** | Detalle de la entrega, incluyendo nombre del personal de seguridad, número de precinto u observaciones. | `"Guardia Juan Pérez - Precinto #48210"` |
| `butcheryName` | **String** | Nombre de la sucursal o carnicería donde se realizó el retiro. | `"Carnicería Sucursal Centro"` |
| `timestamp` | **Number** | Timestamp Unix en milisegundos en el que se realizó la extracción. | `1783478239000` |
| `billeteBreakdownJson` | **String** | String JSON que contiene la lista serializada de denominaciones, fajos de 100 billetes y sueltos. | `"[{\"denominacion\":10000,\"fajos\":1,\"sueltos\":5}]"` |
| `updatedAt` | **Number** | Timestamp Unix en milisegundos para sincronización y ordenamiento de auditoría. | `1783478239000` |

---

## 💵 Estructura del Desglose de Billetes (`billeteBreakdownJson`)

Al parsear el string JSON almacenado en `billeteBreakdownJson`, se obtiene un array de objetos con la siguiente estructura:

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

### 🧮 Fórmula de Cálculo de Totales por Billetes
* **Total Billetes por Denominación:** $\text{totalBilletes} = (\text{fajos} \times 100) + \text{sueltos}$
* **Subtotal por Denominación ($):** $\text{subtotal} = \text{totalBilletes} \times \text{denominacion}$

---

## 💻 Integración en TypeScript / Web (Ejemplo para OTRAS IAs)

### Interfaces TypeScript
```typescript
export interface BilleteDetalle {
  denominacion: number; // Ej: 10000, 2000, 1000, 500
  fajos: number;        // Cantidad de fajos de 100 billetes
  sueltos: number;      // Billetes sueltos
}

export interface CashExtractionDto {
  cashSessionId: string;
  amount: number;
  description: string;
  butcheryName: string;
  timestamp: number;      // ms epoch
  billeteBreakdownJson: string; // Serialización JSON de BilleteDetalle[]
  updatedAt: number;
}

/**
 * Parsea y calcula los subtotales del desglose de billetes
 */
export function parseCashExtractionBreakdown(extraction: CashExtractionDto): {
  items: (BilleteDetalle & { totalBilletes: number; subtotal: number })[];
  totalCalculated: number;
} {
  if (!extraction.billeteBreakdownJson) {
    return { items: [], totalCalculated: 0 };
  }

  try {
    const raw: BilleteDetalle[] = JSON.parse(extraction.billeteBreakdownJson);
    let totalCalculated = 0;

    const items = raw.map((b) => {
      const totalBilletes = b.fajos * 100 + b.sueltos;
      const subtotal = totalBilletes * b.denominacion;
      totalCalculated += subtotal;

      return {
        ...b,
        totalBilletes,
        subtotal
      };
    });

    return { items, totalCalculated };
  } catch (err) {
    console.error("Error al parsear billeteBreakdownJson:", err);
    return { items: [], totalCalculated: 0 };
  }
}
```

### Ejemplo de Consulta Firestore (Firebase Web SDK v9+)
```typescript
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "./firebaseConfig";

export async function getExtractionsBySession(sessionId: string): Promise<CashExtractionDto[]> {
  const extractionsRef = collection(db, "cash_extractions");
  const q = query(
    extractionsRef, 
    where("cashSessionId", "==", sessionId),
    orderBy("timestamp", "desc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as CashExtractionDto);
}
```
