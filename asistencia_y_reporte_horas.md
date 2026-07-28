# Módulo de Control de Asistencia y Reporte de Horas (Especificación Técnica Completa)

Este documento detalla la especificación técnica completa de la gestión de fichadas de personal mediante lector de tarjetas RFID o manual, el modelo de datos en base de datos local y **Cloud Firestore**, los algoritmos de cálculo de horas y liquidaciones de sueldo, y la exportación de reportes a planillas Excel.

---

## 🏗️ Flujo de Negocio

El sistema permite a los operadores de sucursal gestionar la jornada laboral del personal:
1. **Fichada de Entrada (Check-In):** El empleado pasa su tarjeta RFID (o marca manualmente). Se genera un registro de tiempo (`EmployeeTimeLog`) con `checkInTime`.
2. **Control Anti-Doble Lectura:** Si un empleado vuelve a pasar su tarjeta dentro de un lapso menor a **15 minutos** (900.000 ms) desde su último fichaje, la lectura se ignora para prevenir registros duplicados accidentales.
3. **Fichada de Salida (Check-Out):** Al finalizar la jornada, se registra `checkOutTime`, calculando automáticamente la duración exacta trabajada (`workedHours`) y el total a pagar (`totalPayment`).
4. **Auto Check-Out (Salida Automática):** Si transcurren 12 horas sin marcar salida, el sistema cierra el turno automáticamente según el horario de la sucursal.

---

## 🗄️ Modelo de Datos Local y Firestore

### 1. Entidad Local de Fichaje (`EmployeeTimeLogEntity`)
```kotlin
@Entity(tableName = "employee_time_logs")
data class EmployeeTimeLogEntity(
    @PrimaryKey val id: String,
    val employeeId: String,
    val establishmentId: String,
    val checkInTime: Long,        // Timestamp epoch en milisegundos
    val checkOutTime: Long?,       // Timestamp epoch en milisegundos (null si está trabajando)
    val workedHours: Double,       // Duración en horas (ej: 8.5)
    val hourlyRate: Double,        // Tarifa por hora snapshot ($)
    val totalPayment: Double,      // Monto total a abonar por el turno ($)
    val isDirty: Boolean = false,
    val isDeleted: Boolean = false,
    val updatedAt: Long = 0L
)
```

---

## 🔥 Estructura y Colecciones en Cloud Firestore

Toda la información de empleados y fichadas se sincroniza automáticamente con **Cloud Firestore** en tiempo real. Esta estructura está lista para ser consumida por cualquier backend, Cloud Function, app web o dashboard de gestión externo.

### 📌 Colección 1: Empleados (`establishments/{establishmentId}/employees/{employeeId}`)
Subcolección dentro de cada documento de establecimiento.

#### **Esquema JSON del Documento:**
```json
{
  "name": "Juan Pérez",
  "position": "Operario de Producción",
  "dni": "35123456",
  "phone": "+5491144556677",
  "address": "Av. Corrientes 1234",
  "hourlyRate": 3500.0,
  "rfidCode": "A1B2C3D4",
  "paymentType": "HOURLY",
  "dailyFixedRate": 28000.0,
  "fixedDailyDepartureTime": "17:00",
  "priceListId": null,
  "updatedAt": 1784980000000
}
```

#### **Descripción de Campos:**
- `name` *(string)*: Nombre completo del empleado.
- `position` *(string)*: Cargo o puesto en la fábrica.
- `dni` *(string)*: Número de documento nacional de identidad.
- `phone` / `address` *(string)*: Datos de contacto.
- `hourlyRate` *(number)*: Tarifa estándar por hora trabajada ($).
- `rfidCode` *(string)*: Código identificador único hexadecimal o numérico del tag/tarjeta RFID.
- `paymentType` *(string)*: Modalidad de liquidación. Valores posibles:
  - `"HOURLY"`: Pago proporcional por hora trabajada.
  - `"FIXED_DAILY"`: Pago fijo por jornada/día con horario de salida preconfigurado.
- `dailyFixedRate` *(number)*: Monto de la jornada fija ($) aplicado cuando `paymentType == "FIXED_DAILY"`.
- `fixedDailyDepartureTime` *(string)*: Horario límite habitual de salida (formato `HH:mm`, ej: `"17:00"`).
- `updatedAt` *(number)*: Timestamp milisegundos epoch de la última modificación.

---

### 📌 Colección 2: Registros de Fichaje (`employee_time_logs/{logId}`)
Colección raíz donde se almacenan individualmente cada turno/fichada.

#### **Esquema JSON del Documento:**
```json
{
  "employeeId": "EMP_101",
  "establishmentId": "EST_MAIN",
  "checkInTime": 1784966400000,
  "checkOutTime": 1784995200000,
  "workedHours": 8.0,
  "hourlyRate": 3500.0,
  "totalPayment": 28000.0,
  "priceListId": null,
  "updatedAt": 1784995200000
}
```

#### **Descripción de Campos:**
- `employeeId` *(string)*: ID del empleado (`employees`).
- `establishmentId` *(string)*: ID de la sucursal/establecimiento donde fichó.
- `checkInTime` *(number)*: Timestamp epoch en milisegundos del ingreso (`ENTRADA`).
- `checkOutTime` *(number | null)*: Timestamp epoch en milisegundos de la salida (`SALIDA`). Si el empleado aún está trabajando, su valor es `null`.
- `workedHours` *(number)*: Total de horas netas trabajadas en formato decimal (ej: `8.5` equivale a 8h 30m).
- `hourlyRate` *(number)*: Tarifa por hora snapshot aplicada de forma inmutable a este fichaje.
- `totalPayment` *(number)*: Monto total liquidado por este turno ($).
- `updatedAt` *(number)*: Timestamp epoch en milisegundos de sincronización.

