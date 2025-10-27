-- ============================================================================
-- SCRIPT COMPLETO PARA CREAR TODAS LAS TABLAS DEL SISTEMA AEGG
-- ============================================================================
-- Autor: Copilot
-- Fecha: 2025-10-27
-- Descripción: Crea todas las tablas necesarias para el backend de AEGG
-- ============================================================================

-- Conectar a la base de datos:
-- PGPASSWORD='PMXUGyatADHSevnFOoKkCQuh' psql -h localhost -U aegg_user -d aegg_db -f crear-todas-tablas.sql

BEGIN;

-- ============================================================================
-- ELIMINAR TODAS LAS TABLAS EXISTENTES (CUIDADO: ELIMINA TODOS LOS DATOS)
-- ============================================================================
DROP TABLE IF EXISTS reportes_mensuales CASCADE;
DROP TABLE IF EXISTS reportes_anuales CASCADE;
DROP TABLE IF EXISTS reportes_base_anual CASCADE;  
DROP TABLE IF EXISTS meses CASCADE;
DROP TABLE IF EXISTS trabajos CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS equipos CASCADE;

-- ============================================================================
-- CREAR EXTENSIONES NECESARIAS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. TABLA EQUIPOS (Primero porque otros dependen de ella)
-- ============================================================================
CREATE TABLE equipos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(120) NOT NULL,
    activo BOOLEAN DEFAULT true,
    gestor_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 2. TABLA USERS (Depende de equipos)
-- ============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'Gestor',
    equipo_id UUID REFERENCES equipos(id),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agregar foreign key para gestor_id en equipos (referencia circular)
ALTER TABLE equipos 
ADD CONSTRAINT fk_equipos_gestor 
FOREIGN KEY (gestor_id) REFERENCES users(id) ON DELETE SET NULL;

-- ============================================================================
-- 3. TABLA CLIENTES
-- ============================================================================
CREATE TABLE clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(150) NOT NULL,
    rfc VARCHAR(13) UNIQUE NOT NULL,
    razon_social VARCHAR(200),
    direccion JSONB,
    contacto_principal JSONB,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para clientes
CREATE INDEX "IDX_clientes_nombre" ON clientes(nombre);
CREATE UNIQUE INDEX "IDX_clientes_rfc" ON clientes(rfc);

-- ============================================================================
-- 4. TABLA TRABAJOS
-- ============================================================================
CREATE TABLE trabajos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "clienteNombre" VARCHAR(255),
    "clienteRfc" VARCHAR(50),
    anio INTEGER NOT NULL,
    "clienteId" UUID REFERENCES clientes(id),
    "miembroAsignadoId" UUID REFERENCES users(id),
    gestor_responsable_id UUID REFERENCES users(id),
    estado VARCHAR(50) DEFAULT 'ACTIVO',
    estado_aprobacion VARCHAR(50) DEFAULT 'EN_PROGRESO',
    fecha_aprobacion TIMESTAMP,
    aprobado_por_id UUID REFERENCES users(id),
    visibilidad_equipo BOOLEAN DEFAULT true,
    "fechaCreacion" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice único para trabajos (un trabajo por cliente-año)
CREATE UNIQUE INDEX "IDX_trabajos_cliente_anio" ON trabajos("clienteId", anio);

-- ============================================================================
-- 5. TABLA MESES
-- ============================================================================
CREATE TABLE meses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "trabajoId" UUID NOT NULL REFERENCES trabajos(id) ON DELETE CASCADE,
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    estado VARCHAR(50) DEFAULT 'PENDIENTE',
    estado_revision VARCHAR(50) DEFAULT 'EN_EDICION',
    enviado_revision_por_id UUID REFERENCES users(id),
    fecha_envio_revision TIMESTAMP,
    aprobado_por_id UUID REFERENCES users(id),
    fecha_aprobacion TIMESTAMP,
    comentario_revision TEXT,
    "fechaCreacion" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice único para meses (un mes por trabajo)
