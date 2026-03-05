# 📊 Offer Archive System - Architecture Diagrams

## System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                    QAWAFEL ADMIN - OFFER IDEAS                       │
└──────────────────────────────────────────────────────────────────────┘
                               │
                 ┌─────────────┼─────────────┐
                 │             │             │
                 ▼             ▼             ▼
          ┌───────────┐ ┌───────────┐ ┌───────────┐
          │  ACTIVE   │ │ ARCHIVED  │ │  DELETED  │
          │           │ │           │ │           │
          │ • Visible │ │ • Hidden  │ │ • Removed │
          │ • Public  │ │ • Archive │ │ • Hard    │
          │ • Booking │ │ • Admin   │ │   Delete  │
          │   Active  │ │   Only    │ │           │
          └─────┬─────┘ └─────┬─────┘ └───────────┘
                │             │
            After           When
            Expiry        Required
```

---

## User Access Patterns

```
╔══════════════════════════════════════════════════════════════════╗
║              User Role → Access Pattern                          ║
╚══════════════════════════════════════════════════════════════════╝

┌─────────────────────┐
│ SYSTEM_ADMIN        │
├─────────────────────┤
│ [Archive Mgmt Card] │
│    ├─ View Archived │─────→ Dialog: All archived
│    ├─ Auto-Archive  │─────→ Bulk: Archive past
│    └─ Cleanup Imgs  │─────→ Bulk: Mark & delete
│                     │
│ + Regular actions   │
│    ├─ Archive       │─────→ Any offer
│    ├─ Delete        │─────→ Any offer
│    └─ View          │─────→ Any offer
└─────────────────────┘

┌─────────────────────┐
│ AGENCY_ADMIN        │
├─────────────────────┤
│ (No Mgmt Card)      │
│                     │
│ Only on own offers: │
│    ├─ Archive       │─────→ Own offer
│    ├─ Delete        │─────→ Own archived
│    └─ View          │─────→ All active
└─────────────────────┘

┌─────────────────────┐
│ PUBLIC / STAFF      │
├─────────────────────┤
│ (No Archive UI)     │
│                     │
│ View only:          │
│    └─ Active offers │─────→ Filtered
│       (No archived) │
└─────────────────────┘
```

---

## Offer Lifecycle Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                     OFFER_LIFECYCLE                              │
└──────────────────────────────────────────────────────────────────┘

                         CREATE
                           │
                           ▼
              ┌─────────────────────────┐
              │ PENDING OFFER           │
              │ ✅ Not visible yet      │
              │ ❌ Can't book           │
              └────────────┬────────────┘
                           │
                           ▼
              ┌─────────────────────────┐
              │ ACTIVE OFFER            │
              │ ✅ Visible to public    │
              │ ✅ Can book             │
              │ 📅 checkInDate set      │
              └────────┬────────────────┘
                       │
                       │ checkInDate passes
                       ▼
              ┌─────────────────────────┐
              │ INACTIVE OFFER          │
              │ ✅ Still visible        │
              │ ❌ Can't book           │
              │ (Expired)               │
              └────────┬────────────────┘
                       │
                       │ Admin archives
                       │ OR auto-archive runs
                       ▼
              ┌─────────────────────────┐
              │ ARCHIVED OFFER          │
              │ ❌ Hidden from list     │
              │ 🔒 Archive only         │
              │ ⏰ archivedAt set       │
              └────────┬────────────────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
    RESTORE        DELETE        CLEANUP
         │             │             │
         ▼             ▼             ▼
      ACTIVE      DELETED       IMAGES
      (back)      (gone)        (phase)
```

---

## Image Cleanup Timeline

