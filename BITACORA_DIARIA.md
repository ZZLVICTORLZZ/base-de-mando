# Bitácora de Desarrollo - Proyecto Base de Mando (Saturno V)

Esta bitácora está diseñada específicamente como un **traspaso de contexto para mí misma (la IA)**. El objetivo es que, en futuras sesiones (como al retomar el trabajo desde casa), pueda leer esto y entender a la perfección el estado del proyecto, la arquitectura y las reglas de negocio implementadas.

## 1. Contexto General y Estética del Proyecto
*   **Tema Principal:** Sistema Saturno V, una aplicación para la gestión logística de flotillas (autobuses/unidades).
*   **Estilo Visual ("Virreinato"):** Hemos establecido una estética estricta y premium.
    *   **Colores Base:** Fondo "hueso" (`#F5F5DC` o `#EAE5CE`), Verde Bandera (`#006847`), Rojo Cherry (`#D2042D`), y textos en Negro puro o Gris muy oscuro (nunca blanco sobre hueso).
    *   **Marcatextos (Highlighters):** Se utiliza una paleta de tonos vibrantes neón (`#FF1493` Rosa, `#00FFFF` Cyan, `#39FF14` Verde, `#FFFF00` Amarillo, `#FF8C00` Naranja). El color blanco/hueso se eliminó como marcador; para borrar se usa un botón transparente con un icono de *slash*.

## 2. Proyecciones OTP (`editor-otp.tsx`) - Arquitectura y Lógica
Este es el módulo más complejo hasta ahora, utilizado para proyectar rutas y tiempos.
*   **Rendimiento Extremo (FlatList):** La tabla interactiva ya NO usa `ScrollView` + `.map()`. Debido a que se manejan más de 50 a 100 corridas, se migró exitosamente a `FlatList`. Los botones de agregar turno y duplicar vuelta están inyectados de forma segura dentro del `ListFooterComponent`.
*   **Exportación a Imagen (`react-native-view-shot`):** Al presionar "Compartir", la app dibuja la tabla en dos columnas (para optimizar espacio) en un lienzo temporal (con color de fondo hueso) y la exporta por WhatsApp. **Dato vital:** Se ajustó el motor de renderizado para darle 400ms a React de dibujar el componente *antes* de capturarlo, ya que está condicionado a la variable de estado `isExporting`. **Nota importante: la exportación siempre se hace en modo Claro/Hueso, sin importar si el usuario tiene el modo oscuro activado**.
*   **Encabezado de Exportación y Tablerista (Actualizado):**
    *   **Subtítulo de Rol (Plantilla):** Justo debajo del título principal `PROYECCIÓN OTP - [BASE]`, el sistema ahora muestra un subtítulo en negritas y letra más chica indicando el tipo de rol original cargado: `Rol: [Nombre de la Plantilla]` (ej. *Rol: Entre Semana*, *Rol: Sabatino*). Se guarda dinámicamente en el campo `creado_por` como tercer parámetro separado por `|` (`[OTP] user | base | tipoRol`).
    *   **Nombre de Tablerista por Defecto:** Se configuró el sistema para que si el nombre de tablerista es genérico ("Tablerista") o vacío, se asigne y muestre automáticamente el nombre del usuario: **`Emiliano`**. Así, en la imagen exportada siempre dirá `Sistema Saturno V | Elaboró: Emiliano` (hasta que se active un módulo de login/usuarios multi-cuenta).
*   **Observaciones sin Truncamiento:** En el lienzo de exportación, las celdas de "OBS" tienen `flexWrap: 'wrap'` y `flexShrink: 1` para que el texto (ej. "carga mercado") crezca verticalmente y nunca se recorte.
*   **Lógica de "Duplicar Vuelta" (Backtracking):** 
    *   El usuario requería que al duplicar, la numeración ("Vuelta 2", "Vuelta 3") fuera precisa. 
    *   *Regla de negocio:* El sistema busca en el historial de la tabla (de abajo hacia arriba) construyendo un `Set` de "Ecos" (camiones). Cuando encuentra un Eco repetido, asume que ha encontrado el límite de la última vuelta real. Al extraer esa vuelta, ignora automáticamente unidades pintadas con marcatextos (que representan autobuses) y unidades cuya frecuencia dice 'S.F.' (Sin Frecuencia).
    *   *Conteo:* Para asignar el número de vuelta, cuenta cuántas veces ha aparecido el **primer Eco clonado** en toda la historia de la tabla. Si apareció 2 veces, escribe "Vuelta 3".