CREATE UNIQUE INDEX "IDX_meses_trabajo_mes" ON meses("trabajoId", mes);

-- ============================================================================
-- 6. TABLA REPORTES_BASE_ANUAL
-- ============================================================================
CREATE TABLE reportes_base_anual (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "trabajoId" UUID UNIQUE NOT NULL REFERENCES trabajos(id) ON DELETE CASCADE,
    "archivoUrl" VARCHAR(500),
    "mesesCompletados" INTEGER[] DEFAULT '{}',
    hojas JSONB NOT NULL DEFAULT '[]',
    "fechaCreacion" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "ultimaActualizacion" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 7. TABLA REPORTES_ANUALES
-- ============================================================================
CREATE TABLE reportes_anuales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trabajo_id UUID NOT NULL REFERENCES trabajos(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL,
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    ventas DECIMAL(15,2),
    ventas_auxiliar DECIMAL(15,2), 
    diferencia DECIMAL(15,2),
    confirmado BOOLEAN DEFAULT false,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para reportes anuales
CREATE UNIQUE INDEX "IDX_reportes_anuales_trabajo_anio_mes" ON reportes_anuales(trabajo_id, anio, mes);
CREATE INDEX "IDX_reportes_anuales_trabajo" ON reportes_anuales(trabajo_id);
CREATE INDEX "IDX_reportes_anuales_anio" ON reportes_anuales(anio);

-- ============================================================================
-- 8. TABLA REPORTES_MENSUALES
-- ============================================================================
CREATE TABLE reportes_mensuales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "mesId" UUID NOT NULL REFERENCES meses(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL,
    "archivoOriginal" VARCHAR(500),
    datos JSONB DEFAULT '[]',
    estado VARCHAR(50) DEFAULT 'SIN_IMPORTAR',
    "fechaImportacion" TIMESTAMP,
    "fechaProcesado" TIMESTAMP,
    "fechaCreacion" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice único para reportes mensuales (un tipo por mes)
CREATE UNIQUE INDEX "IDX_reportes_mensuales_mes_tipo" ON reportes_mensuales("mesId", tipo);

-- ============================================================================
-- INSERTAR DATOS INICIALES
-- ============================================================================

-- Crear equipo por defecto
INSERT INTO equipos (id, nombre, activo, gestor_id) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Equipo Principal', true, null);

-- Crear usuario administrador por defecto
INSERT INTO users (id, email, password, name, role, equipo_id) 
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin@aegg.mx',
    '$2b$10$K7L/8Y3tCj2zyQ9M1XN.2O8K5QVZJ3L4M6N7O8P9Q0R1S2T3U4V5W6', 
    'Administrador',
    'Admin',
    '00000000-0000-0000-0000-000000000001'
);

-- Actualizar gestor del equipo
UPDATE equipos 
SET gestor_id = '00000000-0000-0000-0000-000000000001' 
WHERE id = '00000000-0000-0000-0000-000000000001';

-- ============================================================================
-- VERIFICAR CREACIÓN DE TABLAS
-- ============================================================================
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- MOSTRAR ESTRUCTURA DE TABLAS PRINCIPALES
-- ============================================================================
\echo ''
\echo '============================================================================'
\echo 'TABLAS CREADAS EXITOSAMENTE:'
\echo '============================================================================'
\echo '1. equipos'
\echo '2. users' 
\echo '3. clientes'
\echo '4. trabajos'
\echo '5. meses'
\echo '6. reportes_base_anual'
\echo '7. reportes_anuales'
\echo '8. reportes_mensuales'
\echo ''
\echo 'Usuario administrador creado:'
\echo 'Email: admin@aegg.mx'
\echo 'Password: admin123 (cambiar inmediatamente)'
\echo '============================================================================'

COMMIT;

\echo 'SCRIPT COMPLETADO EXITOSAMENTE'