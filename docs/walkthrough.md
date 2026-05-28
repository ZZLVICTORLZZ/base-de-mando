# Base de Mando - Proyecto Apolo 11 🚀

¡Hemos transformado el sistema en una plataforma privada de nivel empresarial! El acceso público ha sido removido y hemos creado la base de los módulos de Administración y Unidades.

## 1. Módulo de Administración
   - **Accesos:** Formulario donde tú (como Administrador) podrás crear perfiles subiendo foto, nombre, asignando correo y forzando una contraseña inicial.
   - **Roles:** Panel para gestionar los puestos de la empresa (Monitorista, Recaudador, Socio, etc.).
   - **Permisos:** Matriz visual (RBAC) para autorizar o bloquear la *Lectura* o *Escritura* en módulos específicos.

## 2. Módulo de Unidades (Flota)
Ya está construido y funcional el registro de vehículos con una arquitectura que facilita su uso rápido.
   - **Directorio de Flota:** Al abrir el módulo, verás una tabla con todas las unidades registradas. Cada unidad tiene un botón de **Ojo (Visualizar)** y **Lápiz (Editar)**.
   - **Formulario de Registro:** Al darle clic en "Registrar Unidad", se abre un formulario limpio para ingresar: Número Económico (Eco), Marca, Modelo, Año, Número de Serie (VIN), Capacidad de Pasajeros y un menú desplegable con tus tipos de unidad exactos (Sprinter, Autobús, NV, Crafter, JAC).
   - **Flujo Automático:** Cuando guardas la unidad, el sistema te regresa automáticamente al directorio para que puedas verla en la lista inmediatamente.

## Instrucciones de Prueba

Abre la aplicación en tu navegador:

**👉 [http://localhost:5173/](http://localhost:5173/)**

1. Ve a la pestaña de **Unidades**.
2. Verás unas unidades de ejemplo en la lista.
3. Haz clic en **+ Registrar Unidad** arriba a la derecha.
4. Llena los datos (inventa uno, por ejemplo Eco 15, tipo JAC, etc.).
5. Dale a **Guardar Unidad** y verás cómo te regresa a la tabla y tu nueva unidad aparece mágicamente al final de la lista.

## Próximos Pasos

Como acordamos, la parte de programación de vida de las piezas (Mantenimiento) y Pólizas de Seguro se programarán más adelante en sus respectivas áreas para mantener todo modular. 

¿Qué módulo te gustaría que diseñemos a continuación? ¿Seguimos con **Servicio** (para el ciclo de Despegue, Ruta, etc.) o con **Aforo** (para el cálculo del Monitorista)?
