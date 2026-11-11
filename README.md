# WarehouseGO

**Shutdown work tracking for industrial sites.** WarehouseGO gives field supervisors a short path from an assigned piece of equipment to a job update, and gives site leads and owners the detail they need to plan work across crews and sites.

Shutdown planners already work in Excel. A scope workbook lists equipment and the jobs required for each item. Daily reports pull together progress, constraints, and staffing by shift. WarehouseGO keeps that structure. Field supervisors open an assigned device, change the job status, and leave a reason if work is blocked. Site leads can see who reported the constraint and when, alongside the device’s priority and target date.

The team demonstrated the MVP during an active shutdown in October 2025 using the ongoing job list and report generation. [Read how the workbooks and demo feedback shaped the product](docs/product-case-study.md).

## Product walkthrough

### 1. Field supervisors update work where they find it

A cluster supervisor opens **My Assigned Devices**, expands a piece of equipment, and updates the job in place. The same view shows priority, target date, and equipment attributes. Marking a job as **Constraint** requires a comment, so the next person has a reason they can act on. The field workflow is centered on the cluster supervisor who records progress for the crew.

![Cluster supervisor’s assigned heat exchanger with its jobs expanded and a replacement gasket constraint visible](docs/screenshots/assigned-work.png)

### 2. Site leads turn a field update into a plan

The **Site In-Charge** opens the constraint report to find the same gasket issue. They can search by equipment, job, or comment and filter by priority. The site dashboard shows equipment and job progress and links into filtered device lists for follow-up. A **Site Supervisor** coordinates the handoff by assigning devices to cluster supervisors and reviewing their workload.

![Site constraint report filtered to the heat exchanger, showing the same job, gasket comment, and updater](docs/screenshots/constraint-report.png)

The site lead also manages the rest of the shutdown workflow.

- **Equipment and jobs** — Import Excel worklists with column mapping and preview, set priorities and target dates, and assign equipment in bulk.
- **Pre-shutdown readiness** — Track preparatory work separately, including priorities, remarks, and completion dates.
- **Shift staffing and safety** — Record day and night headcounts by designation, log daily safety figures, and capture toolbox talk notes.
- **Resource availability** — Update the working, breakdown, or free status of site resources and record dispatch dates.
- **Reporting** — Review progress by equipment type and export an Excel overview with job constraints, shift headcounts, and safety records.

### 3. Owners manage multiple sites from one workspace

The **Owner** starts with a directory of sites and drills into site details and analytics. Owners can create sites, set up reporting relationships, manage user approvals, and allocate resources across sites. Resource analytics show availability and breakdowns across the fleet, which helps owners decide what can move to another site.

![Owner’s multi-site overview with three sites and navigation to user and resource management](docs/screenshots/multi-site-overview.png)

*Screenshots show the app running against a local PostgreSQL database with demo data. The gasket constraint was entered through the field supervisor’s UI and then retrieved in the site lead’s report.*

## Engineering

### Architecture

```mermaid
flowchart LR
    UI["React 19 · Vite · React Router"] -->|"Axios · JSON · Bearer JWT"| API["Express 5 routes and controllers"]
    API --> ORM["Prisma 6"]
    ORM --> DB[("PostgreSQL")]
    DB --- SQL["SQL migrations · job and device triggers"]
```

The React SPA chooses dashboards and navigation by role. [AuthContext](frontend/src/context/AuthContext.jsx) loads the current user, and the [Axios client](frontend/src/utils/api.js) attaches the bearer token. Express verifies the JWT, applies role middleware on protected operations, and delegates reads and writes to domain controllers. The [API entry point](backend/src/app.js) mounts the route groups.

**Job updates feed equipment status.** The [job controller](backend/controllers/jobController.js) validates status, requires a comment for a constraint, and records the updater. A PostgreSQL trigger recalculates the parent device after a job insert, update, or delete. A constraint takes precedence, all jobs completed yields completed, any in-progress job yields in progress, and other cases yield pending. The site dashboard groups devices by that stored status, while the constraint report reads the blocked jobs and their comments. See the [trigger definition](backend/prisma/migrations/20250921051907_add_device_status/migration.sql) and [rollup function](backend/prisma/migrations/20250921120000_fix_device_status_enum_cast/migration.sql).

**Spreadsheet imports keep the mapping in the browser.** The equipment importer lets the user select a sheet, map columns, and preview records. The API receives structured JSON, validates required fields and existing serial numbers, and creates equipment and jobs in a Prisma transaction. [Import UI](frontend/src/components/common/ExcelImportTab.jsx) · [Bulk-create controller](backend/controllers/deviceController.js)

### Data model

