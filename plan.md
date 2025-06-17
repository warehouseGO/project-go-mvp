# 📦 Hierarchical Warehouse Management System - MVP Development Specification

## 🎯 Project Overview

Build a **multi-site, multi-role warehouse device & resource management platform** with hierarchical access control. The system manages devices, their jobs, and user assignments across multiple warehouse sites with role-based dashboards and premium UI/UX.

**Tech Stack:** React Frontend + Node.js Backend + PostgreSQL  
**Deployment:** Local development → Vercel

---

## 🗄️ Simplified Database Schema Design

### Prisma Schema (`schema.prisma`)

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Enums
enum UserStatus {
  PENDING
  ACTIVE
  INACTIVE
}

enum Role {
  OWNER
  SITE_INCHARGE
  SITE_SUPERVISOR
  CLUSTER_SUPERVISOR
}

enum JobStatus {
  COMPLETED
  IN_PROGRESS
  CONSTRAINT
}

// Main Models
model User {
  id           Int        @id @default(autoincrement())
  email        String     @unique
  passwordHash String     @map("password_hash")
  name         String
  phone        String?
  role         Role
  status       UserStatus @default(PENDING)
  siteId       Int?       @map("site_id") // null for OWNER role
  superiorId   Int?       @map("superior_id") // immediate superior
  createdAt    DateTime   @default(now()) @map("created_at")
  updatedAt    DateTime   @updatedAt @map("updated_at")

  // Relations
  site              Site?     @relation(fields: [siteId], references: [id], onDelete: Cascade)
  superior          User?     @relation("UserHierarchy", fields: [superiorId], references: [id])
  subordinates      User[]    @relation("UserHierarchy")
  createdSites      Site[]    @relation("SiteCreator")
  assignedDevices   Device[]  @relation("DeviceAssignee")
  createdDevices    Device[]  @relation("DeviceCreator")

  @@map("users")
}

model Site {
  id          Int      @id @default(autoincrement())
  name        String
  location    String?
  description String?
  createdById Int      @map("created_by")
  createdAt   DateTime @default(now()) @map("created_at")

  // Relations
  createdBy User     @relation("SiteCreator", fields: [createdById], references: [id])
  users     User[]
  devices   Device[]

  @@map("sites")
}

model Device {
  id           Int      @id @default(autoincrement())
  serialNumber String   @unique @map("serial_number")
  name         String
  type         String   // "Heat Exchanger", "Pump", etc.
  subtype      String?  // "Floating", "Fixed", etc.
  siteId       Int      @map("site_id")
  assignedTo   Int?     @map("assigned_to") // Cluster Supervisor ID
  createdBy    Int      @map("created_by")  // Site In-Charge ID
  attributes   Json?    // Flexible key-value pairs for device specs
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  // Relations
  site         Site   @relation(fields: [siteId], references: [id], onDelete: Cascade)
  assignedUser User?  @relation("DeviceAssignee", fields: [assignedTo], references: [id])
  creator      User   @relation("DeviceCreator", fields: [createdBy], references: [id])
  jobs         Job[]

  @@map("devices")
}

