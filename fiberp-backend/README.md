# Fiberp Backend (Symfony + JWT)

Backend REST en Symfony con autenticación JWT (LexikJWTAuthenticationBundle), gestión de usuarios, productos y pedidos, control de fichajes y manejo de subida de albaranes en pedidos.

- Base URL por defecto: http://127.0.0.1:8000
- Autenticación: JWT Bearer, TTL 3600s
- Formato: JSON en cuerpos y respuestas, salvo subida de albarán (multipart/form-data)

Contenido
- Descripción y requisitos
- Instalación y configuración (JWT, base de datos, ejecución)
- Estructura del proyecto
- Autenticación y logging
- Endpoints (Auth, Users, Admin, Productes, Comandes/Orders, Fitxatge)
- Ejemplos con curl
- Pruebas (PHPUnit)
- Solución de problemas

---

## 1) Requisitos

- PHP 8.2+
- Composer 2.x
- Extensiones PHP típicas para Symfony/Doctrine (pdo_mysql o pdo_sqlite, intl, mbstring, openssl, json, etc.)
- Opcional: Symfony CLI para ejecutar el servidor local

## 2) Instalación rápida

1. Clonar e instalar dependencias
   - git clone <repo>
   - cd fiberp-backend
   - composer install

2. Configurar variables de entorno
   - Copia .env a .env.local y ajusta al entorno local.
   - Define al menos:
     - DATABASE_URL (SQLite o MySQL/PostgreSQL)
       - Ej. SQLite: DATABASE_URL="sqlite:///%kernel.project_dir%/var/data_dev.db"
       - Ej. MySQL: DATABASE_URL="mysql://user:pass@127.0.0.1:3306/fiberp?serverVersion=8.0"
     - APP_ENV=dev, APP_SECRET=<cadena-aleatoria>
     - JWT_PASSPHRASE=<frase>

3. Generar claves JWT (recomendado)
   - php bin/console lexik:jwt:generate-keypair
   - Esto generará las claves en config/jwt y actualizará JWT_PASSPHRASE si fuese necesario.
   - Verifica config/packages/lexik_jwt_authentication.yaml: usa las variables de entorno JWT_SECRET_KEY, JWT_PUBLIC_KEY y JWT_PASSPHRASE.

4. Preparar base de datos
   - php bin/console doctrine:database:create (si aplica)
   - php bin/console doctrine:migrations:migrate -n

5. Ejecutar en local
   - Con Symfony CLI: symfony server:start -d
   - O con PHP embebido: php -S 127.0.0.1:8000 -t public

---

## 3) Estructura del proyecto (resumen)

- public/ index.php (front controller), uploads/
- src/
  - Controller/ AuthController, UserController, ProductController, OrderController
  - Entity/ User, Producte, Comanda, ItemComanda, Sou, Fitxatge, RegistreSou
  - Repository/ FitxatgeRepository y repos de entidades
  - EventSubscriber/ LoginSubscriber
- config/
  - packages/ security.yaml, lexik_jwt_authentication.yaml, doctrine.yaml, monolog.yaml
  - jwt/ claves JWT en dev
- tests/ PHPUnit funcionales de controladores
- var/log/ logs de seguridad y genéricos

---

## 4) Autenticación y seguridad

- /register y /login son públicos.
- Todo lo demás requiere Authorization: Bearer <JWT> (según access_control de security.yaml).
- Inicio de sesión via JSON Login (username: email, password: password) devuelve token JWT.
- El JWT expira a los 3600s (token_ttl en lexik_jwt_authentication.yaml).

Cabeceras comunes
- Content-Type: application/json en peticiones con cuerpo JSON
- Authorization: Bearer <token>

Roles
- ROLE_USER por defecto
- ROLE_ADMIN para endpoints de administración de usuarios y salarios

---

## 5) Logging

Monolog configurado con canales:
- login, user, order, product, file_upload, password_change
- Ficheros: var/log/security.log y var/log/generic.log (en dev)

---

## 6) Endpoints

Nota: Todos los cuerpos/outputs son JSON salvo la subida de albarán que es multipart/form-data.

### 6.1 Autenticación

POST /register (público)
- Body:
  {
    "email": "usuario@ejemplo.com",
    "password": "TuPasswordSeguro123",
    "name": "Nombre Apellido",
    "telefon": "+34 600 000 000"
  }
- 201 Created:
  {
    "status": "User created",
    "user_identifier": "usuario@ejemplo.com"
  }

