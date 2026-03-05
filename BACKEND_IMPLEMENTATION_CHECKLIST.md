# 🔧 Backend Implementation Checklist

## What Frontend Now Expects

This document lists all the backend endpoints and database changes that the frontend expects to be implemented.

---

## 📋 Database Schema Changes Required

### 1. **Offer Model** - Add Archive Fields

```prisma
model Offer {
  // ... existing fields ...
  
  // ARCHIVE FIELDS (NEW)
  isArchived    Boolean?     @default(false)
  archivedAt    DateTime?
  
  // ... rest of fields ...
}
```

**Rationale:**
- `isArchived`: Flag to mark offer as archived (soft delete)
- `archivedAt`: Timestamp of when offer was archived (for cleanup timeline)

### 2. **OfferImage Model** - Add Image Cleanup Fields

```prisma
model OfferImage {
  // ... existing fields ...
  
  // IMAGE CLEANUP FIELDS (NEW)
  isImageDeleted    Boolean?      @default(false)
  imageDeletedAt    DateTime?
  
  // ... rest of fields ...
}
```

**Rationale:**
- `isImageDeleted`: Soft-delete flag for image cleanup (marks for deletion)
- `imageDeletedAt`: When the image was marked for deletion (for 90-day timer)

---

## 🌐 API Endpoints Required

### **1. Archive Single Offer**

```
PATCH /api/offers/:id/archive
```

**Authentication:** Required (SYSTEM_ADMIN role)

**Request Body:**
```json
{}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "offer-123",
    "title": "Summer Vacation Package",
    "status": "ARCHIVED",
    "isArchived": true,
    "archivedAt": "2026-03-05T10:30:00Z"
  }
}
```

**Implementation Details:**
- Find offer by ID
- Check user is SYSTEM_ADMIN or agency owner
- Set `isArchived = true`
- Set `archivedAt = now()`
- Keep `status` as-is (usually INACTIVE or ACTIVE)
- Return updated offer

---

### **2. Unarchive Single Offer**

```
PATCH /api/offers/:id/unarchive
```

**Authentication:** Required (SYSTEM_ADMIN role)

**Request Body:**
```json
{}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "offer-123",
    "title": "Summer Vacation Package",
    "status": "INACTIVE",
    "isArchived": false,
    "archivedAt": null
  }
}
```

**Implementation Details:**
- Find offer by ID
- Check user is SYSTEM_ADMIN
- Set `isArchived = false`
- Set `archivedAt = null`
- Keep previous status intact
- Return updated offer

---

### **3. Get All Archived Offers (Admin)**

```
GET /api/offers/admin/archived
```

**Authentication:** Required (SYSTEM_ADMIN role)

**Query Parameters:**
```
?page=1
&limit=20
&travelAgencyId=agency-123  (optional)
&destinationId=dest-456     (optional)
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "offer-1",
      "title": "Emirates Pilgrimage",
      "status": "INACTIVE",
      "isArchived": true,
      "archivedAt": "2026-02-15T08:00:00Z",
      "checkInDate": "2026-02-01",
      "checkOutDate": "2026-02-10",
      "destination": {
        "id": "dest-1",
        "name": "Saudi Arabia"
      },
      "travelAgency": {
        "id": "agency-1",
        "name": "Al-Baraka Travel"
      },
      "imageCount": 5
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 145,
    "totalPages": 8
  }
}
```

**Implementation Details:**
- Only return offers where `isArchived = true`
- Filter by optional `travelAgencyId` and `destinationId`
- Support pagination (page, limit)
- Include offer relationships (destination, travelAgency, images)
- Sort by `archivedAt DESC` (newest first)

---

### **4. Auto-Archive Past Offers (Admin Only)**

```
POST /api/offers/admin/archive-past-offers
```

**Authentication:** Required (SYSTEM_ADMIN role)

**Request Body:**
```json
{}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "archived": 47,
    "message": "Successfully archived 47 offers with past check-in dates"
  }
}
```

**Implementation Details:**
- Find all offers where:
  - `isArchived = false` (not already archived)
  - `checkInDate < today()` (past dates)
- For each offer:
  - Set `isArchived = true`
  - Set `archivedAt = now()`
- Return count of archived offers
- Consider running this as a cron job daily

**Cron Configuration (Optional):**
```
Schedule: Daily at 02:00 UTC
Job Name: archive-past-offers
Endpoint: /api/offers/admin/archive-past-offers
Auth: Service account token
```

---

### **5. Cleanup Archived Images (Admin Only)**

```
POST /api/offers/admin/cleanup-archived-images
```

**Authentication:** Required (SYSTEM_ADMIN role)

**Request Body:**
```json
{}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "markedForDeletion": 450,
    "permanentlyDeleted": 123,
    "message": "Marked 450 images for deletion, deleted 123 images"
  }
}
```

**Implementation Details:**

**Phase 1 - Mark for Deletion (30-90 days):**
- Find all images where:
  - Associated offer: `isArchived = true`
  - Associated offer: `archivedAt < 30 days ago` AND `archivedAt >= 90 days ago`
  - Image: `isImageDeleted = false`
- For each image:
  - Set `isImageDeleted = true`
  - Set `imageDeletedAt = now()`

**Phase 2 - Permanent Deletion (90+ days):**
- Find all images where:
  - Associated offer: `isArchived = true`
  - Associated offer: `archivedAt >= 90 days ago`
  - Image: `isImageDeleted = true` OR `isImageDeleted = false`
- For each image:
  - Delete from Supabase/CDN
  - Delete from database

**Return:**
- Count of marked images
- Count of permanently deleted images

---

### **6. Auto-Filter Archived from Public API**

```
GET /api/offers
```

