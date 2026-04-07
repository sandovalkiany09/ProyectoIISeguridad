
-- CREACIÓN DE BASE DE DATOS
CREATE DATABASE proyecto_seguridad;

-- TABLA: ROLES
-- Define los tipos de usuarios del sistema
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL
);

-- TABLA: USUARIOS
-- Almacena información de autenticación
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- hash bcrypt
    email VARCHAR(100) UNIQUE NOT NULL,
    rol_id INTEGER NOT NULL,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_usuario_rol
        FOREIGN KEY (rol_id)
        REFERENCES roles(id)
        ON DELETE RESTRICT
);

-- TABLA: PRODUCTOS
-- CRUD principal del sistema
CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    cantidad INTEGER NOT NULL CHECK (cantidad >= 0),
    precio NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: LOGS DE AUDITORÍA
-- Registro de eventos de seguridad
CREATE TABLE logs_auditoria (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER,
    accion TEXT NOT NULL,
    ip VARCHAR(45),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_log_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE SET NULL
);

-- DATOS INICIALES (ROLES)
INSERT INTO roles (nombre) VALUES 
('SuperAdmin'),
('Auditor'),
('Registrador');

-- ÍNDICES (MEJORA DE RENDIMIENTO)
CREATE INDEX idx_usuario_rol ON usuarios(rol_id);
CREATE INDEX idx_logs_usuario ON logs_auditoria(usuario_id);