POST /login (público)
- Body:
  { "email": "usuario@ejemplo.com", "password": "TuPasswordSeguro123" }
- 200 OK:
  { "token": "<JWT>" }

### 6.2 Usuario (ROLE_USER)

GET /user
- 200 OK: { id, email, name, telefon, roles, createdAt }

PUT|PATCH /user
- Body (parcial): { email?, name?, telefon?, password? }
- 200 OK: devuelve los datos actualizados
- 409 Conflict: email duplicado

GET /user/sou
- 200 OK: { salari_base, complements, irpf_actual, seguretat_social_actual }
- 404 si no hay datos

Fichaje (Fitxatge)
- POST /user/fitxa -> inicia fichaje. 200 { status: "succcess" }
- DELETE /user/fitxa -> finaliza ficha activa. 200 { status: "success" }
- GET /user/fitxa -> estado actual y últimas 10 fichas
  {
    "active": true|false,
    "history": [ { id, hora_inici, hora_fi }, ... ]
  }

### 6.3 Administración de usuarios (ROLE_ADMIN)

GET /users
- Lista todos los usuarios con información básica y salario (si existe)

GET /user/{id}
- Devuelve usuario por id

PUT|PATCH /user/{id}
- Body (parcial): { email?, name?, telefon?, password?, roles?[] }

PUT|PATCH /user/{id}/sou
- Body (parcial numérico): { salari_base?, complements?, irpf_actual?, seguretat_social_actual? }
- Crea el registro de salario si no existía

DELETE /user/{id}
- Elimina el usuario indicado

### 6.4 Productes (ROLE_USER)

GET /product
- Lista productos: [{ id, nom, preu, descripcio, quantitat }, ...]

GET /product/{id}
- Producto por id

POST /product
- Body: { nom, preu, descripcio, quantitat }
- 201 Created con el producto creado

PUT|PATCH /product/{id}
- Body parcial con los campos a modificar

DELETE /product/{id}
- 204 No Content

### 6.5 Comandes / Orders (ROLE_USER)

GET /order
- Lista pedidos: [{ id, estat, total, albara, num_products }]

GET /order/{id}
- Devuelve pedido incluyendo items y resumen de productos
  {
    id, estat, total, albara, num_products,
    items: [{ id, producte: { id, nom, preu }, quantitat, total }]
  }

POST /order
- Crea pedido SOLO con JSON (no sube albarán aquí)
- Body:
  {
    "estat": "pending|...",
    "items": [ { "producteId": 1, "quantitat": 2 }, ... ]
  }
- 201 Created:
  { status: "Order created", id, estat, total, albara: null }

POST /order/{id}/albara
- Sube el albarán en PDF para un pedido existente
- Content-Type: multipart/form-data, campo: albara_file
- Validaciones: solo PDF, se guarda en public/uploads/albarans
- 200 OK:
  { status: "Albara uploaded", id, estat, total, albara: "uploads/albarans/xxxx.pdf" }

PUT|PATCH /order/{id}
- Body parcial: { estat?, albara?, items?[] }
- Si se envían items, reemplaza todos los items y recalcula total
- 200 OK: { status: "Order updated", id, estat, total, albara }

DELETE /order/{id}
- 204 No Content

---

## 7) Ejemplos con curl

Registro
curl -X POST http://127.0.0.1:8000/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@ejemplo.com",
    "password": "TuPasswordSeguro123",
    "name": "Nombre Apellido",
    "telefon": "+34 600 000 000"
  }'

