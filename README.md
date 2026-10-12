# Sistema de Solicitudes y Tickets de Soporte TI

Incremento del sistema de gestión, atención y auditoría de solicitudes de soporte técnico para departamentos de TI.

---

## 1. Descripción del Sistema

El **Sistema de Solicitudes TI** es una solución full-stack diseñada para centralizar, controlar y auditar el ciclo de vida de los incidentes y requerimientos técnicos en una organización.

### Funcionalidades Implementadas:
* **Registro de Solicitudes:** Formulario intuitivo con validación de datos obligatorios (`solicitante`, `categoria`, `prioridad`, `descripcion`). Generación automática de identificador único alfanumérico no colisionable con formato `REQ-[A-Z0-9]{6}`. Asignación automática del estado inicial `Registrada` con técnico `null`.
* **Consulta y Rastreo:** Búsqueda en tiempo real por código (tolerante a espacios y mayúsculas/minúsculas). Visualización detallada de la solicitud con badges de estado y prioridad.
* **Línea de Tiempo y Auditoría Histórica:** Registro inmutable de cada cambio de estado, técnico responsable, fecha/hora en formato ISO y observaciones en el arreglo `historial`.
* **Gestión de Transición de Estados:** Flujo secuencial gobernado (`Registrada` &rarr; `Asignada` &rarr; `En Proceso` &rarr; `Resuelta` y opción de `Cancelada` en cualquier etapa activa).
* **Asignación Obligatoria de Técnicos:** Validación estricta tanto en cliente como en backend: los estados técnicos (`Asignada`, `En Proceso`, `Resuelta`) exigen un técnico asignado no vacío.
* **Tablero Operativo en Vivo:** Tabla interactiva que consolida todos los tickets registrados en memoria y permite consultar o cargar directamente cualquier solicitud con un clic.
* **Copiado Rápido al Portapapeles:** Notificación modal con botón directo para copiar el código generado tras la creación.

---

## 2. Requisitos Previos

* **Node.js:** Versión `v18+ LTS` o `v20+` instalada.
* **npm:** Gestor de paquetes versión `v9+` o `v10+`.
* **Navegador Web:** Chrome, Firefox, Edge o Safari con soporte para ES6+.

Compruebe su versión local ejecutando:
```bash
node -v
npm -v
```

---

## 3. Instalación

1. **Clonar o descargar el repositorio:**
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd sistema-solicitudes
   ```

2. **Instalar dependencias de producción y desarrollo:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**
   Copie el archivo de plantilla `.env.example` para crear su entorno local `.env`:
   ```bash
   cp .env.example .env
   ```
   *Nota: Las variables predeterminadas utilizan el puerto `3000` sin requerir credenciales externas.*

---

## 4. Ejecución de la Aplicación

### Modo Desarrollo / Producción
Para iniciar el servidor Express con soporte estático para la interfaz SPA:
```bash
npm start
```
o en entorno de desarrollo:
```bash
npm run dev
```

### Acceso a la Aplicación
Abra su navegador web en:
```
http://localhost:3000
```

---

## 5. Ejecución de Pruebas Automatizadas

El proyecto cuenta con un conjunto integral de pruebas unitarias, de integración, casos negativos y flujos de aceptación E2E desarrollados con **Jest** y **Supertest**.

### Ejecutar todas las suites de prueba:
```bash
npm test
```

### Ejecutar pruebas con reporte de cobertura (Coverage):
```bash
npm run test:coverage
```

### Resumen de Suites de Prueba:
* `tests/unit/codeGenerator.test.js`
* `tests/unit/validation.test.js`
* `tests/unit/transitions.test.js`
* `tests/integration/solicitudes.test.js`
* `tests/integration/errors.test.js`
* `tests/acceptance/fullFlow.test.js`

---

## 6. Matriz de Trazabilidad

| ID Requisito | Descripción del Requisito | Componente / Archivo Implementado | ID Prueba | Archivo de Prueba | Criterio de Aceptación Evaluado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-01** | Validación de campos y catálogos en registro | `src/middlewares/validator.js` | `TEST-U01` | `tests/unit/validation.test.js` | Rechaza solicitudes con campos vacíos o catálogos fuera de Hardware, Software, Redes. |
| **RF-02** | Generación de código único alfanumérico | `src/utils/codeGenerator.js` | `TEST-U02` | `tests/unit/codeGenerator.test.js` | Formato estricto `REQ-[A-Z0-9]{6}` y 1000 iteraciones consecutivas sin duplicados. |
| **RF-03** | Obligatoriedad de técnico en estados operativos | `src/models/SolicitudRepository.js` | `TEST-U03` | `tests/unit/transitions.test.js` | Falla la transición a `Asignada`, `En Proceso` o `Resuelta` si el técnico es nulo o vacío. |
| **RF-04** | Persistencia en memoria y consulta por código | `src/controllers/solicitudesController.js` | `TEST-I01` | `tests/integration/solicitudes.test.js` | Endpoint `POST /api/solicitudes` y consulta `GET /api/solicitudes/:codigo` con normalización. |
| **RF-05** | Actualización de estado y auditoría histórica | `src/models/SolicitudRepository.js` | `TEST-I02` | `tests/integration/solicitudes.test.js` | Endpoint `PATCH /api/solicitudes/:codigo/estado` incrementa longitud y datos en `historial`. |
| **RF-06** | Respuestas de error legibles en registro incompleto | `src/middlewares/errorHandler.js` | `TEST-E01` | `tests/integration/errors.test.js` | Responde `400 Bad Request` con mensaje y lista de campos faltantes. |
| **RF-07** | Manejo de códigos no encontrados | `src/controllers/solicitudesController.js` | `TEST-E02` | `tests/integration/errors.test.js` | Responde `404 Not Found` ante códigos inexistentes en consulta o actualización. |
| **RF-08** | Flujo completo del ciclo de vida del ticket | Sistema Completo (E2E) | `TEST-A01` | `tests/acceptance/fullFlow.test.js` | Registro &rarr; Consulta &rarr; Asignación &rarr; En Proceso &rarr; Resolución con auditoría íntegra. |

---

## 7. Política de Ramas, Commits y Asignación de Roles

### Equipo de Desarrollo (4 Integrantes)
* **Dev 1 (Alexander Gutierrez - Líder & Core):** Arquitectura base, configuración del servidor Express, persistencia y repositorio en memoria.
* **Dev 2 (Carlos Perez - Backend Solicitudes):** Controlador de creación, generador de códigos únicos y validadores de catálogos.
* **Dev 3 (Laura Diaz - Ciclo de Vida & Auditoría):** Consulta por código, transiciones de estado, técnico obligatorio y trazabilidad histórica.
* **Dev 4 (Andres Mora - Frontend & Calidad):** Interfaz Single Page Application, gestión en UI y suite de pruebas automatizadas.

### Convención de Ramas y Flujo Git
* **Rama Principal:** `main` (protegida, no admite commits directos a producción; requiere Pull Request con aprobación de pares).
* **Ramas de Función:** `feature/<nombre-modulo>`.
* **Formato de Commits:** [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `test:`, `docs:`, `refactor:`).

```text
main (protegida)
  ├── feature/setup-and-domain           [Dev 1] (Revisado y aprobado por Dev 2)
  ├── feature/create-ticket              [Dev 2] (Revisado y aprobado por Dev 3)
  ├── feature/query-and-status-update    [Dev 3] (Revisado y aprobado por Dev 4)
  └── feature/ui-and-testing-suite       [Dev 4] (Revisado y aprobado por Dev 1)
