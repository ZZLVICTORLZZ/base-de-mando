# Bitácora Diaria - Grupo AAZ (Motor J2)

**Fecha:** 15 de Junio de 2026
**Ubicación de Trabajo:** Oficina

---

## 🛠️ Correcciones y Bugs Solucionados
1. **Error en `nuevo-rol.tsx`:** 
   - *Problema:* Expo arrojaba el error `Text strings must be rendered within a <Text> component` al entrar a la pantalla de crear nuevo rol.
   - *Solución:* Se eliminó un comentario ` {/* Spacer */} ` mal posicionado dentro del componente `<View>` en el Header (Línea 24) que estaba siendo interpretado como un string de texto por el motor de React Native.
2. **Configuración de Supabase:**
   - *Problema:* El cliente de Supabase tenía llaves harcodeadas de prueba.
   - *Solución:* Se creó el archivo `.env` con la URL y la ANON_KEY reales. Se modificó `supabaseClient.ts` para que lea dinámicamente `process.env.EXPO_PUBLIC_SUPABASE_URL`.

## 🚀 Avances Logrados Hoy
- Repositorio clonado y configurado exitosamente en la computadora de la oficina.
- Entorno de desarrollo para la App Móvil (Expo) configurado y ejecutándose en la red local para pruebas físicas.
- Las variables de entorno de Supabase ya están inyectadas en el proyecto `app-motor-j2` y en la `Base de Mando`.
- **Módulo de Plantillas Predeterminadas (Web):** Interfaz completa con auto-cálculo matemático de horarios y "Marcatextos Digital" (con 7 colores incluyendo fosforescentes). Conectado a la nube.
- **Base de Datos:** Se crearon las tablas `plantillas_predeterminadas` y `roles_del_dia` en Supabase usando SQL.
- **Integración J2 (Móvil):** La app móvil ahora descarga las plantillas de la nube, permite asignar los números ECO en el nuevo "Editor de Rol", y guarda el Rol Oficial de vuelta en la base de datos para que la Base de Mando lo reciba en tiempo real.

## 📌 Proyecciones (Siguientes Pasos para trabajar en casa)
> *Nota para retomar el trabajo:*
> 1. Iniciar la lógica real de "Aforo" y "Taquilla" que cruzan datos de las unidades.
> 2. Terminar la implementación del **Marcatextos Digital** (Drag & Drop de la lista negra/blanca, no el de colores) en la Tabla del Día usando la librería `react-native-draggable-flatlist`.
> 3. Agregar el **Dashboard Motivacional** en la pantalla principal al iniciar sesión.

---
*No olvides ejecutar `git push` al final de la jornada en la oficina para tener todo este código listo en casa.*
