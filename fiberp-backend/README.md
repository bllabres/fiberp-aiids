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