```

### Plan de 6 Commits Significativos
1. `feat(core): initialize project layout, express server and domain repository`
2. `feat(solicitudes): add registration endpoint with alphanumeric code generator`
3. `feat(solicitudes): implement ticket retrieval and status transition with technician assignment`
4. `feat(audit): track chronological change history on ticket creation and state updates`
5. `feat(ui): add single page web interface for registration, search and status updates`
6. `test(e2e): implement unit, integration, error cases and full acceptance test suite`

---

## 8. Despliegue e Integración Continua (CI/CD)

### 8.1 Despliegue en Google Cloud Run (Contenedor Docker)
1. **Dockerfile recomendado:**
   ```dockerfile
   FROM node:20-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY src/ ./src/
   EXPOSE 3000
   ENV PORT=3000
   ENV NODE_ENV=production
   CMD ["node", "src/server.js"]
   ```
2. **Construcción y despliegue con Google Cloud CLI:**
   ```bash
   gcloud builds submit --tag gcr.io/[PROJECT-ID]/sistema-solicitudes
   gcloud run deploy sistema-solicitudes \
     --image gcr.io/[PROJECT-ID]/sistema-solicitudes \
     --platform managed \
     --region us-east1 \
     --allow-unauthenticated \
     --port 3000
   ```

### 8.2 Despliegue con Gestor de Procesos PM2 (Servidor VPS / Linux)
1. Iniciar el servicio con monitoreo y autoreinicio:
   ```bash
   npm install -g pm2
   pm2 start src/server.js --name "sistema-solicitudes"
   pm2 save
   pm2 startup
   ```

### 8.3 Integración Continua (GitHub Actions)
Flujo de trabajo `.github/workflows/ci.yml` configurado para ejecutar el linter y la suite de pruebas en cada Pull Request antes de fusionar en `main`:
```yaml
name: CI Suite

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Use Node.js 20.x
        uses: actions/setup-node@v4
        with:
          node-version: 20.x
          cache: 'npm'
      - run: npm ci
      - run: npm test
```

---

## 9. Estructura del Proyecto

```text
sistema-solicitudes/
├── .env.example
├── .gitignore
├── README.md
├── package.json
├── src/
│   ├── app.js
│   ├── server.js
│   ├── controllers/
│   │   └── solicitudesController.js
│   ├── models/
│   │   └── SolicitudRepository.js
│   ├── middlewares/
│   │   ├── validator.js
│   │   └── errorHandler.js
│   ├── utils/
│   │   └── codeGenerator.js
│   └── public/
│       ├── index.html
│       ├── styles.css
│       └── app.js
└── tests/
    ├── unit/
    │   ├── codeGenerator.test.js
    │   ├── validation.test.js
    │   └── transitions.test.js
    ├── integration/
    │   ├── solicitudes.test.js
    │   └── errors.test.js
    └── acceptance/
        └── fullFlow.test.js
```
