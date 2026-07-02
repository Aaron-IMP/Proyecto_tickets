-- =============================================================
--  Sistema de Teleticket — Schema PostgreSQL
--  Ejecutar en: Supabase > SQL Editor
-- =============================================================

-- -------------------------------------------------------
-- TIPOS ENUM
-- -------------------------------------------------------

CREATE TYPE rol_usuario AS ENUM ('cliente', 'admin', 'seguridad');
CREATE TYPE estado_evento AS ENUM ('activo', 'cancelado', 'finalizado');
CREATE TYPE estado_ticket AS ENUM ('activo', 'usado', 'reembolsado', 'en_reventa');

-- -------------------------------------------------------
-- TABLAS
-- -------------------------------------------------------

CREATE TABLE usuario (
  id               SERIAL PRIMARY KEY,
  nombre           TEXT NOT NULL,
  email            TEXT UNIQUE NOT NULL,
  contrasena_hash  TEXT NOT NULL,
  rol              rol_usuario DEFAULT 'cliente',
  fecha_registro   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE evento (
  id               SERIAL PRIMARY KEY,
  nombre           TEXT NOT NULL,
  nombre_artista   TEXT,
  fecha_hora       TIMESTAMP NOT NULL,
  lugar            TEXT,
  descripcion      TEXT,
  banner_url       TEXT,
  estado           estado_evento DEFAULT 'activo',
  administrador_id INT REFERENCES usuario(id)
);

CREATE TABLE categoria_ticket (
  id               SERIAL PRIMARY KEY,
  evento_id        INT REFERENCES evento(id) ON DELETE CASCADE,
  nombre_zona      TEXT NOT NULL,
  precio           DECIMAL(10,2) NOT NULL,
  stock_total      INT NOT NULL,
  stock_disponible INT NOT NULL
);

CREATE TABLE ticket (
  id                   SERIAL PRIMARY KEY,
  codigo_uuid          UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  usuario_id           INT REFERENCES usuario(id),
  categoria_ticket_id  INT REFERENCES categoria_ticket(id),
  estado               estado_ticket DEFAULT 'activo',
  fecha_emision        TIMESTAMP DEFAULT NOW()
);

-- -------------------------------------------------------
-- DATOS DE PRUEBA
-- -------------------------------------------------------

-- Usuarios (contraseñas hasheadas con bcrypt, cost 10)
-- admin123       → $2a$10$FER8jXkzXkxU4y.AyLV.UuW8lSG7i3M9XzdrZkalUlJUKG4VgasDS
-- cliente123     → $2a$10$2IswoPpJfEzaDIJpJx9RhOzN7CashkACKAnivJtDC.newvdKHHjHa
-- seguridad123   → $2a$10$40l86FqWDFmapMN2Vj9ok.Le0zlOSiBbrgwMdU4LHv2jiwtxmCjyu

INSERT INTO usuario (nombre, email, contrasena_hash, rol) VALUES
  ('Administrador', 'admin@tickets.com',
   '$2a$10$FER8jXkzXkxU4y.AyLV.UuW8lSG7i3M9XzdrZkalUlJUKG4VgasDS', 'admin'),
  ('Cliente Demo',  'cliente@tickets.com',
   '$2a$10$2IswoPpJfEzaDIJpJx9RhOzN7CashkACKAnivJtDC.newvdKHHjHa',  'cliente'),
  ('Personal Seguridad', 'seguridad@tickets.com',
   '$2a$10$40l86FqWDFmapMN2Vj9ok.Le0zlOSiBbrgwMdU4LHv2jiwtxmCjyu', 'seguridad');

-- Eventos (administrador_id = 1 → el admin creado arriba)
INSERT INTO evento (nombre, nombre_artista, fecha_hora, lugar, descripcion, administrador_id) VALUES
  ('Noche de Rock Clásico',
   'The Rolling Beats',
   '2026-08-15 20:00:00',
   'Estadio Nacional, Lima',
   'Una noche épica con los mejores éxitos del rock clásico en versión en vivo.',
   1),
  ('Festival Reggaeton 2026',
   'Bad Bunny & Invitados',
   '2026-09-20 18:00:00',
   'Jockey Plaza Arena, Lima',
   'El festival de reggaeton más grande del año con artistas internacionales.',
   1);

-- Categorías de tickets — Evento 1 (Rock Clásico)
INSERT INTO categoria_ticket (evento_id, nombre_zona, precio, stock_total, stock_disponible) VALUES
  (1, 'General',   80.00, 500, 500),
  (1, 'VIP',      250.00, 100, 100);

-- Categorías de tickets — Evento 2 (Reggaeton)
INSERT INTO categoria_ticket (evento_id, nombre_zona, precio, stock_total, stock_disponible) VALUES
  (2, 'General',  120.00, 800, 800),
  (2, 'Platinum', 380.00,  50,  50);
