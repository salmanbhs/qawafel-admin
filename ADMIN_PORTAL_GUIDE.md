# Qawafel — Admin Portal (Frontend) Integration Guide

## 1. Project Overview

**Qawafel** is a travel booking platform. The **Admin Portal** is a web-based dashboard for travel agency owners to manage their business — their agencies, offers, destinations — and monitor customer inquiries (contact logs).

### How It Works

1. **Agency owners** register/login via the admin portal.
2. They create one or more **Travel Agencies** (their business profiles).
3. For each agency, they create **Offers** (travel packages, hotel deals, tour packages).
4. Each offer can have one or more **Destinations** (the locations the offer covers).
5. When mobile app users contact them about an offer, the inquiry appears as a **Contact Log** in the dashboard.
6. The admin portal is a full CRUD management interface.

### Base URL

```
http://localhost:3000
```

> Replace with production URL when deployed.

### Response Format

All responses follow a consistent structure:

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE"
  }
}
```

---

## Role-Based Access Control (RBAC)

The Qawafel API implements a **three-tier role hierarchy** for managing system access:

| Role | Level | Permissions | Usage |
|------|-------|-----------|-------|
| **SYSTEM_ADMIN** | Top | Full system access, user management, role assignment, audit logs | Your internal team (2-3 people) |
| **TRAVEL_AGENCY_ADMIN** | Middle | Manage own travel agency, offers, destinations, view own contact logs | Travel agency owners/managers |
| **TRAVEL_AGENCY_STAFF** | Base | View own travel agency data, limited access | Agency employees |

### Role Assignment Flow

1. **System Admin** creates a new **Travel Agency Admin** user via `POST /admin/users`
2. **Travel Agency Admin** is linked to a specific travel agency
3. **Travel Agency Admin** can create **Travel Agency Staff** (future feature)
4. **Staff** members have read-only access to their agency's data

### Access Control

- All admin endpoints (`/admin/*`) require `SYSTEM_ADMIN` role
- Non-admin endpoints enforce ownership checks via JWT role data
- Attempting unauthorized access returns `403 FORBIDDEN`

**Example:** A `TRAVEL_AGENCY_ADMIN` user attempting to access `POST /admin/users` gets:
```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

### Authentication

All management endpoints require a **Bearer token** in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

The access token is a Supabase JWT enriched with **role and travel agency data** from the database. It expires after ~1 hour. Use the **refresh endpoint** to get a new one before it expires.

**JWT Payload includes:**
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "role": "SYSTEM_ADMIN | TRAVEL_AGENCY_ADMIN | TRAVEL_AGENCY_STAFF",
  "travelAgencyId": "uuid-or-null",
  "iat": 1708700000,
  "exp": 1708703600
}
```

### Localization & Multi-Language Support

The backend supports **Arabic** (primary) and **English** (secondary). When creating or updating content (travel agencies, offers, destinations), provide both language versions:

| Field | Example |
|-------|---------|
| `nameAr` / `nameEn` | Arabic and English names |
| `descriptionAr` / `descriptionEn` | Arabic and English descriptions |
| `hotelNameAr` / `hotelNameEn` | Arabic and English hotel names (offers only) |

**Requirements:**
- At least one language version of `name` is required (`nameAr` or `nameEn`).
- Other fields are optional but recommended to be filled in both languages.

**Responses:**
- When you GET data, the API returns localized field names (`name`, `description`, `hotelName`) based on the `Accept-Language` header.
- If a field is not available in the requested language, it falls back to the other language.

---

## 2. Admin User Management (System Admin Only)

### 2.1 Create User with Role

```
POST /admin/users
Authorization: Bearer <accessToken>  (requires SYSTEM_ADMIN role)
```

**Body:**
```json
{
  "email": "admin@travel-agency.com",
  "role": "TRAVEL_AGENCY_ADMIN",
  "travelAgencyId": "uuid-of-travel-agency-optional"
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `email` | string | Yes | Valid email, not already exists |
| `role` | enum | Yes | `SYSTEM_ADMIN`, `TRAVEL_AGENCY_ADMIN`, or `TRAVEL_AGENCY_STAFF` |
| `travelAgencyId` | UUID | No | Required for `TRAVEL_AGENCY_ADMIN` and `TRAVEL_AGENCY_STAFF` roles |

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "admin@travel-agency.com",
    "role": "TRAVEL_AGENCY_ADMIN"
  }
}
```

**On Success:**
- User account created in Supabase
- Record added to database with assigned role
- Welcome email sent with temporary password
- Audit log entry created

**Error Codes:** `EMAIL_EXISTS` (409), `TRAVEL_AGENCY_NOT_FOUND` (404), `INVALID_ROLE` (400)

---

### 2.2 List Users

```
GET /admin/users?role=TRAVEL_AGENCY_ADMIN&skip=0&take=20
Authorization: Bearer <accessToken>  (requires SYSTEM_ADMIN role)
```

| Query Param | Type | Default | Rules |
|-------------|------|---------|-------|
| `role` | enum | All | Filter by role: `SYSTEM_ADMIN`, `TRAVEL_AGENCY_ADMIN`, `TRAVEL_AGENCY_STAFF` |
| `isActive` | boolean | All | Filter by active/inactive status |
| `skip` | number | 0 | Pagination offset (min: 0) |
| `take` | number | 50 | Items per page (min: 1, max: 100) |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "uuid",
        "email": "admin@travel-agency.com",
        "role": "TRAVEL_AGENCY_ADMIN",
        "isActive": true,
        "createdAt": "2026-02-23T10:00:00Z",
        "updatedAt": "2026-02-23T10:00:00Z"
      }
    ],
    "total": 1,
    "skip": 0,
    "take": 20
  }
}
```

---

### 2.3 Update User Role

```
PATCH /admin/users/:id/role
Authorization: Bearer <accessToken>  (requires SYSTEM_ADMIN role)
```

**Body:**
```json
{
  "role": "TRAVEL_AGENCY_ADMIN",
  "travelAgencyId": "uuid-optional"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "admin@travel-agency.com",
    "role": "TRAVEL_AGENCY_ADMIN",
    "message": "User role updated successfully"
  }
}
```

**Effects:**
- User's role changed
- Email notification sent to user
- Audit log entry created

---

### 2.4 Deactivate User Account

```
PATCH /admin/users/:id/deactivate
Authorization: Bearer <accessToken>  (requires SYSTEM_ADMIN role)
```

**Body:** (empty or null)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "admin@travel-agency.com",
    "isActive": false,
    "message": "User account deactivated"
  }
}
```

**Effects:**
- User account marked inactive
- User cannot login
- All active sessions invalidated
- User receives notification email
- Audit log entry created

---

### 2.5 Activate User Account

```
PATCH /admin/users/:id/activate
Authorization: Bearer <accessToken>  (requires SYSTEM_ADMIN role)
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "admin@travel-agency.com",
    "isActive": true,
    "message": "User account activated"
  }
}
```

---

### 2.6 Force Password Reset

```
POST /admin/users/:id/reset-password
Authorization: Bearer <accessToken>  (requires SYSTEM_ADMIN role)
```

**Body:** (empty)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "admin@travel-agency.com",
    "message": "Password reset email sent"
  }
}
```

**Effects:**
- Generates temporary password
- Email sent to user with temporary password
- User must change password on next login
- Audit log entry created

---

### 2.7 View Audit Logs

```
GET /admin/audit-logs?userId=uuid&action=CREATE_USER&skip=0&take=50
Authorization: Bearer <accessToken>  (requires SYSTEM_ADMIN role)
```

| Query Param | Type | Rules |
|-------------|------|-------|
| `userId` | UUID | Filter by user who performed action |
| `action` | string | Filter by action type (e.g., `CREATE_USER`, `UPDATE_ROLE`) |
| `resourceType` | string | Filter by resource type (e.g., `User`, `TravelAgency`) |
| `skip` | number | Pagination offset (default: 0) |
| `take` | number | Items per page (default: 50, max: 100) |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "uuid",
        "userId": "uuid-of-admin",
        "action": "CREATE_USER",
        "resourceType": "User",
        "resourceId": "uuid-of-created-user",
        "changes": { "email": "user@example.com", "role": "TRAVEL_AGENCY_ADMIN" },
        "ipAddress": "192.168.1.1",
        "userAgent": "Mozilla/5.0...",
        "createdAt": "2026-02-23T10:30:15Z"
      }
    ],
    "total": 15,
    "skip": 0,
    "take": 50,
    "pages": 1
  }
}
```

**Common Actions:**
- `CREATE_USER` - New user created
- `UPDATE_ROLE` - User role changed
- `DEACTIVATE_USER` - User account deactivated
- `ACTIVATE_USER` - User account reactivated
- `RESET_PASSWORD` - Admin forced password reset

---

## 3. Data Model & Ownership Hierarchy

```
User (System Admin / Travel Agency Admin / Staff)
  ├── Role: SYSTEM_ADMIN | TRAVEL_AGENCY_ADMIN | TRAVEL_AGENCY_STAFF
  └── Travel Agency (linked to TRAVEL_AGENCY_ADMIN role)
        └── Offer (travel package/deal)
              ├── Destination (location the offer covers)
              └── Contact Log (customer inquiry)
```

**Ownership and Access Rules:**
- **SYSTEM_ADMIN** - Full system access, can manage any user or resource
- **TRAVEL_AGENCY_ADMIN** - Can only manage their assigned travel agency and its resources
- **TRAVEL_AGENCY_STAFF** - Can view assigned travel agency data (read-only)
- Contact logs are **read-only** — they are created by mobile app users
- Deleting a travel agency **cascades** to all its offers and destinations

### Status Workflows

| Entity | Statuses | Default | Notes |
|--------|----------|---------|-------|
| Travel Agency | `DRAFT` → `PUBLISHED` → `ARCHIVED` | `DRAFT` | Only `PUBLISHED` agencies are visible to mobile app users |
| Offer | `PENDING` → `APPROVED` → `ACTIVE` → `ARCHIVED` (or `REJECTED`) | `PENDING` | Only `ACTIVE` offers are visible to mobile app users |
| Destination | `PENDING` → `ACTIVE` → `ARCHIVED` | `PENDING` | Only `ACTIVE` destinations are visible to mobile app users |

---

## 4. Authentication Endpoints

### 4.1 Register

```
POST /auth/register
Authorization: Bearer <accessToken>  (requires SYSTEM_ADMIN role)
```

> **Note:** Registration is restricted to `SYSTEM_ADMIN` users only. New users are created through this endpoint or via the admin user management endpoints.

**Body:**
```json
{
  "email": "admin@myagency.com",
  "password": "SecurePass1!"
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `email` | string | Yes | Must be a valid email, max 255 characters |
| `password` | string | Yes | Min 8 characters, must contain uppercase, lowercase, number, and special character |

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "admin@myagency.com",
      "role": "TRAVEL_AGENCY_STAFF"
    }
  }
}
```

**Error Codes:** `EMAIL_EXISTS` (409), `REGISTRATION_FAILED` (400)

---

### 4.2 Login

```
POST /auth/login
```

> **Rate limited:** 5 requests per minute per IP.

**Body:**
```json
{
  "email": "admin@myagency.com",
  "password": "SecurePass1!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "admin@myagency.com",
      "role": "TRAVEL_AGENCY_ADMIN"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "a1b2c3d4e5f6g7h8..."
  }
}
```

**What to store:**
- `accessToken` → Store in memory or sessionStorage. Attach to every authenticated request.
- `refreshToken` → Store in httpOnly cookie or localStorage. Used to get new tokens.
- `user` → Store for UI display (name, email, role).

**Error Codes:** `INVALID_CREDENTIALS` (401), `USER_NOT_FOUND` (404)

---

### 4.3 Refresh Token

Call this before the access token expires (~1 hour) or when you get a 401 response.

```
POST /auth/refresh
```

**Body:**
```json
{
  "refreshToken": "a1b2c3d4e5f6g7h8..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...(new)",
    "refreshToken": "x9y0z1...(new)"
  }
}
```

> **Important:** The refresh token is **rotated** on each use. Always replace the stored refresh token with the new one.

**Error Codes:** `INVALID_REFRESH_TOKEN` (401), `SESSION_EXPIRED` (401)

---

### 4.4 Logout

```
POST /auth/logout
Authorization: Bearer <accessToken>
```

**Body:**
```json
{
  "refreshToken": "a1b2c3d4e5f6g7h8..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": { "message": "Logged out successfully" }
}
```

---

### 4.5 Get Current User

```
GET /auth/me
Authorization: Bearer <accessToken>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "admin@myagency.com",
      "role": "TRAVEL_AGENCY_ADMIN",
      "isActive": true,
      "travelAgencyId": "uuid-or-null",
      "createdAt": "2026-02-20T10:00:00.000Z",
      "updatedAt": "2026-02-23T10:00:00.000Z"
    }
  }
}
```

> Returns fresh user data from the database (not just the JWT payload).

---

### 4.6 Forgot Password

```
POST /auth/forgot-password
```

> **Rate limited:** 3 requests per minute per IP.

**Body:**
```json
{
  "email": "admin@myagency.com"
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `email` | string | Yes | Must be a valid email |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "If email exists, password reset link has been sent"
  }
}
```

> **Security:** Always returns success even if the email doesn't exist, to prevent email enumeration.

---

### 4.7 Reset Password

```
POST /auth/reset-password
```

> **Rate limited:** 5 requests per minute per IP.

**Body:**
```json
{
  "token": "reset-token-from-email-link",
  "password": "NewSecurePass1!"
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `token` | string | Yes | Token from the reset email link |
| `password` | string | Yes | Min 8 characters, must contain uppercase, lowercase, number, and special character |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Password has been reset successfully"
  }
}
```

**Error Codes:** `INVALID_TOKEN` (400), `TOKEN_EXPIRED` (400), `INVALID_REQUEST` (400)

---

## 5. Travel Agency Management

### 5.1 Create Travel Agency

```
POST /travel-agencies
Authorization: Bearer <accessToken>
```

**Body:**
```json
{
  "nameAr": "قافلة للسفر والسياحة",
  "nameEn": "Qawafel Travel & Tourism",
  "descriptionAr": "تجارب سفر فاخرة في الشرق الأوسط",
  "descriptionEn": "Premium travel experiences across the Middle East",
  "contactEmail": "bookings@qawafel.com",
  "status": "DRAFT"
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `nameAr` | string | Conditional | At least one of `nameAr` or `nameEn` required. Max 255 characters |
| `nameEn` | string | Conditional | At least one of `nameAr` or `nameEn` required. Max 255 characters |
| `descriptionAr` | string | No | Max 2000 characters |
| `descriptionEn` | string | No | Max 2000 characters |
| `contactEmail` | string | No | Must be valid email |
| `status` | enum | No | `DRAFT` (default), `PUBLISHED`, `ARCHIVED` |

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "nameAr": "قافلة للسفر والسياحة",
    "nameEn": "Qawafel Travel & Tourism",
    "descriptionAr": "تجارب سفر فاخرة...",
    "descriptionEn": "Premium travel experiences...",
    "contactEmail": "bookings@qawafel.com",
    "status": "DRAFT",
    "isFeatured": false,
    "createdAt": "2026-02-20T10:00:00.000Z",
    "updatedAt": "2026-02-20T10:00:00.000Z"
  }
}
```

---

### 5.2 List Travel Agencies

```
GET /travel-agencies?page=1&limit=20
```

> **Note:** This is a public endpoint. Returns only `PUBLISHED` agencies. The admin portal can use this to show a preview of what mobile users see.

| Query Param | Type | Default | Rules |
|-------------|------|---------|-------|
| `page` | number | 1 | Min: 1 |
| `limit` | number | 20 | Min: 1, Max: 100 |

**Response includes pagination metadata:**
```json
{
  "success": true,
  "data": {
    "data": [ ... ],
    "meta": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

---

### 5.3 Get Travel Agency Details

```
GET /travel-agencies/:id
```

> **Note:** This is a public endpoint. Returns only `PUBLISHED` agencies. The response includes only `ACTIVE` offers for that agency.

| Path Param | Type | Rules |
|------------|------|-------|
| `id` | UUID | Must be a valid UUID |

---

### 5.4 Update Travel Agency

```
PATCH /travel-agencies/:id
Authorization: Bearer <accessToken>
```

**Body (all fields optional):**
```json
{
  "nameAr": "اسم الوكالة المحدّث",
  "nameEn": "Updated Agency Name",
  "descriptionAr": "الوصف المحدّث",
  "descriptionEn": "Updated description",
  "contactEmail": "new@email.com",
  "status": "PUBLISHED",
  "isFeatured": true
}
```

| Field | Type | Rules |
|-------|------|-------|
| `nameAr` | string | Max 255 characters |
| `nameEn` | string | Max 255 characters |
| `descriptionAr` | string | Max 2000 characters |
| `descriptionEn` | string | Max 2000 characters |
| `contactEmail` | string | Valid email |
| `status` | enum | `DRAFT`, `PUBLISHED`, `ARCHIVED` |
| `isFeatured` | boolean | **SYSTEM_ADMIN only** — ignored for other roles |

> Server verifies the authenticated user owns this agency (or is `SYSTEM_ADMIN`). Returns `403 FORBIDDEN` otherwise.
> The `isFeatured` field can only be set by `SYSTEM_ADMIN` users. It is silently stripped for other roles.

**Admin portal workflow:**
1. Create agency with `status: "DRAFT"`.
2. Fill in all details, add offers and destinations.
3. When ready, update `status: "PUBLISHED"` to make it visible to mobile users.
4. To temporarily hide, set `status: "ARCHIVED"`.

---

### 5.5 Delete Travel Agency

```
DELETE /travel-agencies/:id
Authorization: Bearer <accessToken>
```

> **Warning:** This cascades — all offers and destinations under this agency will be deleted.
> Server verifies the authenticated user owns this agency (or is `SYSTEM_ADMIN`).

---

## 6. Offer Management

### 6.1 Create Offer

```
POST /offers
Authorization: Bearer <accessToken>
```

**Body:**
```json
{
  "travelAgencyId": "uuid-of-your-agency",
  "nameAr": "باقة المالديف الفاخرة — 7 ليال",
  "nameEn": "Luxury Maldives Resort — 7 Nights",
  "descriptionAr": "تجربة منتجع شامل 5 نجوم",
  "descriptionEn": "All-inclusive 5-star resort experience",
  "hotelNameAr": "منتجع الشاطئ الفردوسي ومنتجع صحي",
  "hotelNameEn": "Paradise Beach Resort & Spa",
  "bedCount": 2,
  "checkInDate": "2026-06-01",
  "checkOutDate": "2026-06-08",
  "price": 3500.00,
  "maxGuests": 4,
  "currency": "BHD",
  "status": "PENDING"
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `travelAgencyId` | UUID | **Yes** | Must own this agency |
| `nameAr` | string | Conditional | At least one of `nameAr` or `nameEn` required. Max 255 characters |
| `nameEn` | string | Conditional | At least one of `nameAr` or `nameEn` required. Max 255 characters |
| `descriptionAr` | string | No | Max 2000 characters |
| `descriptionEn` | string | No | Max 2000 characters |
| `hotelNameAr` | string | No | Max 255 characters |
| `hotelNameEn` | string | No | Max 255 characters |
| `bedCount` | integer | No | Min: 1 |
| `checkInDate` | date | No | ISO 8601 format |
| `checkOutDate` | date | No | ISO 8601 format, must be after `checkInDate` |
| `price` | number | No | Min: 0 |
| `maxGuests` | integer | No | Min: 1 |
| `currency` | string | No | Max 10 characters. Default: `"BHD"` |
| `status` | enum | No | `PENDING` (default), `APPROVED`, `REJECTED`, `ACTIVE`, `ARCHIVED` |

> **Note:** For non-`SYSTEM_ADMIN` users, the `status` is always forced to `PENDING` regardless of the value provided. Only `SYSTEM_ADMIN` can set the initial status.

**Success Response (201)** — Returns the created offer.

---

### 6.2 List Offers

```
GET /offers?page=1&limit=20
```

> Public endpoint. Returns only `ACTIVE` offers. Use for previewing the mobile view.

---

### 6.3 Get Offer Details

```
GET /offers/:id
```

Returns the offer with its related destinations and travel agency.

> **Note:** This is a public endpoint. Only `ACTIVE` offers are returned; non-active offers return `404 NOT_FOUND`.

---

### 6.4 Update Offer

```
PATCH /offers/:id
Authorization: Bearer <accessToken>
```

**Body (all fields optional):**
```json
{
  "nameAr": "اسم الباقة المحدّث",
  "nameEn": "Updated Package Name",
  "price": 2999.99,
  "status": "ACTIVE",
  "isFeatured": true
}
```

| Field | Type | Rules |
|-------|------|-------|
| `nameAr` | string | Max 255 characters |
| `nameEn` | string | Max 255 characters |
| `descriptionAr` | string | Max 2000 characters |
| `descriptionEn` | string | Max 2000 characters |
| `hotelNameAr` | string | Max 255 characters |
| `hotelNameEn` | string | Max 255 characters |
| `bedCount` | integer | Min: 1 |
| `checkInDate` | date | ISO 8601 |
| `checkOutDate` | date | ISO 8601, must be after `checkInDate` |
| `price` | number | Min: 0 |
| `maxGuests` | integer | Min: 1 |
| `currency` | string | Max 10 characters |
| `status` | enum | `PENDING`, `APPROVED`, `REJECTED`, `ACTIVE`, `ARCHIVED` |
| `isFeatured` | boolean | **SYSTEM_ADMIN only** — ignored for other roles |

> Server verifies ownership via the parent travel agency (or `SYSTEM_ADMIN` bypass).
> The `isFeatured` field can only be set by `SYSTEM_ADMIN` users. It is silently stripped for other roles.

**Admin portal workflow:**
1. Create offer with `status: "PENDING"`.
2. Fill in all details, add destinations.
3. Set `status: "ACTIVE"` to make it visible to mobile users.
4. Set `status: "ARCHIVED"` to hide it.

---

### 6.5 Delete Offer

```
DELETE /offers/:id
Authorization: Bearer <accessToken>
```

> Cascades to destinations and sets `offerId: null` on contact logs.
> Server verifies ownership via the parent travel agency (or `SYSTEM_ADMIN` bypass).

---

## 7. Destination Management

### 7.1 Create Destination

```
POST /destinations
Authorization: Bearer <accessToken>
```

**Body:**
```json
{
  "offerId": "uuid-of-your-offer",
  "nameAr": "جزر المالديف",
  "nameEn": "Maldives",
  "descriptionAr": "مياه صافية جداً وشواطئ رملية بيضاء",
  "descriptionEn": "Crystal clear waters and white sand beaches",
  "country": "Maldives",
  "region": "South Asia",
  "city": "Malé",
  "latitude": 3.2028,
  "longitude": 73.2207,
  "status": "PENDING"
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `offerId` | UUID | **Yes** | Must own the parent offer's agency |
| `nameAr` | string | Conditional | At least one of `nameAr` or `nameEn` required. Max 255 characters |
| `nameEn` | string | Conditional | At least one of `nameAr` or `nameEn` required. Max 255 characters |
| `descriptionAr` | string | No | Max 2000 characters |
| `descriptionEn` | string | No | Max 2000 characters |
| `country` | string | No | Max 255 characters |
| `region` | string | No | Max 255 characters |
| `city` | string | No | Max 255 characters |
| `latitude` | number | No | Decimal (10,8) precision |
| `longitude` | number | No | Decimal (11,8) precision |
| `status` | enum | No | `PENDING` (default), `ACTIVE`, `ARCHIVED` |

> **Note:** For non-`SYSTEM_ADMIN` users, the `status` is always forced to `PENDING` regardless of the value provided. Only `SYSTEM_ADMIN` can set the initial status.

---

### 7.2 List Destinations

```
GET /destinations?page=1&limit=20
```

> Public endpoint. Returns only `ACTIVE` destinations.

---

### 7.3 Get Offers by Destination

```
GET /destinations/:id/offers?page=1&limit=20&travelAgency=uuid
```

| Param | Location | Type | Required | Description |
|-------|----------|------|----------|-------------|
| `id` | Path | UUID | Yes | Destination ID (from `GET /destinations` response) |
| `travelAgency` | Query | UUID | No | Filter by your travel agency to see only your offers |
| `page` | Query | number | No | Default: 1 |
| `limit` | Query | number | No | Default: 20 |

> Useful for the admin portal to see how your offers appear grouped by destination.

---

### 7.4 Get Destination Details

```
GET /destinations/:id
```

> **Note:** This is a public endpoint. Only `ACTIVE` destinations are returned; non-active destinations return `404 NOT_FOUND`.

---

### 7.5 Update Destination

```
PATCH /destinations/:id
Authorization: Bearer <accessToken>
```

**Body (all fields optional):**
```json
{
  "nameAr": "الاسم المحدّث",
  "nameEn": "Updated Name",
  "country": "Saudi Arabia",
  "status": "ACTIVE",
  "isFeatured": true
}
```

> The `isFeatured` field can only be set by `SYSTEM_ADMIN` users. It is silently stripped for other roles.
> Server verifies ownership via the parent offer's travel agency (or `SYSTEM_ADMIN` bypass).

---

### 7.6 Delete Destination

```
DELETE /destinations/:id
Authorization: Bearer <accessToken>
```

> Server verifies ownership via the parent offer's travel agency (or `SYSTEM_ADMIN` bypass).

---

## 8. Offer Image Management & Smart Extraction

The Offer Image system enables **intelligent document processing** for travel offers. Upload an offer image (flyer, brochure page, screenshot), and the system automatically performs:

1. **Image Optimization** — Compression to 1000px width, WebP format, 70% quality
2. **OCR Extraction** — Google Cloud Vision API extracts Arabic text
3. **Smart Field Extraction** — Rule-based extraction of dates, prices, destinations, hotels
4. **Confidence Scoring** — Per-field confidence assessment (0.0-1.0 scale)
5. **User Confirmation** — Travel agency staff selects which extracted fields to apply

**Use Cases:**
- Bulk upload 100+ scanned offer sheets and auto-populate offer fields
- Extract structured data from travel brochures without manual data entry
- Build confidence-weighted suggestions for field pre-fill

### 8.1 Upload Image & Get Extraction Suggestions

```
POST /offers/:offerId/upload-image
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data
```

**Parameters:**

| Param | Location | Type | Required | Rules |
|-------|----------|------|----------|-------|
| `offerId` | Path | UUID | Yes | Must own this offer (via parent agency) |
| `file` | Body (multipart) | File | Yes | JPEG, PNG, WebP, GIF. Max 5MB |

**Request Example (curl):**
```bash
curl -X POST http://localhost:3000/offers/550e8400-e29b-41d4-a716-446655440000/upload-image \
  -H "Authorization: Bearer <accessToken>" \
  -F "file=@offer_scan.jpg"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "imageId": "uuid-of-stored-image",
    "supabaseStoragePath": "offer-images/550e8400.../image_1708700000.webp",
    "imageUrl": "https://project.supabase.co/storage/v1/object/public/offer-images/...",
    "extractedData": {
      "price": {
        "value": 3500,
        "currency": "SAR",
        "confidence": 0.95,
        "source": "REGEX_MATCH"
      },
      "checkInDate": {
        "value": "2026-06-01",
        "confidence": 0.88,
        "format": "Gregorian"
      },
      "checkOutDate": {
        "value": "2026-06-08",
        "confidence": 0.87,
        "nightCount": 7
      },
      "hotelName": {
        "value": "Paradise Beach Resort & Spa",
        "confidence": 0.92,
        "stars": 5
      },
      "destination": {
        "value": "Maldives",
        "confidence": 0.90,
        "country": "Maldives"
      }
    },
    "rawOcrText": "باقة المالديف الفاخرة — 7 ليال\nفندق الشاطئ الفردوسي ومنتجع صحي...",
    "ocrLanguage": "ar",
    "ocrConfidence": 0.96,
    "confidenceRating": "EXCELLENT",
    "averageConfidence": 0.91
  }
}
```

**Confidence Tiers:**
- **HIGH CONFIDENCE** (≥ 0.85): Field is highly reliable
- **SUGGESTED** (0.70–0.84): Review recommended before applying
- **LOW CONFIDENCE** (< 0.70): Not included in suggestions; review raw OCR text

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `imageId` | UUID | Unique identifier for this stored image |
| `supabaseStoragePath` | string | Path in Supabase storage |
| `imageUrl` | string | Public HTTPS URL for viewing/downloading |
| `extractedData` | object | Extracted fields with confidence scores |
| `rawOcrText` | string | Full Arabic text extracted by Google Vision |
| `ocrLanguage` | string | Detected language (`ar`, `en`, etc.) |
| `ocrConfidence` | number | OCR text quality (0.0–1.0) |
| `confidenceRating` | enum | Overall quality: `EXCELLENT`, `GOOD`, `FAIR`, `POOR` |
| `averageConfidence` | number | Mean confidence across all fields (0.0–1.0) |

**Error Responses:**

| Status | Code | Meaning |
|--------|------|---------|
| `400` | `FILE_MISSING` | No file provided |
| `400` | `INVALID_FILE_TYPE` | File is not JPEG, PNG, WebP, or GIF |
| `413` | `FILE_TOO_LARGE` | File exceeds 5MB limit |
| `404` | `OFFER_NOT_FOUND` | Offer ID doesn't exist |
| `403` | `FORBIDDEN` | You don't own this offer |
| `504` | `OCR_TIMEOUT` | Google Vision API took too long (60s timeout) |
| `500` | `EXTRACTION_FAILED` | Extraction engine error |

---

### 8.2 Confirm Extracted Data & Apply to Offer

Once you review the extracted suggestions, confirm which fields to apply to the offer:

```
POST /offers/:offerId/confirm-extraction
Authorization: Bearer <accessToken>
```

**Body:**
```json
{
  "imageId": "uuid-of-image",
  "confirmedData": {
    "price": 3500,
    "currency": "SAR",
    "hotelNameAr": "فندق الشاطئ الفردوسي ومنتجع صحي",
    "hotelNameEn": "Paradise Beach Resort & Spa",
    "checkInDate": "2026-06-01",
    "checkOutDate": "2026-06-08",
    "destination": "Maldives"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "offerId": "550e8400-e29b-41d4-a716-446655440000",
    "message": "Extraction confirmed and offer updated",
    "updatedFields": ["price", "hotelName", "checkInDate", "checkOutDate", "destination"]
  }
}
```

**What happens:**
1. OfferImage record is marked with `confirmationStatus: CONFIRMED`
2. Corresponding Offer fields are updated
3. Offer's `dataSource` set to `OCR_EXTRACTED`
4. `lastImageUploadedAt` timestamp updated

---

### 8.3 List Offer Images

```
GET /offers/:offerId/images?page=1&limit=20
Authorization: Bearer <accessToken>
```

| Query Param | Type | Default | Rules |
|-------------|------|---------|-------|
| `page` | number | 1 | Min: 1 |
| `limit` | number | 20 | Min: 1, Max: 100 |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "uuid-of-image",
        "offerId": "550e8400...",
        "supabaseStoragePath": "offer-images/550e8400.../image_1708700000.webp",
        "imageUrl": "https://project.supabase.co/storage/...",
        "extractedData": { ... },
        "confirmedData": { ... },
        "confirmationStatus": "CONFIRMED",
        "ocrLanguage": "ar",
        "ocrConfidence": 0.96,
        "averageConfidence": 0.91,
        "createdAt": "2026-02-23T10:15:00.000Z",
        "updatedAt": "2026-02-23T10:16:30.000Z"
      }
    ],
    "meta": { "page": 1, "limit": 20, "total": 5, "totalPages": 1 }
  }
}
```

---

### 8.4 Delete Image

```
DELETE /offers/:offerId/images/:imageId
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Image deleted successfully"
  }
}
```

**Side Effects:**
- Image removed from Supabase storage
- OfferImage record deleted from database
- Offer's `imageCount` decremented
- If this was the `primaryImageId`, it is cleared

---

### 8.5 What Gets Extracted?

The system extracts the following fields from offer images:

| Field | Type | Extraction Method | Example |
|-------|------|-------------------|---------|
| `price` | number | Regex patterns + currency detection | `3500 ريال` → `{ value: 3500, currency: "SAR" }` |
| `currency` | string | Currency symbol/code matching | `BHD`, `SAR`, `AED`, `USD` |
| `checkInDate` | date | Hijri/Gregorian date parsing | `١/٦/٢٠٢٦` → `2026-06-01` |
| `checkOutDate` | date | Date range parsing + night calculation | `1 - 8 June` → `{ from: 2026-06-01, to: 2026-06-08, nights: 7 }` |
| `hotelName` | string | "فندق [name]" pattern + fuzzy matching | Extract hotel name |
| `hotelStars` | integer | Explicit mention or adjective matching | `1`–`5` stars |
| `destination` | string | Dictionary matching (40+ cities) + fuzzy | `جزر المالديف` → `Maldives` |
| `maxGuests` | integer | Number parsing near "guests" keyword | `لـ 4 أشخاص` → `4` |

---

### 8.6 Extraction Failure & Logging

If extraction fails for any reason, the system logs the failure for quarterly review:

**ExtractionLog Table** captures:
- `failureType`: `OCR_FAILED`, `TEXT_CLEANING_FAILED`, `PARSING_FAILED`, `CONFIDENCE_TOO_LOW`, etc.
- `failureStage`: `UPLOAD`, `OCR_EXTRACTION`, `TEXT_NORMALIZATION`, `FIELD_EXTRACTION`, `CONFIDENCE_SCORING`
- `debugData`: Full OCR text, intermediate parsing results, error messages
- `resolutionAction`: Notes for quarterly pattern review (auto-extracted fields to add to rules)

**Admin can review** at `GET /admin/extraction-logs` (future endpoint) to identify missing patterns.

---

### 8.7 Confidence Score Interpretation

Each field's confidence reflects the extraction certainty:

| Confidence | Interpretation | Recommendation |
|------------|-----------------|------------------|
| **0.95–1.0** | Exact match (dictionary or perfect regex) | Auto-fill without user review |
| **0.80–0.94** | Strong match (fuzzy match or high-quality OCR) | Pre-fill, user should verify |
| **0.70–0.79** | Reasonable match (partial fuzzy or inferred data) | Display as suggestion, require user confirmation |
| **0.50–0.69** | Loose match (guessed or partial parse) | Show in suggestions, require explicit user selection |
| **< 0.50** | Very low confidence | Omit from suggestions, log for review |

**Overall Rating** based on average confidence and high-confidence field percentage:

| Rating | Average Confidence | High-Confidence Fields | Meaning |
|--------|-------------------|----------------------|---------|
| `EXCELLENT` | > 0.90 | > 80% | Extraction is very reliable |
| `GOOD` | > 0.80 | > 60% | Extraction is trustworthy |
| `FAIR` | > 0.70 | > 40% | Extraction needs review |
| `POOR` | ≤ 0.70 | ≤ 40% | Extraction is unreliable |

---

## 9. Contact Logs (Customer Inquiries)

Contact logs are **read-only** for the admin portal. They are created by mobile app users when they inquire about an offer.

### 8.1 List Contact Logs

```
GET /contact-logs?page=1&limit=20&offerId=uuid
Authorization: Bearer <accessToken>
```

| Query Param | Type | Required | Description |
|-------------|------|----------|-------------|
| `offerId` | UUID | No | Filter by specific offer |
| `page` | number | No | Default: 1 |
| `limit` | number | No | Default: 20 |

> **Only returns contact logs for offers owned by the authenticated user.** You cannot see other agencies' inquiries.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "uuid",
        "offerId": "uuid",
        "phone": "+966501234567",
        "email": "customer@example.com",
        "message": "I'm interested in this package for 4 people",
        "source": "mobile_app",
        "createdAt": "2026-02-20T14:30:00.000Z",
        "offer": {
          "id": "uuid",
          "name": "Luxury Maldives Resort"
        }
      }
    ],
    "meta": { "page": 1, "limit": 20, "total": 8, "totalPages": 1 }
  }
}
```

---

### 8.2 Get Contact Log Details

```
GET /contact-logs/:id
Authorization: Bearer <accessToken>
```

> Returns the contact log only if the parent offer belongs to the authenticated user.

---

## 10. Admin Portal Pages & Endpoint Mapping

Here's a recommended page structure and which endpoints each page uses:

### Page: Login / Register

| Action | Endpoint |
|--------|----------|
| Register | `POST /auth/register` |
| Login | `POST /auth/login` |

### Page: Dashboard (Home)

| Action | Endpoint |
|--------|----------|
| Get user profile | `GET /auth/me` |
| List my agencies | `GET /travel-agencies` |
| Recent contact logs | `GET /contact-logs?limit=5` |

### Page: Travel Agencies

| Action | Endpoint |
|--------|----------|
| List all agencies | `GET /travel-agencies` |
| View agency details | `GET /travel-agencies/:id` |
| Create new agency | `POST /travel-agencies` |
| Edit agency | `PATCH /travel-agencies/:id` |
| Delete agency | `DELETE /travel-agencies/:id` |
| Publish agency | `PATCH /travel-agencies/:id` with `{ "status": "PUBLISHED" }` |

### Page: Offers (under an agency)

| Action | Endpoint |
|--------|----------|
| List all offers | `GET /offers` |
| View offer details | `GET /offers/:id` |
| Create new offer | `POST /offers` |
| Edit offer | `PATCH /offers/:id` |
| Delete offer | `DELETE /offers/:id` |
| Activate offer | `PATCH /offers/:id` with `{ "status": "ACTIVE" }` |
| Upload & extract image | `POST /offers/:id/upload-image` |
| List offer images | `GET /offers/:id/images` |
| Confirm extraction | `POST /offers/:id/confirm-extraction` |
| Delete offer image | `DELETE /offers/:id/images/:imageId` |

### Page: Destinations (under an offer)

| Action | Endpoint |
|--------|----------|
| List all destinations | `GET /destinations` |
| View destination details | `GET /destinations/:id` |
| Create new destination | `POST /destinations` |
| Edit destination | `PATCH /destinations/:id` |
| Delete destination | `DELETE /destinations/:id` |
| Activate destination | `PATCH /destinations/:id` with `{ "status": "ACTIVE" }` |

### Page: Contact Logs / Inquiries

| Action | Endpoint |
|--------|----------|
| List all inquiries | `GET /contact-logs` |
| Filter by offer | `GET /contact-logs?offerId=uuid` |
| View inquiry details | `GET /contact-logs/:id` |

### Global: Auth Token Management

| Action | Endpoint |
|--------|----------|
| Refresh token (on 401 or before expiry) | `POST /auth/refresh` |
| Logout | `POST /auth/logout` |

---

## 11. Recommended Auth Implementation for Admin Portal

### Axios Interceptor Example

```typescript
// api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post('http://localhost:3000/auth/refresh', {
          refreshToken,
        });

        // Store new tokens
        sessionStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed — redirect to login
        localStorage.removeItem('refreshToken');
        sessionStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
```

---

## 12. Test Credentials

The database is seeded with the following test accounts. To use them, first authenticate them in Supabase:

### System Admins
- **admin1@qawafel.com**
- **admin2@qawafel.com**

### Travel Agency Admins
- **egypt-admin@qawafel.com** (manages Egypt Adventure 2026)
- **dubai-admin@qawafel.com** (manages Dubai Luxury Tour)

### Travel Agency Staff
- **egypt-staff1@qawafel.com** (Egypt Adventure staff)
- **egypt-staff2@qawafel.com** (Egypt Adventure staff)
- **dubai-staff1@qawafel.com** (Dubai Luxury staff)

**To test with these accounts:**
1. Create passwords for them in Supabase Auth dashboard
2. Login using the credentials
3. Test role-based access:
   - ✅ Admins can access `POST /admin/users`, `GET /admin/audit-logs`
   - ❌ Agency Admins get `403 Forbidden` on admin endpoints
   - ❌ Staff members get `403 Forbidden` on admin endpoints

---

## 13. Error Codes Reference

| Code | HTTP Status | Meaning |
|------|-------------|---------|
| `EMAIL_EXISTS` | 409 | Email already registered |
| `INVALID_CREDENTIALS` | 401 | Wrong email or password |
| `INVALID_TOKEN` | 401 | Access token expired or invalid |
| `INVALID_REFRESH_TOKEN` | 401 | Refresh token invalid or used |
| `SESSION_EXPIRED` | 401 | Session gone — must re-login |
| `USER_NOT_FOUND` | 404 | User not in database |
| `NOT_FOUND` | 404 | Resource not found |
| `FORBIDDEN` | 403 | Not the owner of this resource |
| `UNAUTHORIZED` | 403 | Refresh token doesn't belong to user |
| `REGISTRATION_FAILED` | 400 | Supabase signup failed |
| `VALIDATION_ERROR` | 400 | Request body failed validation |
| `TOKEN_ROTATION_FAILED` | 500 | Internal — token rotation error |
| `ACCOUNT_DISABLED` | 403 | User account is inactive |
| `OPERATION_NOT_PERMITTED` | 403 | Insufficient role permissions |
| `INVALID_REQUEST` | 400 | Missing or invalid request parameters |
| `TOKEN_EXPIRED` | 400 | Password reset token has expired |
| `TRAVEL_AGENCY_NOT_FOUND` | 404 | Travel agency ID not found |
| `SELF_MODIFICATION` | 403 | Cannot modify your own role/account |
| `INVALID_UUID` | 400 | Path parameter is not a valid UUID |
| `VALIDATION_FAILED` | 400 | At least one of phone/email must be provided |

### Rate Limits

The API enforces rate limiting per IP address:

| Endpoint | Limit |
|----------|-------|
| Global (all endpoints) | 100 requests / minute |
| `POST /auth/login` | 5 requests / minute |
| `POST /auth/forgot-password` | 3 requests / minute |
| `POST /auth/reset-password` | 5 requests / minute |
| `POST /contact-logs` | 10 requests / minute |

Exceeding the limit returns `429 Too Many Requests`.

---

## 14. UUID Format

All resource IDs are **UUIDs** (v4). Example:

```
550e8400-e29b-41d4-a716-446655440000
```

All endpoints that accept an `:id` path parameter validate that it's a valid UUID and return `400 Bad Request` with code `INVALID_UUID` if not.
