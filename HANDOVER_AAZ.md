# [INSTRUCCIÓN INICIAL PARA LA INTELIGENCIA ARTIFICIAL]
**IA, si estás leyendo este archivo, actúa inmediatamente como Arquitecto de Software Avanzado y Project Manager del "Ecosistema Grupo AAZ". Tu tarea es continuar el desarrollo donde nos quedamos sin romper la arquitectura existente.**

---

# CONTEXTO DEL PROYECTO: ECOSISTEMA "GRUPO AAZ"
Bienvenido a la Base de Mando de Grupo AAZ. Este proyecto es una infraestructura tecnológica completa para una empresa de transporte masivo. 

## 1. Arquitectura Actual del Repositorio (Monorepo)
Todo el código vive centralizado en el repositorio de GitHub de `ZZLVICTORLZZ`.
* `/ (Raíz)`: **Base de Mando** (Plataforma Web en Vite + React). El cerebro central administrativo.
* `/apps-moviles/app-operadores/`: **Motor F1**. Aplicación móvil nativa (Expo/React Native) para los Operadores/Choferes.
* `/apps-moviles/app-taquilla-checador/`: Proyecto base que debe separarse o contener **Motor J2** (Checadores) y **Motor T2** (Taquilla).

## 2. Reglas Inamovibles de Desarrollo
* **Arquitectura Modular:** Ningún archivo debe ser un monolito. Todo separado en componentes lógicos.
* **Modo Offline:** Todas las apps móviles (Motor F1, J2, T2) deben guardar datos localmente con `AsyncStorage` / SQLite si no hay red, y sincronizar silenciosamente al recuperar la red.
* **Dashboard Motivacional:** Toda App Móvil debe abrir con una pantalla que salude al usuario por su nombre y le muestre métricas de su éxito (viajes, ingresos).
* **Base de Datos:** Se utiliza **Supabase** (PostgreSQL) centralizado. El sueldo fijo de operador es de **$200** (calculado al momento de liquidaciones).

## 3. Estado de Avance (Completado hasta la fecha)
* **Base de Mando (Web):** Esquema de base de datos (`profiles`, `roles`, `dynamic_costs`) listo. Módulos administrativos para controlar la empresa. Modo "Sombra" (Aprendiz) integrado por Contexto en React.
* **MOTOR F1 (App de Operadores):** Sprint 5 finalizado.
  - Tiene Login por rol.
  - Dashboard Motivacional.
  - Registro de Vueltas (Pasajeros, Destino, Tarifa) guardando offline.
  - Liquidación del Día (Ingreso Bruto - Gastos Operativos = Cuenta Neta).
  - Botón de compartir a WhatsApp para mandar la cuenta al titular.
  - Tablas creadas en DB: `operator_trips`, `operator_expenses`, `operator_closures`.

---

# INSTRUCCIONES SIGUIENTES (ROADMAP PARA HOY / MAÑANA)

El usuario (Capitán) se encuentra ahora trabajando desde su casa. 
El **Siguiente Paso Oficial** es iniciar con el **Sprint 6: Desarrollo de MOTOR J2 (App de Checadores / Tableristas)**.

### Características a Programar para "MOTOR J2" (Checadores):
1. **Módulo 1: Pestaña "Rol del Día"**
   * Estado en tiempo real de unidades (quién trabaja, quién faltó).
   * Alertas si falta meter unidades al rol.
   * Cargar plantillas de horarios creadas desde la Base de Mando Web.
2. **Módulo 2: Pestaña "Tabla del Día"**
   * Creación de la tabla operativa indicando el paradero inicial (Indios Verdes, Paseos, etc).
   * **Dinámica Absoluta:** 100% editable en vivo (reordenar camiones, quitar o poner en la cola).
   * Herramienta de "Marcatextos Digital" (visual/manual) para identificar estatus.
3. **Módulo 3: Operación en Sitio (Despacho)**
   * Proyección de tiempos de salida.
   * Pre-proyección de la siguiente vuelta (ordenar cola).
   * Validación del despacho simulando lectura de tarjeta **NFC**.
4. **Módulo 4: Reportes**
   * Pestaña exclusiva de incidencias.

---
**Instrucción para el Desarrollador (IA):** 
Cuando inicies, analiza la carpeta `/apps-moviles/app-taquilla-checador/`. Si es necesario, separa "Motor J2" en su propia carpeta Expo independiente para cumplir la arquitectura perfecta. Pídele autorización al usuario y **arranca la codificación del Motor J2**.

---

# ACTUALIZACIÓN (08 DE JUNIO 2026) - CIERRE DE DÍA
El **Sprint 6 (Motor J2)** ha sido inicializado correctamente cumpliendo todas las reglas arquitectónicas (TypeScript nativo obligatorio) y UI/UX:

1. **Separación Exitosa**: Se creó el proyecto independiente en `/apps-moviles/app-motor-j2/`.
2. **Navegación Moderna**: Se implementó `Expo Router` y la estructura de Tabs.
3. **Módulos Base en TypeScript (`.tsx`)**:
   * `login.tsx`: Pantalla de inicio con conexión preparada para Supabase y `AsyncStorage`.
   * `index.tsx`: Módulo 1 (Rol del Día) construido.
   * `tabla.tsx`: Módulo 2 (Tabla del Día) con UI de Marcatextos Digital.
   * `despacho.tsx`: Módulo 3 (Operación en Sitio).
   * `reportes.tsx`: Módulo 4 (Reportes).

**TODO PARA EL SIGUIENTE TURNO (EN LA OFICINA):**
- Conectar los componentes UI a la base de datos Supabase en la nube.
- Refinar la funcionalidad drag-and-drop de la Tabla del Día.
- Implementar el Dashboard Motivacional de bienvenida.
