# Sistema de Teleticket

Aplicación web fullstack para la venta, validación y reventa de tickets de conciertos. Proyecto universitario de Ingeniería de Software — Universidad Nacional de Ingeniería (UNI).

---

## Descripción

Plataforma que permite a los usuarios comprar entradas para eventos de conciertos, visualizarlas con un código QR dinámico basado en TOTP (se renueva cada 30 segundos), revenderlas en un marketplace interno y validarlas en el ingreso mediante escaneo QR. Incluye panel de administración para gestión de eventos y reportes, y sistema de incidentes para el personal de seguridad.

---

## Tipos de usuario

| Rol | Descripción |
|-----|-------------|
| **Cliente** | Se registra, compra tickets, visualiza sus entradas con QR dinámico y puede revender tickets en el marketplace |
| **Administrador** | Crea y gestiona eventos, categorías de tickets, visualiza métricas de ventas y compradores, y puede cancelar eventos |
| **Seguridad** | Escanea códigos QR para validar entradas en el ingreso y reporta incidentes |

---

## Stack tecnológico

| Capa | Tecnologías |
|------|-------------|
| **Frontend** | React 18, Vite, Tailwind CSS, React Router v6, Axios, lucide-react, react-hot-toast |
| **Backend** | Node.js, Express, JWT (jsonwebtoken), bcrypt, speakeasy (TOTP), nodemailer, uuid |
| **Base de datos** | PostgreSQL — Supabase |
| **QR** | qrcode.react (visualización), html5-qrcode (escaneo) |
| **Control de versiones** | Git |

---

## Estructura del proyecto

```
Sistema de Teleticket/
├── README.md
│
├── backend/
│   ├── index.js                        # Punto de entrada — inicia el servidor Express
│   ├── package.json
│   ├── .env.example                    # Plantilla de variables de entorno
│   │
│   ├── database/
│   │   └── schema.sql                  # Schema SQL de referencia (legacy)
│   │
│   └── src/
│       ├── app.js                      # Config Express: CORS, rutas, middlewares
│       │
│       ├── config/
│       │   ├── database.js             # Pool de conexión PostgreSQL (Supabase)
│       │   └── mailer.js               # Config Nodemailer (Gmail SMTP)
│       │
│       ├── db/
│       │   └── schema.sql              # Schema SQL activo (referencia)
│       │
│       ├── middleware/
│       │   ├── auth-middleware.js      # verificarToken + verificarRol
│       │   └── error-middleware.js     # Manejador global de errores
│       │
│       ├── routes/
│       │   ├── auth-routes.js
│       │   ├── evento-routes.js
│       │   ├── ticket-routes.js
│       │   ├── reventa-routes.js
│       │   └── incidente-routes.js
│       │
│       ├── controllers/
│       │   ├── auth-controller.js
│       │   ├── evento-controller.js
│       │   ├── ticket-controller.js
│       │   ├── reventa-controller.js
│       │   └── incidente-controller.js
│       │
│       ├── services/
│       │   ├── auth-service.js         # Registro, login, cambio de contraseña
│       │   ├── evento-service.js       # CRUD eventos, métricas, cancelación
│       │   ├── ticket-service.js       # Compra, TOTP, validación QR
│       │   └── reventa-service.js      # Publicar, comprar, cancelar reventas
│       │
│       ├── queries/                    # Capa de acceso a la base de datos
│       │   ├── auth-queries.js
│       │   ├── evento-queries.js
│       │   ├── ticket-queries.js
│       │   ├── reventa-queries.js
│       │   └── incidente-queries.js
│       │
│       └── utils/
│           └── email-templates.js      # Plantillas HTML: bienvenida, confirmación de compra
│
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── .env.example
    │
    └── src/
        ├── main.jsx                    # Entrada React
        ├── App.jsx                     # Definición de rutas (React Router)
        ├── index.css
        │
        ├── api/                        # Funciones de llamada al backend
        │   ├── axios-config.js         # Instancia Axios con interceptores JWT y 401
        │   ├── auth-api.js
        │   ├── eventos-api.js
        │   ├── tickets-api.js
        │   ├── reventas-api.js
        │   └── incidentes-api.js
        │
        ├── context/
        │   └── AuthContext.jsx         # Estado global de autenticación (localStorage)
        │
        ├── components/
        │   ├── Navbar.jsx              # Barra de navegación con menú por rol
        │   ├── RutaProtegida.jsx       # HOC de protección de rutas por rol
        │   └── LoadingSpinner.jsx
        │
        ├── pages/
        │   ├── Home/
        │   │   └── Home.jsx            # / — Lista de eventos activos
        │   ├── Login/
        │   │   └── Login.jsx           # /login
        │   ├── Registro/
        │   │   └── Registro.jsx        # /registro
        │   ├── EventoDetalle/
        │   │   └── EventoDetalle.jsx   # /eventos/:id — Detalle y compra
        │   ├── MisTickets/
        │   │   └── MisTickets.jsx      # /mis-tickets — Tickets y ventas del usuario
        │   ├── TicketQR/
        │   │   └── TicketQR.jsx        # /ticket/:uuid — QR dinámico TOTP
        │   ├── Validar/
        │   │   └── Validar.jsx         # /validar — Escáner QR (seguridad/admin)
        │   ├── Marketplace/
        │   │   └── Marketplace.jsx     # /marketplace — Compra de reventas
        │   ├── Perfil/
        │   │   └── Perfil.jsx          # /perfil — Perfil de usuario
        │   └── admin/
        │       ├── Admin.jsx           # /admin — Panel administrador
        │       ├── AdminDashboardPage.jsx
        │       ├── CrearEventoPage.jsx
        │       └── GestionEventosPage.jsx
        │
        └── utils/
            ├── formato.js              # formatearFecha, formatearPrecio (S/ PEN)
            └── constants.js            # Constantes: ROLES, ESTADO_TICKET, ESTADO_EVENTO
```

