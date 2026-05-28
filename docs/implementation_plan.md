# Plan de Implementación: Módulo de Servicio y Checadores (NFC)

Este es el corazón operativo de Apolo 11. Conectaremos la "Base de Mando" (PC) con el trabajo en campo de los "Checadores" (futura Aplicación Móvil) en tiempo real mediante Supabase.

## 1. Arquitectura de Pantallas (Módulo Servicio)

El módulo se construirá con 3 sub-pestañas:

1. **Roles y Tablas Predeterminadas:**
   - Una pantalla de configuración para crear plantillas fijas de horarios (ej. "Rol Entre Semana", "Rol de Sábado", "Rol de Domingo"). 
   - Aquí definirás a qué hora inician los servicios y con qué intervalos de tiempo (frecuencias).

2. **Rol de Despegue (Diario):**
   - El administrador o checador en la base "Nuevos Paseos" seleccionará la Tabla Predeterminada del día, y el sistema listará los horarios. El trabajo será simplemente asignar qué "Unidad ECO" y qué "Operador" saldrá en qué horario.
   - Este es el "plan de vuelo" oficial para ese día en específico.

3. **Tablas del Día (Tiempo Real / Frecuencias):**
   - Será un tablero de control vivo. Reemplazará la hoja de papel del tablerista.
   - Mostrará el avance de cada unidad sobre la ruta. Podrás ver la hora programada vs la hora real en la que el checador registró a la unidad.

## 2. Integración de App Móvil y Tiempo Real

> [!TIP]
> **El Ecosistema Apolo 11**
> La Base de Mando y la App Móvil de Checadores compartirán el mismo "cerebro" (Supabase). Utilizaremos una tecnología llamada **WebSockets (Realtime)**. Esto significa que en el instante en que un checador use su teléfono (NFC) en la calle, la "Tabla del Día" en la Base de Mando se actualizará **mágicamente al instante**, sin que el administrador tenga que recargar la página.

## 3. Arquitectura de Base de Datos

Prepararemos la base de datos para este ecosistema con tres tablas centrales:
- `tablas_predeterminadas`: Almacena los machotes o plantillas de los días.
- `rol_despegue_diario`: Guarda la asignación real de Unidades a Horarios de un día específico (conectado al módulo de Unidades).
- `frecuencias_checador`: Guardará el registro exacto cada vez que un checador "toque" una unidad (NFC), calculando automáticamente si la unidad va "En Tiempo", "Adelantada" o "Atrasada".

---

## Preguntas Abiertas e Indicaciones

> [!IMPORTANT]
> **Para construir la interfaz idéntica a lo que manejan hoy en día, ayúdame con esto:**
> 
> 1. **La Tabla de Papel:** En tu próximo mensaje, ¡compárteme la imagen o explícame las columnas que tiene esa hoja que usa el tablerista! (Ej. ¿Tiene "Hora de Salida", "Punto A", "Punto B", "Diferencia de minutos"?).
> 2. **Flujo del NFC:** Solo para tenerlo contemplado: ¿El chofer traerá una tarjeta NFC que el checador escanea con su teléfono celular, o el chip NFC irá pegado al autobús?
> 3. **Proceso de Desarrollo:** Te sugiero que primero construyamos estas 3 pantallas en la Base de Mando. Les pondré botones manuales temporales para que pruebes cómo funciona la tabla. Una vez validada la Base de Mando, procedemos a crear la aplicación móvil. ¿Estás de acuerdo con este orden?