## 3. UI/UX "Evolución" y Homologación Integral (`editor-otp.tsx` y `editor-rol.tsx`)
*   **Modo Oscuro ("Night Shift"):** Se integró un toggle (Sol/Luna) en el header de OTP y en el Editor de Roles (`editor-rol.tsx`). Transforma dinámicamente la UI a fondos `#1A1A1A` y celdas `#222` para el trabajo nocturno.
*   **Gestos Dinámicos Optimizados (Swipeable):**
    *   Tanto en `editor-otp.tsx` como en `editor-rol.tsx`, se reemplazaron los antiguos botones de doble barra lateral por filas con `Swipeable` de `react-native-gesture-handler`.
    *   Se ajustó la sensibilidad del gesto (`friction={1}`, `rightThreshold={15}`, `overshootRight={true}`) para que deslizar en celular sea mucho más dinámico y suave.
    *   Para evitar conflictos de navegación donde el teléfono interpreta el gesto hacia la derecha como "Regresar" y borra el progreso, las acciones secundarias y botones se ubicaron estratégicamente.
*   **Autoguardado Silencioso en Tiempo Real:**
    *   En `editor-otp.tsx` y `editor-rol.tsx` se implementó autoguardado inteligente cada 2.5 segundos ante cualquier cambio en la tabla.
    *   El encabezado muestra el indicador visual `⚡ Guardado [HH:MM:SS]` confirmando la sincronización en base de datos sin necesidad de cerrar la hoja.
*   **Homologación Estética de Exportación:**
    *   `editor-incidencias.tsx`, `editor-otp.tsx` y `editor-rol.tsx` comparten el mismo diseño Virreinato para la exportación a WhatsApp: fondo crema luminoso `#FDF8ED`, encabezado de tabla en verde menta `#88D8C0`, y la firma `Elaboró: Emiliano`.
*   **Homologación y Ajuste Fino en Editor de Roles (`editor-rol.tsx`):**
    *   **Formato de Burbujas 3D (Cápsulas):** Se diferenció el color de fondo de la fila (`#F5F5DC`) respecto al input (`#EAE5CE` / `#FFFFFF` en modo claro con `borderRadius: 20` y elevación de sombra), logrando que los campos de Horario, Frecuencia y ECO luzcan como burbujas táctiles idénticas a OTP.
    *   **Disposición de Marcatextos:** Se movió el contenedor de marcatextos desde la parte superior a un contenedor flotante inferior estilo píldora (`marcatextosContainer` en `position: absolute, bottom: 100`), idéntico a la disposición de OTP (`editor-otp.tsx`).
    *   **Anti-amontonamiento (Desahogo de Columnas):** Se recalibraron las proporciones flex de las columnas (`NO.`: 0.4, `FREC.`: 0.9, `HORARIO`: 1.5, `ECO`: 1.1) y se redujo el relleno excesivo para que los horarios y frecuencias tengan amplio espacio en pantallas móviles.
    *   **Encabezado de Reporte de WhatsApp (Día Siguiente):** El reporte exportado ahora calcula automáticamente la fecha del día siguiente en español en mayúsculas (`ROL DESPEGUE [DÍA] [NÚMERO] DE [MES] [AÑO]`, ej. *ROL DESPEGUE SÁBADO 11 DE JULIO 2026*) y muestra debajo el nombre de la plantilla utilizada (`PLANTILLA: ENTRE SEMANA`).

