# Multi-Tenant Notes App

This is a **multi-tenant notes application** built with **Next.js (App Router)**, **Prisma**, and **Neon PostgreSQL**.  
Users can create, view, edit, and delete notes inside their tenant (organization).  
The app also has subscription limits (Free vs Pro) and role-based permissions (Admin vs User).

---

## Features

- **Multi-tenancy**
  - Every user belongs to a tenant.
  - Notes are always scoped to the tenant.

- **Authentication & Authorization**
  - JWT-based authentication using `Bearer <token>`.
  - Tenants can be on either `FREE` or `PRO` plan.

- **Subscription Plans**
  - Free plan → up to **3 notes**.
  - Pro plan → unlimited notes.

- **Role-based Access**
  - Admin → can edit or delete any note in the tenant.
  - User → can edit or delete only their own notes.
  - These rules are checked on the backend (API layer).

- **Frontend**
  - Form to add new notes.
  - List of notes with owner information.
  - Loader overlay while API requests run.

- **Backend API**
  - `GET /api/notes` → list notes + tenant info.
  - `POST /api/notes` → create a note (plan limit enforced).
  - `PUT /api/notes/:id` → update a note (owner or admin only).
  - `DELETE /api/notes/:id` → delete a note (owner or admin only).
  - `OPTIONS` handler included for CORS.

---

## Chosen Approach

1. **Multi-tenant design**  
   - Each user is tied to a `tenantId`.  
   - Notes are stored with both `tenantId` and `ownerId`.  
   - API queries always filter by `tenantId` so data is separated per tenant.  

2. **Subscription enforcement**  
   - When creating a note, backend checks the tenant’s plan.  
   - Free tenants cannot create more than 3 notes.  

3. **Authorization rules**  
   - The backend checks who is allowed to edit or delete a note.  
   - Only the note owner or an admin can perform those actions.  

4. **Loading state UX**  
   - When network requests are in progress, a dimmed overlay with a spinner is shown.  

---

## Tech Stack

- **Next.js 14+ (App Router)**
- **React (client components)**
- **Prisma ORM**
- **Neon PostgreSQL**
- **JWT for authentication**
- **TailwindCSS** for styling

---

## Installation

```bash
# 1. Clone the repository
git clone <repo-url>
cd notes-app

# 2. Install dependencies
npm install

# 3. Add environment variables to a `.env` file
DATABASE_URL="postgresql://<user>:<password>@<host>/<database>?sslmode=require"
JWT_SECRET="your-secret"

# 4. Run Prisma migrations
npx prisma migrate dev --name init

# 5. Start the development server
npm run dev
