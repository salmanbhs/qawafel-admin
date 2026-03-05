# 🗑️ Offer & Image Deletion Timeline & Roles

## Quick Reference Guide

---

## 👥 Role Permissions Matrix

### 1. **SYSTEM_ADMIN** (Full Control) ✅

```
┌─────────────────────────────────────────────────────┐
│                    SYSTEM_ADMIN                      │
│  Has access to all archive and management features  │
└─────────────────────────────────────────────────────┘

✅ CAN DO:
  • View ALL archived offers
  • Archive individual offers
  • Unarchive individual offers
  • Auto-archive ALL past offers at once
  • Cleanup archived images (bulk)
  • Permanently delete archived offers
  • Access archive statistics
  • Export archive data

❌ CANNOT DO:
  • (Nothing) - Admin has full permissions
```

**Where to find admin controls:**
```
Offers Page → Top "Archive Management" Card
  ├─ [View Archived] Button
  ├─ [Auto-Archive Past Offers] Button  
  └─ [Cleanup Images] Button
```

---

### 2. **TRAVEL_AGENCY_ADMIN** (Limited to Own Agency) ⚡

```
┌─────────────────────────────────────────────────────┐
│            TRAVEL_AGENCY_ADMIN                       │
│  Can manage only offers for their own agency        │
└─────────────────────────────────────────────────────┘

✅ CAN DO:
  • Archive OWN offers
  • Unarchive OWN offers
  • View OWN archived offers
  • Delete OWN archived offers
  • View archive status on offer cards

❌ CANNOT DO:
  • Archive other agencies' offers
  • Access auto-archive tools
  • Cleanup images bulk operation
  • View other agencies' archives
  • Access admin archive statistics
```

**Where they find it:**
```
Each offer card has archive button
  ├─ Only visible for their own offers
  └─ Click to archive/unarchive
```

---

### 3. **TRAVEL_AGENCY_STAFF** (View-Only) 👀

```
┌─────────────────────────────────────────────────────┐
│            TRAVEL_AGENCY_STAFF                       │
│  Cannot perform any archive operations              │
└─────────────────────────────────────────────────────┘

✅ CAN DO:
  • View active offers for their agency
  • View offer details
  • See archive status badge on offers

❌ CANNOT DO:
  • Archive any offers
  • Unarchive any offers
  • Access archived offers
  • See archive management tools
  • Trigger any bulk operations
```

---

### 4. **Public / Unauthenticated** (API) 🌍

```
┌─────────────────────────────────────────────────────┐
│              PUBLIC API ACCESS                       │
│  GET /offers - Automatic filtering applied          │
└─────────────────────────────────────────────────────┘

✅ CAN DO:
  • Get active offers
  • Get future offers (checkInDate >= today)
  • Get non-archived offers only

❌ CANNOT DO:
  • See archived offers
  • See past/expired offers
  • Archive anything
  • Access admin endpoints
```

---

## ⏰ When Offers Get Deleted

### **Stage 1: Manual Archive (Admin/Agency)**
```
Action:     Admin clicks "Archive" button on offer
Result:     offer.status = "ARCHIVED"
            offer.archivedAt = now
Visibility: Offer hidden from main list
Recovery:   Can unarchive immediately
```

### **Stage 2: Auto-Archive (Admin Only)**
```
Trigger:    Admin clicks "Auto-Archive Past Offers"
            OR backend cron runs daily
Condition:  All offers with checkInDate < today
Result:     Marked as ARCHIVED automatically
Visibility: Moved to archive collection
Recovery:   Can restore anytime via unarchive button
```

### **Stage 3: Permanent Hard Delete (Admin Only)**
```
Trigger:    Admin clicks "Delete" on archived offer
Result:     offer gets PERMANENTLY removed from DB
            All associated images deleted
Visibility: Completely gone
Recovery:   ❌ NOT POSSIBLE (unless backup)
```

---

## 📸 When Images Get Deleted

### **Image Deletion Timeline**