Login (recupera token)
TOKEN=$(curl -s -X POST http://127.0.0.1:8000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@ejemplo.com","password":"TuPasswordSeguro123"}' | jq -r .token)

Crear producto
curl -X POST http://127.0.0.1:8000/product \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nom":"Paper A4","preu":"3.20","descripcio":"Pack 500","quantitat":50}'

Crear pedido (sin albarán)
ORDER=$(curl -s -X POST http://127.0.0.1:8000/order \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "estat":"pending",
    "items":[{"producteId":1,"quantitat":2}]
  }')
OID=$(echo "$ORDER" | jq -r .id)

Subir albarán PDF
curl -X POST http://127.0.0.1:8000/order/$OID/albara \
  -H "Authorization: Bearer $TOKEN" \
  -F "albara_file=@/ruta/a/albara.pdf;type=application/pdf"

Listar pedidos
curl -H "Authorization: Bearer $TOKEN" http://127.0.0.1:8000/order

Fichaje
curl -X POST -H "Authorization: Bearer $TOKEN" http://127.0.0.1:8000/user/fitxa
curl -X DELETE -H "Authorization: Bearer $TOKEN" http://127.0.0.1:8000/user/fitxa
curl -H "Authorization: Bearer $TOKEN" http://127.0.0.1:8000/user/fitxa

---

## 8) Pruebas (PHPUnit)

- Ejecutar tests:
  ./vendor/bin/phpunit tests

Los tests funcionales cubren flujos de autenticación, usuarios, productos y pedidos, incluido el flujo de albarán: primero crear pedido por JSON y después subir el PDF con /order/{id}/albara.

---

## 9) Errores comunes y solución de problemas

- 401 Unauthorized: falta o es inválido el header Authorization. Haz login y reintenta con Bearer <token>.
- 403 Forbidden: tu usuario no tiene permisos (p.ej. endpoints ROLE_ADMIN).
- 404 Not Found: recurso inexistente (usuario/producto/pedido).
- 409 Conflict: email ya en uso al actualizar/crear usuario.
- 400 Bad Request: JSON inválido, campos requeridos ausentes, cantidades <= 0, o falta el campo albara_file en la subida de albarán.
- Subida de albarán: solo se aceptan PDFs. El fichero se guarda en public/uploads/albarans y el path relativo se devuelve en la respuesta.

Logs
- Revisa var/log/security.log y var/log/generic.log en dev para diagnósticos.

---

## 10) Notas de despliegue

- Establece APP_ENV=prod y APP_SECRET en el entorno de producción.
- Genera y configura claves JWT y JWT_PASSPHRASE.
- Configura DATABASE_URL acorde al motor de base de datos de producción.
- Ejecuta migraciones: php bin/console doctrine:migrations:migrate -n

## Cómo testear con Postman/Insomnia
- Crear petición POST a `http://127.0.0.1:8000/register` con body (raw JSON) y `Content-Type: application/json`.
- Crear petición POST a `http://127.0.0.1:8000/login` con body (raw JSON). Copiar el campo `token` de la respuesta.
- Crear petición GET a `http://127.0.0.1:8000/user` y añadir header `Authorization: Bearer <token>`.

---

## Interactuar desde JavaScript (fetch)

Configura una constante para la URL base en tu frontend:
```js
const BASE_URL = 'http://127.0.0.1:8000';
```

1) Registro:
```js
async function register({ email, password, name, telefon }) {
  const res = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name, telefon })
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Error ${res.status}: ${err}`);
  }
  return res.json();
}
```

2) Login y almacenamiento del token:
```js
async function login({ email, password }) {
  const res = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Credenciales inválidas (${res.status}): ${err}`);
  }
  const data = await res.json();
  // Guarda el token donde prefieras (localStorage, memory, etc.)
  localStorage.setItem('token', data.token);
  return data;
}
```

3) Consumir endpoint protegido con el token:
```js
async function getMe() {
  const token = localStorage.getItem('token');
  const res = await fetch(`${BASE_URL}/user`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!res.ok) {
    throw new Error(`No autorizado o token inválido (${res.status})`);
  }
  return res.json();
}
```

4) Cierre de sesión (logout):
```js
function logout() {
  localStorage.removeItem('token');
}
```

---

## Notas y consideraciones
- Seguridad:
  - Rutas públicas: `/login` y `/register`.
  - Todas las demás rutas requieren autenticación (`IS_AUTHENTICATED_FULLY`).
  - Enviar tokens en el header `Authorization: Bearer <JWT>`.
- Expiración del token: 3600 segundos (`token_ttl` en `config/packages/lexik_jwt_authentication.yaml`).
- Datos del usuario: ver entidad `App/Entity/User.php` para campos disponibles.
- Validación/errores: el ejemplo no incluye validaciones avanzadas; maneja errores en frontend (p. ej., email ya existente, formato incorrecto, etc.).

---

## Puesta en marcha local (rápida)
- Instalar dependencias: `composer install`
- (Opcional) Crear BD y migraciones si es la primera vez:
  - `php bin/console doctrine:database:create`
  - `php bin/console doctrine:migrations:migrate`
- Iniciar servidor de desarrollo:
  - Con Symfony CLI: `symfony server:start -d`
  - O con PHP embebido: `php -S 127.0.0.1:8000 -t public`

Ajusta la `BASE_URL` en los ejemplos si usas otro host/puerto.


---