---

## Base de datos

### Tipos enum

```sql
CREATE TYPE rol_usuario    AS ENUM ('cliente', 'admin', 'seguridad');
CREATE TYPE estado_evento  AS ENUM ('activo', 'cancelado', 'finalizado');
CREATE TYPE estado_ticket  AS ENUM ('activo', 'usado', 'reembolsado', 'en_reventa');
CREATE TYPE estado_reventa AS ENUM ('publicado', 'vendido', 'cancelado');
```
 
### Tablas

#### `usuario`
Almacena las cuentas de todos los usuarios del sistema.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | SERIAL PK | Identificador único |
| `nombre` | TEXT | Nombre completo |
| `email` | TEXT UNIQUE | Correo electrónico (login) |
| `contrasena_hash` | TEXT | Contraseña hasheada con bcrypt (cost 10) |
| `rol` | rol_usuario | Rol asignado (`cliente` por defecto) |
| `fecha_registro` | TIMESTAMP | Fecha de creación de la cuenta |

#### `evento`
Conciertos y eventos disponibles para compra de tickets.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | SERIAL PK | Identificador único |
| `nombre` | TEXT | Nombre del evento |
| `nombre_artista` | TEXT | Artista o banda principal |
| `fecha_hora` | TIMESTAMP | Fecha y hora del evento |
| `lugar` | TEXT | Lugar o venue del evento |
| `descripcion` | TEXT | Descripción detallada |
| `banner_url` | TEXT | URL de imagen de portada |
| `estado` | estado_evento | Estado del evento (`activo` por defecto) |
| `administrador_id` | INT FK → usuario | Admin que creó el evento |

#### `categoria_ticket`
Zonas o categorías de tickets por evento, con precio y stock.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | SERIAL PK | Identificador único |
| `evento_id` | INT FK → evento | Evento al que pertenece (CASCADE DELETE) |
| `nombre_zona` | TEXT | Nombre de la zona (ej. General, VIP, Platinum) |
| `precio` | DECIMAL(10,2) | Precio original de la categoría |
| `stock_total` | INT | Cantidad total de tickets en la zona |
| `stock_disponible` | INT | Tickets aún disponibles para compra |

#### `ticket`
Tickets individuales emitidos a cada usuario.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | SERIAL PK | Identificador único |
| `codigo_uuid` | UUID UNIQUE | Código único del ticket (contenido del QR) |
| `usuario_id` | INT FK → usuario | Propietario actual del ticket |
| `categoria_ticket_id` | INT FK → categoria_ticket | Zona/categoría adquirida |
| `estado` | estado_ticket | Estado del ticket (`activo` por defecto) |
| `token_totp` | TEXT | Semilla TOTP (base32) para generación del QR dinámico — nunca se expone al cliente |
| `fecha_emision` | TIMESTAMP | Fecha de compra |

#### `reventa`
Publicaciones de tickets en el marketplace de reventa.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | SERIAL PK | Identificador único |
| `ticket_id` | INT FK → ticket UNIQUE | Ticket puesto en reventa |
| `vendedor_id` | INT FK → usuario | Usuario que publica la reventa |
| `comprador_id` | INT FK → usuario | Usuario que compró la reventa (NULL si aún publicada) |
| `precio_reventa` | DECIMAL(10,2) | Precio fijado por el vendedor |
| `estado` | estado_reventa | Estado de la reventa (`publicado` por defecto) |
| `fecha_publicacion` | TIMESTAMP | Fecha en que se publicó |
| `fecha_venta` | TIMESTAMP | Fecha en que fue vendida (NULL si no vendida) |

