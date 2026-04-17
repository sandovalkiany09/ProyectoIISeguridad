# Proyecto II - Seguridad

## Descripción
Este proyecto consiste en el desarrollo de un backend seguro utilizando Node.js y PostgreSQL.  
Incluye autenticación con JWT, control de roles (RBAC), CRUD de usuarios y productos, y un sistema de auditoría para registrar eventos importantes del sistema.

---

## Tecnologías utilizadas

- Node.js
- Express
- PostgreSQL
- bcrypt (encriptación de contraseñas)
- JSON Web Token (JWT)
- dotenv (variables de entorno)
- Git & GitHub

---

## Funcionalidades principales

- Autenticación de usuarios (login)
- Registro de usuarios (solo administradores)
- Control de acceso por roles:
  - SuperAdmin
  - Auditor
  - Registrador
- CRUD de usuarios
- CRUD de productos
- Registro de logs de auditoría:
  - Logins exitosos y fallidos
  - Creación, edición y eliminación de usuarios
  - Creación, edición y eliminación de productos
  - Cambios de rol
  - Accesos denegados (403)

---

## Instalación y ejecución del proyecto

### 1. Clonar el repositorio

```bash
git clone https://github.com/sandovalkiany09/ProyectoIISeguridad.git
cd ProyectoIISeguridad
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Crear base de datos en PostgreSQL

- Ejecutar el script: *script.sql* en PostgreSQL ubicado en la carpeta _database_ del proyecto.

### 4. Crear archivo .env

En la raíz del proyecto crear un archivo *.env* con lo siguiente:

DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=tu_password
DB_NAME=proyecto_seguridad
DB_PORT=5432
JWT_SECRET=secreto_super_seguro

### 5. Ejecutar el servidor

```bash
node app.js
```

Servidor disponible en: http://localhost:3000

### Notas importantes

Las contraseñas se almacenan encriptadas con bcrypt.
El sistema utiliza JWT para autenticación.
Los logs registran eventos críticos con usuario, IP y fecha.
Los accesos están protegidos según el rol del usuario.