```
TIME        ┌─ DAY 0 ──────┐  ┌─ DAY 30 ────┐  ┌─ DAY 90 ────┐  ┌─ POST 90 ──┐
            │              │  │              │  │              │  │            │
            ▼              ▼  ▼              ▼  ▼              ▼  ▼            ▼
        ARCHIVE      30 DAYS      60 DAYS       90 DAYS      CLEANUP
        HAPPENS      LATER        LATER         LATER        READY
            │          │            │            │             │
            │          │            │            │             │
STATUS    ACTIVE   ACTIVE    MARKED FOR      READY FOR    DELETED
                            DELETION         PERMANENT
            │          │            │            │             │
            │          │            │            │             │
DB FLAG   isImageDeleted=false  (stays false)  → true   → (deleted)
          imageDeletedAt=null                  → now    → (gone)
            │          │            │            │             │
            │          │            │            │             │
CDN       FAST CDN   FAST CDN      SOFT DEL    MARKED FOR   REMOVED
          (Hot)      (Hot)         (Cached)    CLEANUP      FROM CDN
            │          │            │            │             │
            │          │            │            │             │
API       SERVE    SERVE      MARK IN DB    CLEANUP      (Not found)
RESPONSE  NORMAL   NORMAL    isImageDeleted  READY
                             becomes true
```

### **Detailed Stages**

#### **Stage 1: Hot Storage (Days 0-30)**
```
When it starts:    Offer archived NOW
File location:     CDN (fast, accessible)
Status:            isImageDeleted = false
API response:      ✅ Image URL returned
Can restore:       ✅ Unarchive offer immediately
What to do:        Let it sit
```

#### **Stage 2: Cooling Period (Days 30-60)**
```
When it starts:    Offer archived 30+ days ago
File location:     CDN (still hot)
Status:            isImageDeleted = false
API response:      ✅ Image URL returned
Can restore:       ✅ Unarchive offer immediately
What to do:        Monitor archive age
```

#### **Stage 3: Marked for Deletion (Days 60-90)**
```
When it starts:    Offer archived 60+ days ago
File location:     CDN (cache expires soon)
Status:            isImageDeleted = true ← CHANGES HERE
Date marked:       imageDeletedAt = "60 days ago"
API response:      ⚠️  Image may not be served
Can restore:       ✅ Unarchive offer still works
What to do:        Admin runs cleanup (manual)
                   OR automatic cleanup if enabled
```

#### **Stage 4: Final Deletion (Days 90+)**
```
When it starts:    Offer archived 90+ days ago
File location:     Marked for Supabase deletion
Status:            Image record being deleted
Database:          OfferImage removed rows
API response:      ❌ No image found
Can restore:       ⚠️  Unarchive works, but no images
What to do:        Images are gone forever
```

---

## 🎯 Key Actions & When They Happen

### **For SYSTEM_ADMIN**

#### Archive Past Offers (Bulk)
```
WHEN:    Click "Auto-Archive Past Offers"
CHECKS:  • Offer.checkInDate < today
         • Offer.status != ARCHIVED
ACTION:  • Set status = ARCHIVED
         • Set archivedAt = now
RESULT:  All past offers → Archive collection
TIME:    Immediate
UNDO:    Can unarchive individually
```

#### Cleanup Images (Bulk)
```
WHEN:    Click "Cleanup Images"
CHECKS:  • Offer.archivedAt < 30 days ago
ACTION:  • If 30-90 days old: Mark deleted (set flags)
         • If 90+ days old: Remove from database
RESULT:  Images aged 60+ days marked or deleted
TIME:    A few seconds to minutes
         CDN cleanup happens in background
UNDO:    Can't undo deletion (soft-delete only)
```

#### Permanently Delete Offer
```
WHEN:    Click red delete icon on archived offer
CHECKS:  • Offer.status == ARCHIVED (must be archived)
ACTION:  • Delete offer record
         • Delete all associated images
         • Delete booking history
RESULT:  PERMANENT removal
TIME:    Immediate
UNDO:    ❌ NOT POSSIBLE (requires backup)
```

---

## 🚨 Important Notes

### Data Safety

✅ **Archives are SAFE** - Data never deleted from archive, only marked
✅ **90-Day Buffer** - Images get 90 days before final deletion
✅ **Manual Triggers** - Cleanup requires explicit admin action
✅ **Unarchive Works** - Can restore offers anytime during cleanup phase

### Storage Savings

