# Fiberp Backend - API Endpoints (Symfony + JWT)

Este proyecto expone una API REST sencilla para registro, login con JWT (LexikJWTAuthenticationBundle) y obtención del usuario autenticado.

- Base URL local por defecto: http://127.0.0.1:8000
- Autenticación: JWT (Bearer token) con TTL configurado a 3600 segundos.
- Formato: JSON en bodies y responses. Incluye siempre `Content-Type: application/json` en peticiones con cuerpo.

Contenido:
- Endpoints disponibles y esquemas de request/response
- Cómo testear con curl/Postman
- Cómo interactuar desde JavaScript (fetch)

---

## Endpoints

### 1) Registro de usuario
- Método/Path: POST /register
- Auth: Pública (no requiere token)
- Body JSON:
  ```json
  {
    "email": "usuario@ejemplo.com",
    "password": "TuPasswordSeguro123",
    "name": "Nombre Apellido",
    "telefon": "+34 600 000 000"
  }
  ```
- Response 201 (Created):
  ```json
  {
    "status": "User created",
    "user_identifier": "usuario@ejemplo.com"
  }
  ```
- Notas:
  - `email` debe ser único. Si ya existe, fallará por la restricción de unicidad.
  - Se crean automáticamente las marcas de tiempo y el rol inicial `ROLE_USER`.

### 2) Login (obtención de JWT)
- Método/Path: POST /login
- Auth: Pública (no requiere token)
- Body JSON:
  ```json
  {
    "email": "usuario@ejemplo.com",
    "password": "TuPasswordSeguro123"
  }
  ```
- Response 200 (OK):
  ```json
  {
    "token": "<JWT>"
  }
  ```
  Donde `<JWT>` es el token que debes enviar en el header `Authorization: Bearer <JWT>` en las peticiones protegidas.
- Notas:
  - El endpoint `/login` está gestionado por el firewall `json_login` y utiliza los handlers de LexikJWT para devolver el token.
  - El token expira en 3600 segundos (configurable en `config/packages/lexik_jwt_authentication.yaml`).

### 3) Usuario autenticado
- Método/Path: GET /user
- Auth: Protegido (requiere `Authorization: Bearer <JWT>`)
- Response 200 (OK):
  ```json
  {
    "id": 1,
    "email": "usuario@ejemplo.com",
    "name": "Nombre Apellido",
    "telefon": "+34 600 000 000",
    "roles": ["ROLE_USER"]
  }
  ```
- Notas:
  - Devuelve datos del usuario autenticado según el token proporcionado.

---

## Cómo testear con curl

1) Registrar un usuario nuevo:
```bash
curl -X POST http://127.0.0.1:8000/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@ejemplo.com",
    "password": "TuPasswordSeguro123",
    "name": "Nombre Apellido",
    "telefon": "+34 600 000 000"
  }'
```

2) Hacer login y obtener el token:
```bash
curl -X POST http://127.0.0.1:8000/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@ejemplo.com",
    "password": "TuPasswordSeguro123"
  }'
```
Respuesta esperada:
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9..."
}
```

3) Llamar a un endpoint protegido con el token (reemplaza <JWT> por el valor real):
```bash
curl http://127.0.0.1:8000/user \
  -H "Authorization: Bearer <JWT>"
```

---

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

## Nuevos endpoints añadidos en esta iteración

Se han incorporado CRUDs para Productos y Comandas, y el controlador de Comandas ahora gestiona las líneas de pedido mediante `ItemComanda`.

- Productos (`/product`): CRUD básico sobre la entidad `Producte`.
- Comandas (`/order`): CRUD con gestión de `items` (líneas) y cálculo automático de totales.
- Seguridad: Todas las rutas no públicas requieren JWT. En `OrderController` se aplica explícitamente `#[IsGranted('IS_AUTHENTICATED_FULLY')]` en cada endpoint. Para `ProductController`, la protección depende de la configuración global del firewall; en la configuración habitual del proyecto, también requerirán JWT.

Fecha de actualización: 2025-10-26 20:04

## Productos (Producte)

Entidad y campos relevantes en las requests/responses:
- `id` (number)
- `nom` (string)
- `preu` (string decimal, p. ej. "12.50")
- `descripcio` (string)
- `quantitat` (number entero)

Endpoints:
- GET `/product` — Lista todos los productos.
- GET `/product/{id}` — Obtiene un producto por ID.
- POST `/product` — Crea un producto nuevo.
- PUT|PATCH `/product/{id}` — Actualiza total o parcialmente un producto.
- DELETE `/product/{id}` — Elimina un producto por ID.

Ejemplos curl:

1) Listar
```bash
curl -H "Authorization: Bearer <JWT>" http://127.0.0.1:8000/product
```