**Key Change:**
- When no `status` filter provided, automatically exclude archived offers
- Public API should NEVER return `status = "ARCHIVED"`

**Implementation Details:**
```
if (!params.status) {
  // Auto-exclude archived
  params.status = ['PENDING', 'ACTIVE', 'INACTIVE']
  // NOT: ARCHIVED
}
```

**Before Returning to Public:**
- Check if user is authenticated SYSTEM_ADMIN
  - If yes: Allow viewing archived if explicitly requested
  - If no: Always filter out archived

---

## 🔐 Authorization Rules

### Archive Operations

| Operation | SYSTEM_ADMIN | TRAVEL_AGENCY_ADMIN | TRAVEL_AGENCY_STAFF |
|-----------|:-----------:|:------------------:|:------------------:|
| Archive own offer | ✅ | ✅ (own agency) | ❌ |
| Archive any offer | ✅ | ❌ | ❌ |
| Unarchive offer | ✅ | ❌ | ❌ |
| View archived | ✅ | ❌ | ❌ |
| Auto-archive past | ✅ | ❌ | ❌ |
| Cleanup images | ✅ | ❌ | ❌ |

### Implementation Pattern

```pseudocode
// Archive endpoint
POST /offers/:id/archive
├─ Check if user authenticated? NO → 401 Unauthorized
├─ Is user SYSTEM_ADMIN? YES → Allow
├─ Is user.travelAgencyId === offer.travelAgencyId? YES → Allow
└─ Otherwise → 403 Forbidden
```

---

## 📊 Database Queries

### Query 1: Archive Single Offer

```sql
UPDATE offers
SET 
  isArchived = true,
  archivedAt = NOW()
WHERE id = $1
  AND (
    -- Only if not already archived
    isArchived = false OR isArchived IS NULL
  )
RETURNING *;
```

### Query 2: Find Past Offers to Archive

```sql
SELECT * FROM offers
WHERE 
  isArchived = false
  AND checkIn_date < CURRENT_DATE
  AND status != 'ARCHIVED'
ORDER BY checkInDate DESC;
```

### Query 3: Find Images to Mark

```sql
SELECT oi.* FROM offer_images oi
JOIN offers o ON oi.offerId = o.id
WHERE 
  o.isArchived = true
  AND o.archivedAt <= NOW() - INTERVAL '30 days'
  AND o.archivedAt >= NOW() - INTERVAL '90 days'
  AND (oi.isImageDeleted = false OR oi.isImageDeleted IS NULL)
ORDER BY oi.createdAt DESC;
```

### Query 4: Find Images to Delete

```sql
SELECT oi.* FROM offer_images oi
JOIN offers o ON oi.offerId = o.id
WHERE 
  o.isArchived = true
  AND o.archivedAt < NOW() - INTERVAL '90 days'
  AND oi.isImageDeleted = true
ORDER BY oi.imageDeletedAt DESC;
```

### Query 5: Archive Statistics

```sql
SELECT 
  COUNT(*) as total_archived,
  COUNT(CASE 
    WHEN archivedAt >= NOW() - INTERVAL '30 days' THEN 1 
  END) as archived_0_30_days,
  COUNT(CASE 
    WHEN archivedAt < NOW() - INTERVAL '30 days' 
    AND archivedAt >= NOW() - INTERVAL '90 days' THEN 1 
  END) as archived_30_90_days,
  COUNT(CASE 
    WHEN archivedAt < NOW() - INTERVAL '90 days' THEN 1 
  END) as archived_90_plus_days
FROM offers
WHERE isArchived = true;
```

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] Archive offer updates isArchived & archivedAt
- [ ] Unarchive offer clears archivedAt
- [ ] Auto-archive finds all past offers
- [ ] Image cleanup marks 30-90 day images
- [ ] Image cleanup deletes 90+ day images

### Integration Tests
- [ ] SYSTEM_ADMIN can archive any offer
- [ ] TRAVEL_AGENCY_ADMIN can only archive own agency offers
- [ ] Non-admin users cannot access archive endpoints
- [ ] Public API auto-filters archived offers
- [ ] Archived offers appear in /admin/archived endpoint
- [ ] Unarchive restores offer to original status

### Edge Cases
- [ ] Archiving already-archived offer (idempotent)
- [ ] Unarchiving never-archived offer (safe)
- [ ] Auto-archive with no past offers (returns 0)
- [ ] Cleanup with no images to delete (returns 0)
- [ ] Archive with timezone differences

---

## 📦 Deployment Steps

1. **Database Migration**
   ```bash
   npx prisma migrate dev --name add_archive_fields
   ```

2. **Implement Backend Routes**
   - Add 5 new endpoints
   - Add authorization middleware
   - Test all endpoints

3. **Deploy Backend**
   - Deploy to staging
   - Test with frontend
   - Deploy to production

4. **Frontend Uses Features**
   - All frontend components now functional
   - Archive UI appears to admins
   - Archive dialogs show archived offers

5. **Cron Job (Optional)**
   - Set up daily auto-archive at 02:00 UTC
   - Monitor logs for success

---

## 🚀 Timeline

```
Week 1: Database schema + migrations
Week 2: Backend endpoints (1-5)
Week 3: Auto-filters + authorization
Week 4: Testing + cron job setup
Week 5: Staging deployment + QA
Week 6: Production deployment
```

---

## 📝 Notes

- Frontend assumes all endpoints exist and work correctly
- Frontend has proper error handling for failed requests
- Frontend shows loading states while API processes
- Images may still be cached on CDN after deletion
- Soft-delete timelines are adjustable (currently 30/90 days)

---

**Status:** ⏳ Waiting for Backend Implementation  
**Frontend Ready:** ✅ Yes  
**Tests Passed:** ⏳ Pending Backend  
**Documentation:** ✅ Complete