model Job {
  id        Int       @id @default(autoincrement())
  deviceId  Int       @map("device_id")
  name      String
  status    JobStatus @default(IN_PROGRESS)
  comment   String?   // Required when status is 'CONSTRAINT'
  updatedBy Int?      @map("updated_by") // Last person who updated status
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")

  // Relations
  device  Device @relation(fields: [deviceId], references: [id], onDelete: Cascade)
  updater User?  @relation(fields: [updatedBy], references: [id])

  @@map("jobs")
}
```

### Prisma Seed File (`prisma/seed.ts`)

```typescript
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create Owner user
  const ownerUser = await prisma.user.upsert({
    where: { email: 'owner@warehouse.com' },
    update: {},
    create: {
      email: 'owner@warehouse.com',
      passwordHash: await bcrypt.hash('password123', 10),
      name: 'System Owner',
      role: Role.OWNER,
      status: 'ACTIVE',
    },
  });

  // Create sample sites
  const site1 = await prisma.site.create({
    data: {
      name: 'Warehouse North',
      location: 'North District',
      createdById: ownerUser.id,
    },
  });

  const site2 = await prisma.site.create({
    data: {
      name: 'Warehouse South',
      location: 'South District',
      createdById: ownerUser.id,
    },
  });

  // Create Site In-Charge users
  const siteInCharge1 = await prisma.user.create({
    data: {
      email: 'incharge1@warehouse.com',
      passwordHash: await bcrypt.hash('password123', 10),
      name: 'John Site Manager',
      role: Role.SITE_INCHARGE,
      status: 'ACTIVE',
      siteId: site1.id,
    },
  });

  // Create sample devices with jobs
  const device1 = await prisma.device.create({
    data: {
      serialNumber: 'HE-001',
      name: 'Heat Exchanger Unit 1',
      type: 'Heat Exchanger',
      subtype: 'Floating',
      siteId: site1.id,
      createdBy: siteInCharge1.id,
      attributes: {
        capacity: '2000 BTU/hr',
        material: 'Stainless Steel',
        pressure_rating: '150 PSI',
      },
      jobs: {
        create: [
          { name: 'Pressure Test', status: 'IN_PROGRESS' },
          { name: 'Leak Check', status: 'IN_PROGRESS' },
          { name: 'Performance Calibration', status: 'IN_PROGRESS' },
        ],
      },
    },
  });

  console.log('Sample data created successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
```

### Package.json Scripts

```json
{
  "scripts": {
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio",
    "db:reset": "prisma migrate reset"
  }
}
```

---

## 🚀 API Endpoints Design

### Authentication Routes
```
POST /api/auth/register - User registration (pending status)
POST /api/auth/login - User login (JWT token)
POST /api/auth/logout - User logout
GET /api/auth/me - Get current user info with roles
```

### User Management Routes
```
GET /api/users - Get users (filtered by role/site)
GET /api/users/pending - Get pending approval users
PUT /api/users/:id/approve - Approve pending user
PUT /api/users/:id/role - Assign role to user
GET /api/users/hierarchy - Get user hierarchy tree
POST /api/users/assign-subordinate - Assign subordinate to superior
```

### Sites Management Routes
```
GET /api/sites - Get all sites (filtered by user role)
POST /api/sites - Create new site (Owner only)
GET /api/sites/:id - Get site details
PUT /api/sites/:id - Update site details
```

### Device Management Routes
```
GET /api/devices - Get devices (filtered by user role/site)
POST /api/devices - Create new device (Site In-Charge only)
GET /api/devices/:id - Get device details with jobs
PUT /api/devices/:id - Update device details
DELETE /api/devices/:id - Delete device
POST /api/devices/:id/assign - Assign device to cluster supervisor
```


```

### Jobs Management Routes
```
GET /api/jobs - Get jobs (filtered by user role that is get jobs of a user)
POST /api/jobs - Create new jobs (Site In-Charge only, gets an array of jobs from frontend and create them in db)
PUT /api/jobs/:id/status - Update job status (Cluster Supervisor only)

```

### Dashboard Data Routes
```
GET /api/dashboard/owner - Owner dashboard data
GET /api/dashboard/site-incharge/:siteId - Site In-Charge dashboard
GET /api/dashboard/site-supervisor - Site Supervisor dashboard
GET /api/dashboard/cluster-supervisor - Cluster Supervisor dashboard
```

---

## 🎨 Frontend Component Structure

### File Structure
```
src/
├── components/
│   ├── common/
│   │   ├── Header.jsx
│   │   ├── Sidebar.jsx
│   │   ├── LoadingSpinner.jsx
│   │   ├── StatusBadge.jsx
│   │   └── DataTable.jsx
│   ├── auth/
│   │   ├── LoginForm.jsx
│   │   ├── RegisterForm.jsx
│   │   └── ProtectedRoute.jsx
│   ├── dashboards/
│   │   ├── OwnerDashboard.jsx
│   │   ├── SiteInChargeDashboard.jsx
│   │   ├── SiteSupervisorDashboard.jsx
│   │   └── ClusterSupervisorDashboard.jsx
│   ├── devices/
│   │   ├── DeviceList.jsx
│   │   ├── DeviceForm.jsx
│   │   ├── DeviceDetails.jsx
│   │   └── AssignDeviceModal.jsx
│   ├── jobs/
│   │   ├── JobList.jsx
│   │   ├── JobStatusUpdate.jsx
│   │   └── JobHistory.jsx
│   └── users/
│       ├── UserList.jsx
│       ├── UserApproval.jsx
│       └── UserHierarchy.jsx
├── hooks/
│   ├── useAuth.js
│   ├── useApi.js
│   └── useDashboard.js
├── utils/
│   ├── api.js
│   ├── auth.js
│   └── constants.js
├── context/
│   └── AuthContext.jsx
└── pages/
    ├── Login.jsx
    ├── Dashboard.jsx
    ├── Devices.jsx
    ├── Jobs.jsx
    └── Users.jsx
```

### Key Components Specifications

#### 1. Dashboard Components (Role-Based)

**ClusterSupervisorDashboard.jsx**
- Display assigned devices in card/table format
- Each device shows: name, type, serial number, job count
- Click device → expand to show jobs with status update buttons
- Filters: device type, job status
- Status update modal with comment field for constraints

**SiteSupervisorDashboard.jsx**
- Read-only view of subordinates' devices and jobs
- Filters: cluster supervisor, device type, job status
- Summary cards: total devices, jobs by status
- Contact info cards for subordinates

**SiteInChargeDashboard.jsx**
- Device management section: create, assign, view all
- User management: assign roles, view hierarchy
- Site configuration: device types, subtypes
- Analytics cards: site overview, job completion rates

**OwnerDashboard.jsx**
- Multi-site overview with site cards
- Create new sites functionality
- Assign site in-charge capability
- High-level analytics across all sites

#### 2. Premium UI Elements

**StatusBadge.jsx**
```jsx
// Color-coded status badges
const statusColors = {
  completed: 'bg-green-100 text-green-800',
  in_progress: 'bg-blue-100 text-blue-800',
  constraint: 'bg-red-100 text-red-800'
};
```

**DataTable.jsx**
- Sortable columns
- Pagination
- Search/filter functionality
- Loading states with skeleton UI
- Responsive design

**Premium Design System:**
- Color Palette: Primary blue (#3B82F6), Success green (#10B981), Warning red (#EF4444)
- Typography: Inter font family
- Shadows: Subtle card shadows with hover effects
- Animations: Smooth transitions (200ms) for state changes
- Layout: Clean spacing with 8px grid system

---

## 🔐 Authentication & Authorization

### JWT Token Structure
```javascript
{
  userId: number,
  email: string,
  roles: [
    {
      roleName: string,
      siteId: number,
      siteName: string,
      permissions: string[]
    }
  ],
  exp: timestamp
}
```

### Route Protection Middleware
```javascript
// Backend middleware
const authorize = (requiredPermissions) => {
  return (req, res, next) => {
    const userPermissions = req.user.roles.flatMap(role => role.permissions);
    const hasPermission = requiredPermissions.some(perm => 
      userPermissions.includes(perm)
    );
    if (!hasPermission) return res.status(403).json({error: 'Forbidden'});
    next();
  };
};
```

### Frontend Route Protection
```jsx
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, hasRole } = useAuth();
  
  if (!user) return <Navigate to="/login" />;
  if (requiredRole && !hasRole(requiredRole)) {
    return <div>Access Denied</div>;
  }
  return children;
};
```

---

## 📱 User Workflows

### 1. Site Initialization Flow
1. **Owner** creates site → assigns Site In-Charge
2. **Site In-Charge** logs in → sets up device types/subtypes → creates devices → assigns users
3. **Site Supervisor** gets assigned → can view assigned cluster supervisors and their devices
4. **Cluster Supervisor** gets devices → updates job statuses

### 2. Device Management Flow
1. **Site In-Charge** creates device with attributes and jobs
2. **Site In-Charge** assigns entire device (with all jobs) to cluster supervisor
3. **Cluster Supervisor** sees device in dashboard → updates individual job statuses
4. **Site Supervisor** monitors progress (read-only)

### 3. User Registration & Approval Flow
1. User registers → status: 'pending'
2. Immediate superior (or Site In-Charge) sees pending users
3. Superior approves → assigns role and site → establishes hierarchy
4. User gets access to role-specific dashboard

---

## 🚀 Implementation Priority

### MVP Phases

**stage 1: Backend Foundation**
- Database setup with all tables
- User authentication (register/login)
- Basic CRUD APIs for users, sites, devices

**stage 2: Core Business Logic**
- Role-based authorization
- Device assignment functionality
- Job status update APIs
- User hierarchy management

**stage 3: Frontend Dashboards**
- Authentication pages
- Role-specific dashboards
- Device and job management interfaces
- Premium UI components

**stage 4: Integration & Polish**
- Frontend-backend integration
- Testing with sample data
- UI/UX polish and responsive design
- Deployment preparation

### Sample Data for Testing
- 2 Sites: "Warehouse North", "Warehouse South"
- Device Types: "Heat Exchanger", "Pump"
- 10-15 devices per site
- 3-5 jobs per device
- User hierarchy: 1 Owner, 2 Site In-Charges, 4 Site Supervisors, 8 Cluster Supervisors

---

## 💡 Development Tips

### Database Best Practices
- Use database constraints for referential integrity
- Index frequently queried columns (user_id, site_id, device_id)
- Use database triggers for audit trails
- Implement soft deletes for critical data

### Frontend State Management
- Use React Context for user authentication state
- React Query/SWR for server state management
- Local state for UI interactions
- Optimistic updates for better UX

### Performance Considerations
- Implement pagination for large datasets
- Use database views for complex dashboard queries
- Lazy loading for dashboard components
- Debounced search inputs

### Security Measures
- SQL injection prevention (parameterized queries)
- CORS configuration
- Rate limiting on auth endpoints
- Input validation and sanitization
- Secure password hashing (bcrypt)

---