```
Timeline    Offers Still in Storage    Images in Storage
Day 0           100% active                100% active
Day 30          100% active                100% active
Day 60          100% active                100% active
Day 90          100% active                  0% (marked)
Day 120+        100% active                  ~5% (pending)
```

**After 90 days:** ~95% storage savings from archived images

---

## 📋 Deletion Rules by Role

| Role | Can Archive | Can Unarchive | Can Bulk Auto-Archive | Can Cleanup Images | Can Permanently Delete |
|------|:-----------:|:------------:|:-------------------:|:------------------:|:---------------------:|
| **SYSTEM_ADMIN** | ✅ All | ✅ All | ✅ Yes | ✅ Yes | ✅ Yes |
| **TRAVEL_AGENCY_ADMIN** | ✅ Own | ✅ Own | ❌ No | ❌ No | ✅ Own |
| **TRAVEL_AGENCY_STAFF** | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No |
| **Public API** | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No |

---

## 🎓 Example Scenario

### **Scenario: Managing a Summer Offer**

```
┌─────────────────────────────────────────────────────────────────┐
│ Timeline: 2026 March to June                                    │
└─────────────────────────────────────────────────────────────────┘

MARCH 5, 2026 - OFFER CREATED
├─ Admin: Create summer travel offer
├─ checkInDate: June 1, 2026
└─ Status: PENDING → ACTIVE

JUNE 1, 2026 - OFFER CHECK-IN DATE
├─ Offer is still active (people booking)
├─ Status: ACTIVE
└─ Images: On CDN

JULY 1, 2026 - AFTER CHECK-IN DATE
├─ Booking period ended
├─ Admin can now archive manually
├─ OR auto-archive will catch it next day
└─ Status: ACTIVE → ARCHIVED (archivedAt = July 1)

JULY 15, 2026 - 2 WEEKS PAST ARCHIVE
├─ Images: Still on CDN (hot storage)
├─ Visibility: Hidden from main list
├─ Recovery: Can unarchive anytime
└─ Status: ARCHIVED

AUGUST 15, 2026 - 6 WEEKS PAST ARCHIVE (Day 46)
├─ Admin: Runs cleanup images
├─ Action: Images marked isImageDeleted = true
├─ When: imageDeletedAt = Aug 15
└─ Result: Images now "soft deleted"

SEPTEMBER 15, 2026 - 11 WEEKS PAST ARCHIVE (Day 101)
├─ Images: Beyond 90 days
├─ After cleanup run: Removed from DB
├─ Result: Offer exists but no images
└─ Unarchive: Still works, no images shown

SEPTEMBER 20, 2026 - OFFER NEEDS RE-LISTING
├─ Admin: User wants to re-list same offer
├─ Action: Click unarchive button
├─ Result: Status = ACTIVE again
├─ Images: Can re-upload (old ones are gone)
└─ When: Available immediately

OCTOBER 1, 2026 - FINAL DELETION
├─ Admin: Decide offer no longer needed
├─ Action: Click red delete button
├─ Result: Offer PERMANENTLY deleted
├─ Effect: All traces gone
└─ Undo: ❌ NOT POSSIBLE
```

---

## 🔍 How to Check Status

### Check if Offer is Archived
```
On Offers Page:
  1. Find offer in list
  2. Look at top-right corner of offer card
  3. Archived badge = Yes (⭕ ARCHIVED badge shows)
  4. No badge = Not archived
```

### Check Age of Archived Offer
```
In Archived Offers Dialog:
  1. Click "View Archived" button
  2. Each offer shows: "Archived on: June 15, 2026"
  3. Calculate days: Today - ArchivedDate
  4. Reference timeline above
```

### Check Image Deletion Status
```
In Database (Admin/Tech only):
  Query: SELECT isImageDeleted, imageDeletedAt FROM offer_images
  Where: offerId = 'xxx'
  
  If isImageDeleted = false:  Images still in CDN
  If isImageDeleted = true:   Images marked (30-90 day window)
  If record missing:          Images deleted (90+ days)
```

---

**Questions?** Refer to main documentation: [OFFER_ARCHIVE_SYSTEM.md](./OFFER_ARCHIVE_SYSTEM.md)