```
                    OFFER ARCHIVED
                          │
                          ▼
    ┌─────────────────────────────────────────────────────┐
    │              IMAGE LIFECYCLE (90 DAYS)             │
    └─────────────────────────────────────────────────────┘
            │
            ├──────────────────────┐
            │                      │
            ▼                      ▼
    PHASE 1: HOT        UNARCHIVE OFFER
    Days 0-30           (Works - Images Shown)
    ├─ In CDN            │
    ├─ Fast access       ├─→ ✅ All restored
    ├─ User recovers     │
    └─ isImageDeleted=F  │
            │
            ├──────────────────────┐
            │                      │
            ▼                      ▼
    PHASE 2: WARM       DATE-based Phase
    Days 30-60          (Check offer.archivedAt)
    ├─ In CDN           │
    ├─ Still fast       ├─→ ✅ Last recovery window
    ├─ OK to keep       │
    └─ isImageDeleted=F │
            │
            ├──────────────────────┐
            │                      │
            ▼                      ▼
    PHASE 3: MARKED    Admin Cleanup Action
    Days 60-90         (Manual trigger)
    ├─ Marked in DB    │
    ├─ CDN expires     ├─→ Mark images deleted
    ├─ Less accessible │   (isImageDeleted=T)
    └─ isImageDeleted=T│   (Not in next list)
            │
            ├──────────────────────┐
            │                      │
            ▼                      ▼
    PHASE 4: DELETED   Unarchive Result
    Days 90+           (Images gone)
    ├─ Removed from DB │
    ├─ Supabase task   ├─→ ⚠️ Offer exists
    ├─ CDN cleanup     │   ⚠️ No images
    └─ GONE            │   ⚠️ Can re-upload
```

---

## Admin Interface Layout

