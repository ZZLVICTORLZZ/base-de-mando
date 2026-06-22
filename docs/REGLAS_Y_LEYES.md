# Reglas y Leyes del Proyecto (Motor J2 y Base de Mando)

Estas son las reglas inquebrantables del proyecto que TODO desarrollador y agente de inteligencia artificial DEBE seguir rigurosamente para mantener la integridad, calidad visual y funcionalidad del sistema.

## 1. Regla de Oro: Conservación del Código
- **NUNCA DEPURO, BORRO NI REEMPLAZO CÓDIGO EXISTENTE a menos que sea estrictamente necesario.**
- Si una función o pedazo de código parece "inútil", se comenta, no se elimina.
- Siempre mantengo las integraciones y dependencias modulares. Todo debe encajar a la perfección como piezas de lego.

## 2. Bases y Nomenclaturas Oficiales
- **No inventes bases.** Las bases oficiales que se manejan en el sistema son exclusivamente:
  - `Indios Verdes`
  - `Nuevos Paseos`
  - `Lagos 2`
- Si implementas filtros, selectores o iteraciones referenciando bases, apégate estrictamente a estas tres.

## 3. Estética y Diseño "Premium"
- **Calidad Visual Obligatoria:** Toda interfaz web y móvil debe verse dinámica, moderna y *Premium*.
- **Elementos UI Base:**
  - Uso de *Glassmorphism* (fondos semi-transparentes con desenfoque).
  - Borders redondeados (border-radius grandes, estilos "pill").
  - Efectos *Hover* y transiciones en absolutamente TODOS los botones interactivos (brillo, neón, cambios de color con `transition: all 0.2s ease`).
  - Paletas oscuras modernas (`#0f172a`, gris oscuro espacial) contrastadas con colores neón/brillantes (`#38bdf8`, `#ca8a04`, `#10b981`).
- Los botones fundamentales como "Lápiz" (Editar), "Ojo" (Ver/Exportar) y "Basurero" (Eliminar) deben ser intuitivos y nunca faltar, excepto si el requerimiento de negocio dice explícitamente "quitar edición en este módulo".

## 4. Estructura y Modularidad (Frontend Web - BDM)
- Toda nueva característica debe desarrollarse dentro de la carpeta `src/modules` separando dominios lógicos (e.g., `operacion/`, `core/`, `rrhh/`).
- Las páginas deben renderizarse como Componentes y evitar los códigos espagueti. 
- Los módulos deben estar desacoplados. Las integraciones de un catálogo (Ej. RRHH Operadores) deben reflejarse como espejo en J2 sin romper la web.

## 5. Exportaciones (Motor J2 - App Móvil)
- **Ley de Exportación Completa:** Para generar imágenes exportables con `react-native-view-shot` que tienen listas largas (como Incidencias u OTP):
  - **NUNCA** utilices un `ScrollView` con `flex: 1` envolviendo al `ViewShot`, de lo contrario el sistema cortará la imagen al límite de la pantalla física.
  - **SIEMPRE** envuelve las listas de exportación usando un View absolutamente posicionado fuera de la pantalla (e.g., `top: -10000`) para que la captura lea el 100% de la altura natural de los datos y no corte ninguna fila.
  - Las exportaciones deben llevar el Logotipo de la empresa (o el cuadrado "WITCH LOGO" temporal) y datos formales.

## 6. Ley de Autorización Estricta (Paso a Paso)
- **NO ME ADELANTO A NADA.**
- El desarrollo se hace paso a paso. Termino una tarea o nivel, y **me detengo por completo** a esperar la autorización explícita del usuario (Capitán) antes de saltar a la siguiente fase, módulo o archivo.
- Presento los resultados y solicito confirmación antes de asumir que el trabajo está listo.
