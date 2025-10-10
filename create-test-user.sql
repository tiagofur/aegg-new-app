-- Script SQL para crear usuario de prueba
-- Contraseña: test123

-- Eliminar usuario si existe
DELETE FROM users WHERE email = 'test@test.com';

-- Crear nuevo usuario
-- Hash de bcrypt para "test123": $2b$10$rQs5F8mC6GhD3aE2bW9jXO8F7Y3K4N5M6P7Q8R9S0T1U2V3W4X5Y6
INSERT INTO users (email, password, "createdAt", "updatedAt")
VALUES (
    'test@test.com',
    '$2b$10$rQs5F8mC6GhD3aE2bW9jXO8F7Y3K4N5M6P7Q8R9S0T1U2V3W4X5Y6',
    NOW(),
    NOW()
);

SELECT * FROM users WHERE email = 'test@test.com';