```
OFFERS PAGE LAYOUT
├────────────────────────────────────────────────────────┐
│                      PAGE HEADER                       │
│  Title: Offers                                         │
│  Subtitle: Manage travel packages and deals           │
└────────────────────────────────────────────────────────┘

├────────────────────────────────────────────────────────┐
│        🏛️  ARCHIVE MANAGEMENT (Admin Only)            │
├────────────────────────────────────────────────────────┤
│                                                        │
│  [📁 View Archived]  [⏰ Auto-Archive]  [🧹 Cleanup]  │
│                                                        │
│  ─── IMAGE LIFECYCLE ───                             │
│  • 0-30d:  Keep in CDN                               │
│  • 30-90d: Mark as deleted                           │
│  • 90+d:   Ready for cleanup                         │
│                                                        │
└────────────────────────────────────────────────────────┘

├────────────────────────────────────────────────────────┐
│                    SEARCH & FILTERS                    │
│  [Search...] [Status ▼] [Agency ▼] [Dest ▼]          │
│  [Featured ○] [Clear Filters]                        │
└────────────────────────────────────────────────────────┘

├────────────────────────────────────────────────────────┐
│  OFFERS GRID (Only Active/Inactive - No Archived)     │
├────────────────────────────────────────────────────────┤
│                                                        │
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│ │   OFFER      │  │   OFFER      │  │   OFFER      │ │
│ │   CARD 1     │  │   CARD 2     │  │   CARD 3     │ │
│ │              │  │              │  │              │ │
│ │ [View]       │  │ [View]       │  │ [View]       │ │
│ │ [📁 Archive] │  │ [📁 Archive] │  │ [📁 Archive] │ │
│ │ [🗑️ Delete] │  │ [🗑️ Delete] │  │ [🗑️ Delete] │ │
│ └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                        │
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│ │   OFFER      │  │   OFFER      │  │   OFFER      │ │
│ │   CARD 4     │  │   CARD 5     │  │   CARD 6     │ │
│ │              │  │              │  │              │ │
│ │ [View]       │  │ [View]       │  │ [View]       │ │
│ │ [📁 Archive] │  │ [📁 Archive] │  │ [📁 Archive] │ │
│ │ [🗑️ Delete] │  │ [🗑️ Delete] │  │ [🗑️ Delete] │ │
│ └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                        │
│ ◄ Page 1 of 8 ►                                       │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## Dialog: Archived Offers

```
╔══════════════════════════════════════════════════════════╗
║  🏛️  ARCHIVED OFFERS                                     ║
║  View and manage all archived offers                    ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║ ┌────────────────────────────────────────────────────┐ ║
║ │ OFFER TITLE                                        │ ║
║ │ 📍 Saudi Arabia │ 📅 Jun 1, 2026 │ 💰 1,200 BHD  │ ║
║ │ Archived on: Feb 15, 2026                         │ ║
║ │                           [🔄 Restore] [🗑️ Delete] │ ║
║ └────────────────────────────────────────────────────┘ ║
║                                                          ║
║ ┌────────────────────────────────────────────────────┐ ║
║ │ OFFER TITLE 2                                      │ ║
║ │ 📍 UAE │ 📅 May 10, 2026 │ 💰 950 BHD             │ ║
║ │ Archived on: Feb 10, 2026                         │ ║
║ │                           [🔄 Restore] [🗑️ Delete] │ ║
║ └────────────────────────────────────────────────────┘ ║
║                                                          ║
║ ◄ Page 1 of 5 ►                                         ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
```

---

## Data Flow: Archive Action

```
USER CLICKS ARCHIVE BUTTON
         │
         ▼
    [FRONTEND]
    ┌─────────────────────┐
    │ useArchiveOffer()   │
    │ mutation triggered  │
    └────────┬────────────┘
             │
             ▼
    API REQUEST
    PATCH /offers/:id/archive
    ├─ Headers: Authorization token
    ├─ Auth: Check role (ADMIN/OWNER)
    └─ Database transaction:
             │
             ├─→ Find offer by ID
             ├─→ Check: isArchived != true
             ├─→ Update: isArchived = true
             ├─→ Update: archivedAt = NOW()
             └─→ Return updated offer
             │
             ▼
    RESPONSE
    ├─ Status: 200 OK
    ├─ Data: Updated offer object
    │   {
    │     id, title, status,
    │     isArchived: true,
    │     archivedAt: "2026-03-05T..."
    │   }
    └─────────────────────────────────
             │
             ▼
    [FRONTEND]
    ┌─────────────────────┐
    │ Update UI:          │
    │ • Show success      │
    │ • Remove from list  │
    │ • Invalidate cache  │
    │ • Refresh data      │
    └─────────────────────┘
             │
             ▼
    USER SEES
    ✅ "Offer archived successfully"
    ✅ Offer disappears from main list
```

---

## Data Flow: Auto-Archive Past

```
ADMIN CLICKS "AUTO-ARCHIVE PAST"
         │
         ▼
    CONFIRMATION DIALOG
    "Archive all past offers?"
         │
         ▼
    USER CONFIRMS
         │
         ▼
    [FRONTEND]
    ┌─────────────────────────────┐
    │ useAutoArchivePastOffers()  │
    │ mutation triggered          │
    └────────┬────────────────────┘
             │
             ▼
    API REQUEST
    POST /offers/admin/archive-past-offers
    ├─ Headers: Admin authorization token
    └─ Backend processes:
             │
             ├─→ Query: All offers where
             │   • isArchived = false
             │   • checkInDate < TODAY
             │
             ├─→ For each offer:
             │   • Set isArchived = true
             │   • Set archivedAt = NOW()
             │
             ├─→ Transaction control
             └─→ Count archived offers
             │
             ▼
    RESPONSE
    ├─ Status: 200 OK
    ├─ Data: { archived: 47 }
    └─────────────────────────────
             │
             ▼
    [FRONTEND]
    ┌─────────────────────────────┐
    │ Update UI:                  │
    │ • Show success toast        │
    │ • Message: "47 archived"    │
    │ • Invalidate offers cache   │
    │ • Refresh list              │
    └─────────────────────────────┘
             │
             ▼
    USER SEES
    ✅ Toast: "47 offers archived"
    ✅ List refreshes
