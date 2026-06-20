# Instrucciones de Ensamblaje: El Patrón "Menú 1"

El **"Menú 1"** es un patrón arquitectónico y de interfaz de usuario establecido para Base de Mando (BDM) y el Motor J2 que se debe utilizar SIEMPRE que vayamos a crear una nueva pestaña, módulo o sección que implique registrar datos en el tiempo (como Reportes, Incidencias, Control de Unidades, etc.).

## 1. ¿En qué consiste el "Menú 1"?
Es un sistema maestro-detalle dividido en dos fases:
1. **Fase 1: Creación de la "Hoja Maestra"**
   - No se registran datos (incidencias, reportes, etc.) al aire.
   - Todo registro debe vivir dentro de una **Hoja Diaria** (e.g., *Hoja de Incidencias*, *Hoja de Proyección OTP*).
   - En la vista principal del módulo se crea esta "Hoja" seleccionando:
     - **Base** (Limitado a: Indios Verdes, Nuevos Paseos, Lagos 2)
     - **Fecha** (Por defecto el día de hoy, pero con opción a modificar).
   - Se crea el registro maestro en Supabase (ej. tabla `hojas_incidencias`).

2. **Fase 2: Editor del Detalle (La Lista de Registros)**
   - Al darle "Abrir" o "Ver" a la Hoja Maestra, el usuario navega al **Editor** de esa hoja.
   - En el editor se visualiza en la cabecera: Nombre del Reporte, Base, Fecha y Usuario creador.
   - Debajo, se encuentra la lista interactiva de elementos (Incidencias, Vueltas, Inspecciones).
   - **Botones Fundamentales:** Cada elemento en la lista debe tener su ícono para editar (Lápiz) y eliminar (Basurero). *(Nota: Si el requerimiento pide quitar permisos de edición, se omite el Lápiz, pero el patrón base lo requiere).*

## 2. Instrucciones Técnicas de Implementación

### Base de Datos (Supabase)
Si vas a crear un nuevo módulo (Ej: `Inspecciones`), necesitas DOS tablas:
1. `hojas_inspecciones`
   - `id` (uuid, primary key)
   - `fecha` (date)
   - `base` (text)
   - `creado_por` (uuid, opcionalmente el email del user auth)
2. `inspecciones_registros`
   - `id` (uuid, primary key)
   - `hoja_id` (uuid, foreign key hacia `hojas_inspecciones(id)`)
   - `...campos_de_datos...`

### Interfaz Web (Base de Mando - React)
1. **Página Principal del Módulo:** Muestra un Dashboard con un botón grande "+ Nueva Hoja". Abajo un grid de tarjetas mostrando las hojas generadas recientemente.
2. **Página de Edición (Menú 1):** Un layout limpio de tabla. Los campos de texto libres que sean largos (Observaciones, Descripción) ocuparán columnas anchas sin amontonar la vista, truncados (`numberOfLines={2}`) o expandibles.

### App Móvil (Motor J2 - React Native)
1. Utiliza `expo-router`.
2. Crea `/(tabs)/modulo.tsx` para el listado de hojas.
3. Crea `/editor-modulo.tsx` para abrir el detalle y agregar registros utilizando modales o bottom sheets para ingresar los datos del catálogo.

### Exportación Estándar (ViewShot Obligatorio)
- Toda hoja del Menú 1 **DEBE poder exportarse a WhatsApp como imagen**.
- Utiliza la técnica del componente de "Exportación Fantasma" en `editor-modulo.tsx`:
  - Construye la tabla formal de exportación (con logos WITCH, color `#f1f5f9` en encabezados y `#ffffff` de fondo).
  - Envuélvelo en un `<ViewShot>` y posiciónalo de forma absoluta fuera de la pantalla (`position: 'absolute', top: -10000`).
  - Llama a `viewShotRef.current.capture()` dentro del flujo de `react-native-view-shot` + `expo-sharing` con un pequeño `setTimeout` para asegurar la renderización. Nunca uses un ScrollView principal para envolver esta exportación.
