# 🔐 Proyecto II - Backend Seguro con Node.js & PostgreSQL

Backend seguro con autenticación JWT, control de acceso por roles (RBAC), CRUD completo y sistema de auditoría de eventos.

---

## 📋 Tabla de contenidos

- [Descripción](#-descripción)
- [Tecnologías](#-tecnologías)
- [Funcionalidades](#-funcionalidades)
- [Instalación](#-instalación)
  - [Con Docker (Recomendado)](#-con-docker-recomendado)
  - [Manual (sin Docker)](#-manual-sin-docker)
- [Acceso público con ngrok](#-acceso-público-con-ngrok)
- [Variables de entorno](#-variables-de-entorno)
- [Notas de seguridad](#-notas-de-seguridad)

---

## 📖 Descripción

Este proyecto implementa un backend robusto y seguro utilizando **Node.js** y **PostgreSQL**. Incluye autenticación con JWT, un sistema de control de acceso basado en roles (RBAC), operaciones CRUD para usuarios y productos, y un módulo de auditoría que registra los eventos críticos del sistema.

---

## 🛠 Tecnologías

| Tecnología | Uso |
|---|---|
| Node.js + Express | Servidor HTTP y enrutamiento |
| PostgreSQL | Base de datos relacional |
| Docker + Docker Compose | Contenedorización del entorno |
| bcrypt | Encriptación de contraseñas |
| JSON Web Token (JWT) | Autenticación segura |
| dotenv | Gestión de variables de entorno |
| Git & GitHub | Control de versiones |
| ngrok | Exposición pública del servidor local |

---

## ✅ Funcionalidades

### Autenticación y acceso
- Login de usuarios con JWT
- Registro de usuarios (solo administradores)
- Control de acceso por roles:
  - **SuperAdmin** — acceso total
  - **Auditor** — visualización de logs y registros
  - **Registrador** — gestión de productos y usuarios

### CRUD
- Gestión completa de **usuarios**
- Gestión completa de **productos**

### Sistema de auditoría
Registro detallado de los siguientes eventos (con usuario, IP y fecha):

| Evento | Descripción |
|---|---|
| ✅ Login exitoso | Registro de acceso correcto |
| ❌ Login fallido | Intento de acceso inválido |
| 👤 CRUD usuarios | Creación, edición y eliminación |
| 📦 CRUD productos | Creación, edición y eliminación |
| 🔄 Cambio de rol | Modificación del rol de un usuario |
| 🚫 Acceso denegado | Respuestas 403 por permisos insuficientes |

---

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/sandovalkiany09/ProyectoIISeguridad.git
cd ProyectoIISeguridad
```

---

### 🐳 Con Docker (Recomendado)

Docker permite ejecutar el proyecto en contenedores aislados, evitando conflictos de dependencias y simplificando la instalación del entorno completo.

El sistema utiliza:
- **Contenedor App** — ejecuta Node.js y Express
- **Contenedor Database** — ejecuta PostgreSQL
- **Docker Compose** — levanta ambos servicios automáticamente

**Iniciar el proyecto:**

```bash
docker-compose up --build
```

Este comando:
1. Construye la imagen del proyecto
2. Instala dependencias automáticamente
3. Inicia PostgreSQL
4. Inicia el servidor Node.js
5. Conecta ambos servicios en una red interna

**Acceder a la aplicación:**

```
http://localhost:3000
```

**Detener los contenedores:**

```bash
docker-compose down
```

---

### 🖥 Manual (sin Docker)

**2. Instalar dependencias:**

```bash
npm install
```

**3. Crear la base de datos en PostgreSQL:**

Ejecutar el script SQL incluido en el proyecto:

```bash
psql -U postgres -f database/script.sql
```

**4. Crear el archivo `.env`** en la raíz del proyecto:

```env
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=tu_password
DB_NAME=proyecto_seguridad
DB_PORT=5432
JWT_SECRET=secreto_super_seguro
```

**5. Ejecutar el servidor:**

```bash
node app.js
```

Servidor disponible en:

```
http://localhost:3000
```

---

## 🌐 Acceso público con ngrok

Para pruebas externas, la aplicación fue publicada temporalmente mediante **ngrok**, permitiendo acceso desde internet sin necesidad de despliegue en hosting.

**Enlace público:**

```
https://cheek-stretch-scuff.ngrok-free.dev/
```

> ⚠️ **Nota:** El enlace de ngrok puede cambiar cuando el túnel se reinicia.

**¿Cómo funciona?**

ngrok crea un túnel seguro entre internet y el servidor local, redirigiendo el tráfico hacia `http://localhost:3000`.

---

## 🔒 Notas de seguridad

- Las contraseñas se almacenan **encriptadas con bcrypt**
- La autenticación utiliza **JWT** con firma secreta configurable
- Los logs registran eventos críticos con **usuario, IP y timestamp**
- El acceso a cada endpoint está protegido según el **rol del usuario**
- Docker aísla el entorno evitando exposición directa de dependencias
