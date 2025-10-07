-- Script de migración: Cambiar clienteRut a clienteRfc (opcional)
-- Ejecutar en PostgreSQL

-- 1. Eliminar el índice único anterior
DROP INDEX IF EXISTS "IDX_165096a68be634ca21347c5651";

-- 2. Renombrar la columna clienteRut a clienteRfc
ALTER TABLE trabajos 
RENAME COLUMN "clienteRut" TO "clienteRfc";

-- 3. Hacer la columna nullable
ALTER TABLE trabajos 
ALTER COLUMN "clienteRfc" DROP NOT NULL;

-- 4. Crear nuevo índice único por clienteNombre + anio
CREATE UNIQUE INDEX "IDX_165096a68be634ca21347c5651" 
ON trabajos ("clienteNombre", "anio");

-- Verificar cambios
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'trabajos' 
  AND column_name IN ('clienteNombre', 'clienteRfc', 'anio');