---

## 🧮 Algoritmo y Reglas de Cálculo de Horas y Pagos

### 1. Cálculo de Horas Trabajadas (`workedHours`)
La duración del turno se obtiene convirtiendo la diferencia en milisegundos a horas decimales:

$$\text{workedHours} = \max\left(0, \frac{\text{checkOutTime} - \text{checkInTime}}{1000 \times 60 \times 60}\right)$$

*Ejemplo:* Entrada `08:00:00` (ms) y Salida `16:30:00` (ms) $\rightarrow$ $(30.600.000\text{ ms}) / 3.600.000 = \mathbf{8.5\text{ horas}}$.

---

### 2. Algoritmo de Liquidación de Pagos (`totalPayment`)

El cálculo del monto a abonar depende de la propiedad `paymentType` del empleado y del horario de entrada:

#### **Caso A: Modalidad Pago Por Hora (`paymentType == "HOURLY"`)**
Se liquida directamente la cantidad de horas trabajadas por la tarifa horaria:
$$\text{totalPayment} = \text{workedHours} \times \text{hourlyRate}$$

---

#### **Caso B: Modalidad Pago Fijo por Día (`paymentType == "FIXED_DAILY"`)**
Se evalúa la hora de entrada (`checkInTime`) respecto del horario de salida preconfigurado (`fixedDailyDepartureTime`, ej: `"17:00"`):

1. **Turno Regular (Fichaje de entrada antes o a la hora de salida):**
   - El empleado realiza su jornada habitual. Se abona la tarifa fija acordada por día:
     $$\text{totalPayment} = \text{dailyFixedRate}$$
2. **Turno de Horas Extras (Re-ingreso o fichada posterior al horario de salida habitual):**
   - Si el empleado vuelve a fichar entrada después de las `17:00` (o de su `fixedDailyDepartureTime`), el turno se categoriza automáticamente como **Horas Extras**.
   - En este caso, el turno se liquida como pago por horas adicionales trabajadas:
     $$\text{totalPayment} = \text{workedHours} \times \text{hourlyRate}$$

---

## 💻 Ejemplos de Definiciones de Tipo (para Integración externa / OTRAS IAs)

### Interfaces TypeScript (Node.js / React / Next.js)
```typescript
export interface EmployeeDto {
  name: string;
  position: string;
  dni: string;
  phone: string;
  address: string;
  hourlyRate: number;
  rfidCode: string;
  paymentType: 'HOURLY' | 'FIXED_DAILY';
  dailyFixedRate: number;
  fixedDailyDepartureTime: string; // ej: "17:00"
  priceListId?: string | null;
  updatedAt: number;
}

export interface EmployeeTimeLogDto {
  employeeId: string;
  establishmentId: string;
  checkInTime: number; // ms epoch
  checkOutTime: number | null; // ms epoch o null si está activo
  workedHours: number;
  hourlyRate: number;
  totalPayment: number;
  priceListId?: string | null;
  updatedAt: number;
}

/**
 * Función de utilidad para calcular la liquidación en JS/TS
 */
export function calculatePayment(
  log: EmployeeTimeLogDto, 
  employee: EmployeeDto
): { totalPayment: number; isOvertime: boolean } {
  if (!log.checkOutTime) {
    return { totalPayment: 0, isOvertime: false };
  }

  const durationMs = log.checkOutTime - log.checkInTime;
  const workedHours = Math.max(0, durationMs / (1000 * 3600));

  if (employee.paymentType === 'FIXED_DAILY') {
    const checkInDate = new Date(log.checkInTime);
    const hourStr = String(checkInDate.getHours()).padStart(2, '0');
    const minStr = String(checkInDate.getMinutes()).padStart(2, '0');
    const checkInTimeStr = `${hourStr}:${minStr}`;

    const isOvertime = checkInTimeStr >= employee.fixedDailyDepartureTime;
    const totalPayment = isOvertime 
      ? workedHours * log.hourlyRate 
      : employee.dailyFixedRate;

    return { totalPayment, isOvertime };
  } else {
    return { 
      totalPayment: workedHours * log.hourlyRate, 
      isOvertime: false 
    };
  }
}
```

---

## 📊 Exportación a Excel (`FastExcel`)

La exportación en la pantalla de asistencia genera un archivo `.xlsx` estructurado en dos pestañas:

### Hoja 1: "Resumen General"
- Tabla consolidada por empleado con DNI, Cargo, RFID, Esquema de Pago (`Por Hora` vs `Fijo $X/día`), Días Fichados, Acumulado de Horas y Total Liquidado con fórmulas de sumatoria nativa `=SUM(...)`.

### Hoja 2: "Detalle por Empleado"
- Agrupación **empleado por empleado**. Desglosa cada día de la semana con nombre en español (ej. "Lunes 21/07/2026"), horas de entrada/salida en formato `HH:mm:ss`, indicación de turno (`Regular` vs `Horas Extras`), horas netas del día, tarifa aplicada y subtotal acumulado por trabajador.
