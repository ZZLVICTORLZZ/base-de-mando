# Bitácora Diaria - Sistema Motor J2 y Base de Mando (Web)

## Progreso y Cambios Recientes
- Se implementó la visualización completa de los marcatextos de colores en la tabla interactiva de edición y en la exportación de imagen (OTP).
- Se transformó el campo "Observaciones" para que utilice un modal con un recuadro pequeño y un ícono (message-square), evitando que se amontonen las letras y filas en la vista principal.
- Se corrigió el problema de la captura del nombre del elaborador ("Elaboró: [Nombre]") rescatándolo del usuario del sistema en lugar del predeterminado "Sistema Saturno V".
- Se implementó y optimizó la alineación de todos los encabezados (NO., FREC, HORARIO, ECO, RUTA, PAX, OBS) reduciendo sus flex y fuentes para acomodarlos perfectamente, en particular para las bases completas como Lagos 2.
- Se implementó el botón inicial de "Segunda Vuelta" y la lógica de cascada para los tiempos.
- Se resolvieron fallos críticos de renderizado donde las unidades ECO no se mostraban porque el componente de texto recibía un número en vez de una cadena de caracteres.
- Se mejoró el filtro estricto de la base "Indios Verdes" garantizando que solo ignore los `autobus` o `autobús` exactos y permita libremente todas las Sprinters.
- **Incidencias:** Se consolidó el formato de Incidencias en J2 Móvil y BDM Web siguiendo el Patrón "Menú 1". Se removieron botones de edición en BDM Web para simplificar y se pulió el diseño (botones circulares premium).
- **Exportación en J2:** Se estabilizó el `react-native-view-shot` aplicando renderizado de `posición absoluta (-10000)` para las tablas dinámicas (OTP e Incidencias). Con esto, la captura extrae toda la hoja vertical de registros sin recortes del teléfono.

*Pendiente para la siguiente sesión:*
- Implementar la lógica avanzada de "Duplicar Vuelta" que identifique automáticamente la última vuelta reportada (última iteración del primer ECO) e inserte el número de vuelta y marcatextos blanco en automático.
- Integrar Recursos Humanos (RRHH) como un reflejo espejo del catálogo de operadores desde J2 hacia BDM Web, garantizando que todo sea modular.
