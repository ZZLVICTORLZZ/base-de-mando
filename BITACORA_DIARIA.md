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
- Las variables de entorno de Supabase ya están inyectadas en el proyecto `app-motor-j2`.

## 📌 Proyecciones (Siguientes Pasos para trabajar en casa)
> *Nota para retomar el trabajo:*
> 1. Validar la lectura de datos (Rol del Día) extrayendo la información real desde la nube (Supabase).
> 2. Terminar la implementación del **Marcatextos Digital** (Drag & Drop) en la Tabla del Día usando la librería `react-native-draggable-flatlist`.
> 3. Agregar el **Dashboard Motivacional** en la pantalla principal al iniciar sesión.

---
*No olvides ejecutar `git push` al final de la jornada en la oficina para tener todo este código listo en casa.*
