# Tracker de Proyecto: Ecosistema "GRUPO AAZ"

Este documento mantiene el estado actual de los desarrollos para poder retomar el trabajo fácilmente, ya sea desde la oficina o desde casa.

## Última Ubicación de Trabajo
- **Ubicación:** Casa (Remote)
- **Fecha de Actualización:** 08 de Junio de 2026
- **Fase Actual:** Sprint 6 (Motor J2 - App de Checadores)

## Avances Logrados
1. **Separación Arquitectónica:** Se creó exitosamente el proyecto independiente `app-motor-j2` dentro de `/apps-moviles/`.
2. **Navegación:** Implementado **Expo Router** con navegación basada en pestañas (Tabs).
3. **Estructura UI Completada (Módulos Base):**
   - **Login:** Interfaz base y conexión preparada para Supabase.
   - **Rol del Día:** Lista de unidades con toggle de estado (Trabajando / Faltó).
   - **Tabla del Día:** Herramienta de Marcatextos Digital lista en UI (Drag and drop pendiente).
   - **Operación en Sitio (Despacho):** Interfaz para lectura NFC y registro de aforo de pasajeros.
   - **Reportes:** Formulario visual para registro de incidencias en ruta.

## Pendientes (Siguientes Pasos)
- [ ] **Pruebas UI:** Recibir feedback del Capitán tras probar la app en su teléfono celular.
- [ ] **Conexión a Base de Datos:** Conectar la pantalla de "Rol del Día" y el Login con las tablas reales de `Supabase`.
- [ ] **Dashboard Motivacional:** Implementar la pantalla inicial de saludo con métricas (Regla Inamovible).
- [ ] **Lógica Offline:** Programar el guardado local en `AsyncStorage`/`SQLite` para zonas sin señal.
- [ ] **Marcatextos Digital / Reordenamiento:** Completar la lógica de arrastrar y soltar (drag and drop) en la Tabla del Día.

## Observaciones del Desarrollador
- La aplicación actual de Motor J2 ya está optimizada para móviles utilizando `SafeAreaView` y componentes táctiles de React Native.
- Es vital mantener la versión de las dependencias sincronizadas (`package.json`) al cambiar de computadora (recordar ejecutar `npm install` al clonar en la oficina).
