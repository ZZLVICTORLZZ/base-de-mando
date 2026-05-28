# Lógica de Negocio - Proyecto Apolo 11 🚌

Este documento sirve como referencia de la operativa diaria de la empresa para guiar el desarrollo de la base de datos y la interfaz de usuario.

## Perfiles y Tareas

1. **Taquillero**:
   - Imprime boletos físicos y cobra directamente a los pasajeros.
   - Su objetivo es reducir el manejo de efectivo por parte del Operador (Chofer).
   - Aborda las unidades principalmente en la segunda vuelta en la base "Nuevos Paseos".
   - **Restricción de Hardware:** Los boletos se imprimen de un Host Local, es decir, el sistema bloqueará la impresión a menos que se haga desde una PC autorizada específicamente para Taquilla, evitando malversaciones desde otras oficinas.

2. **Monitorista**:
   - Responsable de auditar la cantidad de pasajeros ("Aforo") usando las grabaciones de cámara (DVR) de la unidad.
   - **Flujo**: Al inicio del día en la base "Nuevos Paseos" (el Despegue), retira la memoria SD/DVR del día anterior de la unidad y coloca una vacía para el día en curso. En una computadora, revisa la grabación anterior para contar pasajeros.
   - **Cálculo**: Valida si los pasajeros mostraron credencial de descuento en la cámara y calcula el ingreso total esperado dependiendo del punto de subida/bajada (tarifario por ubicación).
   - **Balance Financiero:** Realiza el balance final de lo generado contra lo gastado. Toma en cuenta cobros extra como: "Fianza" (ahorro del operador para percances), "Mutualidad", "Seguridad" (cobros de la empresa) y "Vales de Diésel". El objetivo es entregar la *Utilidad Neta* real de la unidad.
   - **Cierre**: Envía el reporte de Aforo a "Recaudación" para que sepan cuánto cobrar.

3. **Recaudador**:
   - Cobra al Operador (Chofer) al llegar a la base "Indios Verdes".
   - **Recepción**: Recibe tanto el efectivo que cobró el chofer como el boletaje recolectado por taquilla.
   - **Auditoría**: Cruza la información del dinero entregado contra el "Aforo" calculado por el Monitorista para validar cuadres y liquidar.

4. **Operador (Chofer)**:
   - Conduce la unidad.
   - Entrega cuentas en Recaudación.
   - Reporta si laborará al día siguiente para programar roles.
   - Lleva el control estricto de sus propios boletos.
   - **Identidad NFC:** El operador porta una Tarjeta Inteligente NFC asignada. Esta tarjeta vincula su identidad con los datos de la unidad asignada. Si la pierde, paga reposición y se reprograma un plástico nuevo. Es su "llave" para registrar entradas, salidas y liquidaciones.

## Ciclo de Vida del Viaje (Servicio)
1. **Despegue**: Inicia en base "Nuevos Paseos" en la mañana. Monitorista cambia la memoria de la cámara.
2. **Ruta Subida**: Carga pasaje sobre la ruta hasta llegar a "Indios Verdes".
3. **Corte**: En Indios Verdes, entrega cuenta a Recaudación.
4. **Ruta Bajada**: Regresa hacia "Nuevos Paseos".
5. **Promedio**: Una unidad da 3 vueltas completas (3 subidas a Indios Verdes, 3 bajadas a Nuevos Paseos).
6. **Taquilla**: En la segunda bajada a Nuevos Paseos interviene la Taquillera.
7. Al día siguiente se reinicia el ciclo.

---

## Tablas de Frecuencia (Reporte de Salidas)
La operación diaria se controla mediante una bitácora en vivo operada por el "Checador".

- **Columnas de Control (Base de Mando):**
  - `NO.` (Número consecutivo de salida).
  - `FREC.` (Frecuencia en minutos respecto a la salida anterior. La primera salida del día marca "I.F." - Inicio de Frecuencia).
  - `H. ENTRADA` (Hora de llegada de la unidad a la base).
  - `H. SALIDA` (Hora de despacho/salida de la unidad).
  - `PAX` (Pasajeros abordados en el punto).
  - `ECO` (Número Económico de la unidad asignada).

- **Dinámica Digital:** El Tablerista ya no escribe en papel. El checador usa una **Aplicación Móvil** para escanear la Tarjeta NFC del Operador al llegar o salir de la base. Al hacer el toque NFC, la "Tabla del Día" en la Base de Mando (PC) se llena automáticamente en tiempo real gracias a Supabase WebSockets.