```

---

## Data Flow: Image Cleanup

```
ADMIN CLICKS "CLEANUP IMAGES"
         │
         ▼
    CONFIRMATION DIALOG
         │
         ▼
    [FRONTEND]
    ┌─────────────────────────────────┐
    │ useCleanupArchivedImages()     │
    │ mutation triggered              │
    └────────┬────────────────────────┘
             │
             ▼
    API REQUEST
    POST /offers/admin/cleanup-archived-images
    ├─ Headers: Admin authorization token
    └─ Backend processes:
             │
             ├─→ PHASE 1: Mark for deletion (30-90 days)
             │   Query: offer images where
             │   • offer.archivedAt < 30 days ago
             │   • offer.archivedAt >= 90 days ago
             │   • isImageDeleted != true
             │   ↓
             │   For each: Set isImageDeleted = true
             │             Set imageDeletedAt = NOW()
             │   ↓
             │   Count: X marked
             │
             ├─→ PHASE 2: Delete from DB (90+ days)
             │   Query: offer images where
             │   • offer.archivedAt >= 90 days ago
             │   ↓
             │   For each: Delete from Supabase
             │             Delete from CDN
             │   ↓
             │   Count: Y deleted
             │
             └─→ Return counts
             │
             ▼
    RESPONSE
    ├─ Status: 200 OK
    ├─ Data: {
    │    markedForDeletion: 450,
    │    permanentlyDeleted: 123
    │  }
    └─────────────────────────────
             │
             ▼
    [FRONTEND]
    ┌─────────────────────────────────┐
    │ Update UI:                      │
    │ • Show success toast            │
    │ • Message: "450 marked, 123..." │
    │ • Invalidate cache              │
    │ • Refresh archived list         │
    └─────────────────────────────────┘
             │
             ▼
    USER SEES
    ✅ Toast: "Cleaned 123, marked 450"
```

---

## Database State Diagram

```
┌──────────────────────────────────────────────────────────┐
│                    ACTIVE OFFERS TABLE                   │
├──────────────────────────────────────────────────────────┤
│ id  │ title        │ status    │ isArchived │ archivedAt │
├─────┼──────────────┼───────────┼────────────┼────────────┤
│ 1   │ Dubai Trip   │ ACTIVE    │ false      │ null       │
│ 2   │ Egypt PKG    │ INACTIVE  │ false      │ null       │
│ 3   │ Summer Trip  │ ACTIVE    │ false      │ null       │
└──────────────────────────────────────────────────────────┘

               ↓ Run Auto-Archive

┌──────────────────────────────────────────────────────────┐
│                   ARCHIVED TABLE                         │
├──────────────────────────────────────────────────────────┤
│ id  │ title        │ status    │ isArchived │ archivedAt │
├─────┼──────────────┼───────────┼────────────┼────────────┤
│ 10  │ Spring PKG   │ INACTIVE  │ true       │ 2/15/26    │
│ 11  │ Winter PKG   │ INACTIVE  │ true       │ 2/10/26    │
│ 12  │ Hajj 2025    │ ACTIVE    │ true       │ 2/20/26    │
└──────────────────────────────────────────────────────────┘

               ↓ Run Cleanup (90 days later)

┌──────────────────────────────────────────────────────────┐
│              IMAGE CLEANUP RESULTS                       │
├──────────────────────────────────────────────────────────┤
│ id  │ isImageDeleted │ imageDeletedAt │ Action           │
├─────┼────────────────┼────────────────┼──────────────────┤
│ 10  │ false          │ null           │ Keep (< 30d)     │
│ 11  │ true           │ 5/20/26        │ Marked (30-90d)  │
│ 12  │ deleted        │ deleted        │ Removed (90+ d)  │
└──────────────────────────────────────────────────────────┘
```

---

**Last Updated:** March 5, 2026  
**Diagrams Version:** 1.0  
**Status:** Complete