## 4. Base de Mando (Dashboard Web) - Sub-Pestaña de Operadores (`RecursosHumanos.tsx`)
*   Se creó y rediseñó la sub-pestaña **Perfiles de Operadores (Expediente Digital)** accesible mediante `/recursos-humanos` u `/operadores`.
*   Permite cargar perfiles completos de operadores con: Nombre, Apellidos, Teléfono de WhatsApp, Unidad Asignada (ECO), Nº y Vigencia de Licencia, Tipo de Sangre, Rol Preferido, Estatus Operativo y Calificación de Confiabilidad Saturno V.
*   Incluye vista en cuadrícula (Grid) de tarjetas profesionales con botón directo de contacto por WhatsApp.

## 5. Área de Estadística y Análisis de Servicio (`Estadisticas.tsx` & `Estadisticas.css`)
*   **Sub-pestaña "Análisis de Servicio":** Interfaz visual futurista nativa Glassmorphism Saturno V en `Estadisticas.tsx` accesible mediante `/estadisticas` o `/analisis-servicio`.
*   **Cerebro Real de Análisis (Analytics Engine):**
    *   **Filtrado Doble (Base y Rango de Fechas):**
        *   **Por Base:** Selector para filtrar por **TODAS LAS BASES**, **NUEVOS PASEOS**, **LAGOS 2** e **INDIOS VERDES**.
        *   **Por Hoja OTP Específica:** Selector para aislar una tabla de rol específica o analizar todas las tablas dentro del periodo.
        *   **Calendario de Rango de Fechas (`Desde` — `Hasta`):** Selector interactivo para acotar el análisis al periodo exacto que el operador desea revisar.
    *   **Horario Operativo Completo (`04:00` a `00:00` Cierre):** Cobertura extendida hora por hora desde la primera salida de la madrugada hasta el cierre del servicio a las 12:00 AM (00:00).
    *   **Promedios Reales e Inteligentes por Día de la Semana (`N=muestras`):** Panel interactivo que calcula el promedio exacto de pasajeros y salidas por día de la semana (ej. promedio de pasaje en Viernes vs. Lunes) y la frecuencia promedio en minutos.
    *   **Cerebro de Sugerencias Operativas Saturno V:** Recomendaciones automáticas para ajustar frecuencias en horas pico, optimizar ocupación en periodos valle y reforzar salidas los días de máxima demanda.
    *   **Lectura Estricta de Pasaje Real (`row.pasajeros ?? row.pax ?? row.aforo`):** Corrección del motor para interpretar fielmente el conteo real de pasajeros sin autocompletar con 36 cuando el campo viene en 0 o bajo la clave `pax`.
    *   **Gráfica Multibarra Comparativa Horaria entre Días:** Panel interactivo inferior con botones tipo píldora (`Lunes` a `Domingo`) con código de color que permite comparar en paralelo la afluencia hora por hora entre múltiples días seleccionados en el rango de fechas actual.
    *   **Agrupaciones Dinámicas en 4 Niveles:**
        1. **Horas Pico:** Conteo exacto por franja horaria (ej. corridas de 12:00 a 12:59 entran a las 12:00).
        2. **Días de la Semana:** Agrupación de Lunes a Domingo.
        3. **Semanas Operativas:** Nuevo filtro y gráfica semanal (`Semana del DD/MM/AAAA`) mostrando evolución de salidas y pasaje semana tras semana.
        4. **Meses:** Evolución consolidada por mes real.
*   **KPIs Inteligentes:** Muestran afluencia proyectada total, hora pico calculada, día pico calculado y salidas diarias.

## 6. Mejoras Continuas Pendientes
1) Alerta visual de Huecos/Retrasos matemáticos en Editor de Rol.
2) Dictado por voz para observaciones en OTP.
3) Teclado predictivo para inserción de ECOs recientes.
4) Atajo especial para pausa "S.F."

---
> [!NOTE]
> **Mensaje al Usuario:** Esta bitácora queda respaldada tanto localmente como en GitHub. El agente que asuma en la siguiente sesión deberá leer este archivo primero para estar sincronizado al 100%.