2) Obtener por id
```bash
curl -H "Authorization: Bearer <JWT>" http://127.0.0.1:8000/product/1
```

3) Crear
```bash
curl -X POST http://127.0.0.1:8000/product \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT>" \
  -d '{
    "nom": "Cable de fibra",
    "preu": "19.99",
    "descripcio": "Cable monomodo 10m",
    "quantitat": 100
  }'
```
Respuesta 201 típica:
```json
{
  "status": "Product created",
  "id": 5,
  "nom": "Cable de fibra",
  "preu": "19.99",
  "descripcio": "Cable monomodo 10m",
  "quantitat": 100
}
```

4) Actualizar (parcial o total)
```bash
curl -X PATCH http://127.0.0.1:8000/product/5 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT>" \
  -d '{ "quantitat": 95 }'
```

5) Borrar
```bash
curl -X DELETE -H "Authorization: Bearer <JWT>" http://127.0.0.1:8000/product/5 -i
```
- Códigos de respuesta: 200 (lecturas/actualizaciones), 201 (creación), 204 (borrado), 404 (no encontrado), 400 (JSON inválido o campos requeridos ausentes en creación).

Notas:
- El campo `preu` se maneja como string decimal en la API.

## Comandas (Orders) con items (ItemComanda)

Campos de `Comanda` en respuestas:
- `id` (number)
- `estat` (string)
- `total` (string decimal) — calculado automáticamente a partir de los items
- `albara` (string, opcional)
- `num_products` (number) — suma de `quantitat` de todos los items
- `items` (solo en GET detalle) — lista de líneas con: `id`, `producte` {`id`, `nom`, `preu`}, `quantitat`, `total`

Esquema de `items` en creación/actualización:
- Array de objetos `{ "producteId": number, "quantitat": number > 0 }`

Endpoints:
- GET `/order` — Lista comandas con `num_products` agregado.
- GET `/order/{id}` — Detalle con `items` y `num_products`.
- POST `/order` — Crea comanda. Requeridos: `estat`, `items`. Opcional: `albara` o PDF subido.
- PUT|PATCH `/order/{id}` — Actualiza `estat` y/o `albara`. Si se envía `items`, se reemplazan todas las líneas y se recalcula el total.
- DELETE `/order/{id}` — Elimina una comanda e, implícitamente, sus items (por mapeo con `orphanRemoval`).

Importante: formato uniforme para creación
- Todas las peticiones de creación de comanda (ya sea multipart/form-data o JSON) DEBEN incluir:
  - `estat` (string)
  - `items` (array)
- El `albara` es OPCIONAL:
  - Si subes un archivo PDF debe enviarse como campo de formulario `albara_file` (multipart/form-data). El archivo será almacenado y el campo Comanda.albara se establecerá en la ruta relativa almacenada.
  - Si usas application/json, opcionalmente puedes proporcionar `"albara": "uploads/albarans/example.pdf"`.

Ejemplos:

1) Crear comanda con multipart/form-data y subida de PDF (recomendado al adjuntar un PDF)
```bash
curl -X POST http://127.0.0.1:8000/order \
  -H "Authorization: Bearer <JWT>" \
  -F "albara_file=@/path/to/albara.pdf" \
  -F 'estat=nou' \
  -F 'items=[{"producteId":1,"quantitat":2},{"producteId":3,"quantitat":1}]'
```
- Los archivos subidos se almacenan en `public/uploads/albarans/`.
- El campo Comanda.albara guardado contendrá la ruta relativa `uploads/albarans/<filename>`.

2) Crear comanda con application/json y una ruta de albara proporcionada
```bash
curl -X POST http://127.0.0.1:8000/order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT>" \
  -d '{
    "estat": "pendent",
    "albara": "uploads/albarans/example.pdf",
    "items": [
      { "producteId": 1, "quantitat": 2 },
      { "producteId": 3, "quantitat": 5 }
    ]
  }'
```

3) Crear comanda con application/json SIN albara (albara será null)
```bash
curl -X POST http://127.0.0.1:8000/order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT>" \
  -d '{
    "estat": "pendent",
    "items": [
      { "producteId": 1, "quantitat": 2 }
    ]
  }'
```

## Detalles de subida de albaranes (PDF)

- Nombre del campo multipart/form-data para el archivo: `albara_file` (PDF requerido).
- Campos de formulario: `estat` y `items` (items pueden ser proporcionados como una cadena JSON).
- Ruta de almacenamiento: `public/uploads/albarans/` (Comanda.albara almacena `uploads/albarans/<filename>`).
- Validación: el servidor validará el MIME/extension del archivo como PDF al subir.

## Logging

All file interactions (upload attempts, validation failures, storage errors, successes) are logged via the file logger service `monolog.logger.file_upload`. Order lifecycle events continue to be logged via the standard order logger.