#### `incidente`
Registro de incidentes reportados por el personal de seguridad durante la validación.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | SERIAL PK | Identificador único |
| `personal_id` | INT FK → usuario | Personal de seguridad que reportó |
| `ticket_uuid` | TEXT | UUID del ticket involucrado en el incidente |
| `descripcion` | TEXT | Descripción del incidente |
| `fecha` | TIMESTAMP | Fecha y hora del reporte |

---

## Instalación y configuración

### Requisitos previos

- Node.js 18+
- Una base de datos PostgreSQL en [Supabase](https://supabase.com) con el schema ejecutado

### 1. Clonar el repositorio

```bash
git clone <url-del-repo>
cd "Sistema de Teleticket"
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Editar `.env` con los valores reales:

```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
JWT_SECRET=una_clave_secreta_de_al_menos_32_caracteres
JWT_EXPIRES_IN=7d
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
EMAIL_USER=tucuenta@gmail.com
EMAIL_PASS=tu_app_password_de_gmail
EMAIL_FROM=tucuenta@gmail.com
```

```bash
npm run dev     # desarrollo con nodemon
# o
npm start       # producción
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env
```

Editar `.env`:

```env
VITE_API_URL=http://localhost:3000
```

```bash
npm run dev       # servidor de desarrollo (puerto 5173)
npm run build     # build de producción (genera dist/)
npm run preview   # previsualizar build
```

---

## Variables de entorno

### Backend

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `DATABASE_URL` | Sí | Cadena de conexión PostgreSQL (Supabase) |
| `JWT_SECRET` | Sí | Clave secreta para firmar tokens JWT (mín. 32 caracteres) |
| `JWT_EXPIRES_IN` | No | Duración del token JWT (default: `7d`) |
| `PORT` | No | Puerto del servidor Express (default: `3000`) |
| `NODE_ENV` | No | Entorno (`development` / `production`) |
| `FRONTEND_URL` | Sí | URL del frontend para configurar CORS |
| `EMAIL_USER` | Sí | Cuenta Gmail para envío de correos |
| `EMAIL_PASS` | Sí | App Password de Gmail (no la contraseña normal) |
| `EMAIL_FROM` | Sí | Dirección remitente del correo |

### Frontend

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `VITE_API_URL` | Sí | URL base del backend (sin `/api` al final) |

---

## API — Endpoints

### Autenticación (`/api/auth`)

| Método | Ruta | Auth | Rol | Descripción |
|--------|------|------|-----|-------------|
| POST | `/api/auth/registro` | No | — | Registra un nuevo usuario y envía email de bienvenida |
| POST | `/api/auth/login` | No | — | Inicia sesión y retorna JWT |
| PUT | `/api/auth/cambiar-password` | Sí | — | Cambia la contraseña del usuario autenticado |

### Eventos (`/api/eventos`)

| Método | Ruta | Auth | Rol | Descripción |
|--------|------|------|-----|-------------|
| GET | `/api/eventos` | No | — | Lista todos los eventos activos |
| GET | `/api/eventos/:id` | No | — | Detalle de un evento con sus categorías |
| GET | `/api/eventos/admin` | Sí | admin | Lista todos los eventos (incluye cancelados/finalizados) |
| GET | `/api/eventos/:id/metricas` | Sí | admin | Métricas de ventas del evento |
| GET | `/api/eventos/:id/compradores` | Sí | admin | Lista de compradores del evento |
| POST | `/api/eventos` | Sí | admin | Crea un nuevo evento con sus categorías |
| DELETE | `/api/eventos/:id/cancelar` | Sí | admin | Cancela el evento y reembolsa todos los tickets activos |

### Tickets (`/api/tickets`)

| Método | Ruta | Auth | Rol | Descripción |
|--------|------|------|-----|-------------|
| GET | `/api/tickets/mis-tickets` | Sí | cliente | Lista los tickets del usuario (con precio real si fue por reventa) |
| POST | `/api/tickets/comprar` | Sí | cliente | Compra un ticket de una categoría específica |
| GET | `/api/tickets/:uuid/token` | Sí | cliente | Retorna el token TOTP actual y segundos restantes para el QR |
| POST | `/api/tickets/validar` | Sí | seguridad, admin | Valida un QR (`UUID:TOKEN`), marca el ticket como usado |

### Reventas (`/api/reventas`)

| Método | Ruta | Auth | Rol | Descripción |
|--------|------|------|-----|-------------|
| GET | `/api/reventas` | No | — | Lista todas las reventas publicadas (filtro opcional `?eventoId=`) |
| GET | `/api/reventas/:id` | No | — | Detalle de una reventa |
| GET | `/api/reventas/mis-publicaciones` | Sí | cliente | Reventas activas publicadas por el usuario |
| GET | `/api/reventas/mis-ventas` | Sí | cliente | Reventas completadas (vendidas) por el usuario |
| POST | `/api/reventas/publicar` | Sí | cliente | Publica un ticket en el marketplace con precio de reventa |
| POST | `/api/reventas/:id/comprar` | Sí | cliente | Compra un ticket del marketplace (no puede ser el vendedor) |
| DELETE | `/api/reventas/:id/cancelar` | Sí | cliente | Cancela una publicación propia y restaura el ticket a activo |

### Incidentes (`/api/incidentes`)

| Método | Ruta | Auth | Rol | Descripción |
|--------|------|------|-----|-------------|
| POST | `/api/incidentes` | Sí | seguridad, admin | Registra un incidente de seguridad con UUID del ticket y descripción |

---

## Rutas del frontend

| Ruta | Acceso | Componente | Descripción |
|------|--------|------------|-------------|
| `/` | Público | `Home` | Lista de eventos activos disponibles |
| `/login` | Público | `Login` | Inicio de sesión |
| `/registro` | Público | `Registro` | Registro de nuevo cliente |
| `/eventos/:id` | Público | `EventoDetalle` | Detalle del evento y compra de tickets |
| `/marketplace` | Público | `Marketplace` | Marketplace de reventa de tickets |
| `/mis-tickets` | Cliente | `MisTickets` | Tickets activos y tickets vendidos del usuario |
| `/ticket/:uuid` | Cliente | `TicketQR` | QR dinámico del ticket (TOTP, se actualiza cada 30 s) |
| `/perfil` | Autenticado | `Perfil` | Perfil y datos del usuario |
| `/validar` | Seguridad / Admin | `Validar` | Escáner de QR para validar entrada al evento |
| `/admin` | Admin | `Admin` | Panel de administración (dashboard, eventos, métricas) |

---

## Arquitectura del backend

Las capas se comunican en un solo sentido, sin dependencias inversas:

```
Router → Controller → Service → Queries → PostgreSQL (Supabase)
```

| Capa | Responsabilidad |
|------|-----------------|
| **Router** | Define rutas HTTP, aplica middlewares de auth y rol |
| **Controller** | Extrae parámetros del request, llama al service, responde con JSON |
| **Service** | Lógica de negocio: validaciones, transacciones, reglas |
| **Queries** | Consultas SQL directas al pool de PostgreSQL |

---

## Seguridad

### Autenticación JWT
- Token firmado con `JWT_SECRET`, enviado en header `Authorization: Bearer <token>`
- El middleware `verificarToken` lo valida en cada ruta protegida
- El middleware `verificarRol` restringe el acceso por rol

### QR dinámico con TOTP
- Cada ticket tiene una semilla TOTP única (`token_totp`) almacenada en la BD — **nunca expuesta al cliente**
- El QR contiene `UUID:TOKEN` donde `TOKEN` es un código TOTP de 6 dígitos válido por 30 segundos
- La validación usa `window: 0` (solo el step actual), eliminando la tolerancia a capturas de pantalla antiguas
- Al vender un ticket vía reventa, se genera una nueva semilla TOTP, invalidando el QR del vendedor anterior

### Contraseñas
- Hasheadas con bcrypt, costo 10
- Nunca almacenadas ni expuestas en texto plano

### CORS
- Configurado para aceptar únicamente solicitudes desde `FRONTEND_URL`

---

## Correos electrónicos

El sistema envía correos automáticos mediante Gmail SMTP (Nodemailer):

| Evento | Plantilla | Destinatario |
|--------|-----------|--------------|
| Registro de usuario | `bienvenida` | Nuevo usuario |
| Compra de ticket | `confirmacionCompra` | Comprador |

---

## Flujo de reventa

```
Cliente A (vendedor)                    Cliente B (comprador)
       │                                        │
       ├─ Publica ticket en marketplace         │
       │  (ticket pasa a estado 'en_reventa')   │
       │                                        │
       │                          ─────────────>│ Ve ticket en /marketplace
       │                                        │ Compra la reventa
       │                                        │
       ├─ ticket.usuario_id → B                 │
       ├─ ticket.estado → 'activo'              │
       ├─ Nueva semilla TOTP generada           │
       ├─ reventa.estado → 'vendido'            │
       │                                        │
       ├─ Ve ticket en "Tickets vendidos"        │
       │  con precio de reventa                 │
       │                                        ├─ Ve ticket en "Mis tickets"
                                                   con precio_reventa (no el original)
```

---

## Flujo de validación de entrada

```
Personal de seguridad escanea QR del ticket
            │
            ▼
  Backend recibe "UUID:TOKEN"
            │
            ├─ Busca ticket por UUID
            ├─ Verifica estado === 'activo'
            ├─ Verifica TOTP (window: 0 — solo step actual)
            │
            ├─ [Válido] → marca ticket como 'usado' → retorna datos del ticket
            └─ [Inválido] → retorna error (TOKEN_INVALIDO / TICKET_YA_USADO / etc.)
```