The [Prisma schema](backend/prisma/schema.prisma) defines the relations, enum values, and indexes. A site groups its people, equipment, resource allocations, and operational records.

- **`User` and `Site`** — Users have one role, an optional site, and a self-referencing `superiorId` for the reporting hierarchy. New registrations begin in `PENDING`.
- **`Device` and `Job`** — A device has a unique serial number, one site, optional supervisor assignments, a priority, a target date, and JSON attributes. Each job belongs to one device and stores status, a comment, and the last updater. A separate [SQL trigger](backend/prisma/migrations/20250921110000_add_device_type_trigger/migration.sql) copies the parent device type when a job is inserted or moved to another device. Composite indexes cover queries such as device status by site and job status by device.
- **`Resource`** — A unique registration number identifies an asset in the shared pool. An optional site link records its current allocation, with separate allocation and dispatch dates.
- **`PreSDJob`** — A site-level readiness item with its own status, priority, completion date, and remarks.
- **`Manpower`, `Safety`, and `TBTTopic`** — Manpower holds day and night counts with a unique site, designation, and date combination. Safety and toolbox talk records each have a unique site and date combination.

### API

Routes below are relative to `/api`. Login returns `{ "token": "…" }`. Pass it as `Authorization: Bearer <token>` on authenticated requests.

- **Session and team** — `POST /auth/login`, `GET /auth/me`, `PUT /users/:id/approve`, `POST /users/assign-subordinate`. [Auth routes](backend/routes/auth.js) · [User routes](backend/routes/users.js)
- **Equipment and assignments** — `POST /devices/bulk-create`, `POST /devices/assign-site-supervisor`, `POST /devices/assign-cluster-supervisor`. [Device routes](backend/routes/devices.js)
- **Field updates and reporting** — `GET /dashboard/cluster-supervisor` loads assigned devices and jobs. `PUT /jobs/:id/status` updates a job. `GET /dashboard/site-incharge/:siteId` loads site data and status counts. `GET /constraints/report/:siteId` returns blocked jobs grouped by device. [Dashboard routes](backend/routes/dashboard.js) · [Job routes](backend/routes/jobs.js) · [Constraint routes](backend/routes/constraints.js)
- **Resources and readiness** — `POST /resources/allocate` assigns assets to a site, `PUT /resources/:id/status` updates availability and dispatch, and `GET /presd-jobs/sites/:siteId/jobs` lists pre-shutdown work. [Resource routes](backend/routes/resources.js) · [PreSD routes](backend/routes/presdJobs.js)
- **Staffing and safety** — `GET /manpower/sites/:siteId/data` loads staffing data. `POST /manpower/sites/:siteId/bulk` updates shift counts in bulk. `GET` and `POST` on `/manpower/sites/:siteId/safety` and `/manpower/sites/:siteId/tbt` read and save daily records. [Manpower routes](backend/routes/manpower.js)

Example request body for `PUT /api/jobs/:id/status` as a cluster supervisor:

```json
{
  "status": "CONSTRAINT",
  "comment": "Waiting for the replacement gasket before reassembly."
}
```

The response contains the updated job. The site constraint report adds equipment priority, target date, and updater details for the handoff.

### Run locally

Use Node.js, npm, and a fresh PostgreSQL database. Create `backend/.env` with a connection string for that database and a local JWT signing secret.

```dotenv
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/warehousego
JWT_SECRET=replace-with-a-local-random-secret
PORT=3000
```

From the repository root, install and start the API:

```sh
cd backend
npm ci
npm run db:generate
npx prisma migrate deploy
npm run db:seed
npm start
```

Apply the migrations to install the SQL triggers alongside the tables. Run the seed once per fresh database.

In [the frontend API client](frontend/src/utils/api.js), set `API_BASE_URL` to `http://localhost:3000/api` for local development. The checked-in constant points to the hosted API.

In a second terminal, from the repository root:

```sh
cd frontend
npm ci
npm run dev
```

Open the URL Vite prints. The [local seed](backend/prisma/seed.js) provides demo accounts with the password `password123`.

- Owner — `sahil@warehouse.com`
- Site In-Charge — `narayan@warehouse.com`
- Site Supervisor — `som@warehouse.com`
- Cluster Supervisor — `abc@warehouse.com`

To reproduce the walkthrough, assign a seeded device to Som as the Site In-Charge, then assign it to ABC as the Site Supervisor. Sign in as ABC, mark one of its jobs as a constraint, and open the site constraint report as the Site In-Charge.

### MVP boundaries

The current authorization middleware checks roles. Consistent enforcement of site and assignment ownership in the API is still open. The owner’s cross-site constraint report also needs a routing fix before it can be used from the overview.
