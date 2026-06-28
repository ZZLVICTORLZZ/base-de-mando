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
*   **Exportación a Imagen (`react-native-view-shot`):** Al presionar "Compartir", la app dibuja la tabla en dos columnas (para optimizar espacio) en un lienzo temporal (con color de fondo hueso) y la exporta por WhatsApp. **Dato vital:** Se ajustó el motor de renderizado para darle 400ms a React de dibujar el componente *antes* de capturarlo, ya que está condicionado a la variable de estado `isExporting`.
*   **Observaciones sin Truncamiento:** En el lienzo de exportación, las celdas de "OBS" tienen `flexWrap: 'wrap'` y `flexShrink: 1` para que el texto (ej. "carga mercado") crezca verticalmente y nunca se recorte.
*   **Lógica de "Duplicar Vuelta" (Backtracking):** 
    *   El usuario requería que al duplicar, la numeración ("Vuelta 2", "Vuelta 3") fuera precisa. 
    *   *Regla de negocio:* El sistema busca en el historial de la tabla (de abajo hacia arriba) construyendo un `Set` de "Ecos" (camiones). Cuando encuentra un Eco repetido, asume que ha encontrado el límite de la última vuelta real. Al extraer esa vuelta, ignora automáticamente unidades pintadas con marcatextos (que representan autobuses) y unidades cuya frecuencia dice 'S.F.' (Sin Frecuencia).
    *   *Conteo:* Para asignar el número de vuelta, cuenta cuántas veces ha aparecido el **primer Eco clonado** en toda la historia de la tabla. Si apareció 2 veces, escribe "Vuelta 3".

## 3. Editor de Rol (`editor-rol.tsx`)
*   **Propósito:** Es similar a OTP pero para la generación inicial del rol de unidades.
*   **Lógica "Agregar Turno":** El botón grande inferior fue parcheado para heredar automáticamente la frecuencia del turno anterior (en lugar de insertar un 15 ciego) y recalcula la cascada de horarios matemáticamente, usando el mismo sistema que el modal pequeño de inserción entre filas.
*   **Marcatextos:** Mantiene sincronía con la paleta de colores neón de `editor-otp.tsx`.

## 4. Próximos Pasos / Tareas Pendientes
*   El usuario solicitó "DAME MAS IDEAS" sobre estética y funcionalidad que quedó pausado para resolver los bugs de rendimiento de la tabla.
*   Se deben vigilar los inputs de texto dentro del `FlatList` si se reporta pérdida de foco (comportamiento normal de React Native si la llave `key` muta).
*   Se deben iniciar los servidores de backend y de frontend (metro) con normalidad al arrancar la nueva máquina.

---
> [!NOTE]
> **Mensaje al Usuario:** Esta bitácora queda respaldada tanto localmente como en GitHub. El agente que asuma en la siguiente sesión deberá leer este archivo primero para estar sincronizado al 100%.
