# 📊 Archive System - Visual Quick Reference

## System Overview Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   OFFER ARCHIVE MANAGEMENT SYSTEM                       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                ┌───────────────────┼───────────────────┐
                │                   │                   │
                ▼                   ▼                   ▼
          ACTIVE OFFERS      ARCHIVED OFFERS      IMAGE CLEANUP
                                                      
          ✅ Visible             🔒 Hidden           📅 Timeline
          ✅ Bookable            ❌ Not bookable      📦 Storage
          ✅ Public API          ✅ Admin only        🗑️  Deletion
```

---

## 🎯 User Journey by Role

### **SYSTEM_ADMIN** 👑 (Full Power)

```
┌─────────────────────────────────────────┐
│         SYSTEM_ADMIN INTERFACE          │
└─────────────────────────────────────────┘
              │
       ┌──────┼──────┐
       │      │      │
       ▼      ▼      ▼
   ┌─────┐ ┌─────┐ ┌─────┐
   │VIEW │ │AUTO │ │CLEAN│
   │ARCH │ │ARCH │ │IMGS │
   └─────┘ └─────┘ └─────┘
     │       │       │
     │       │       ├─→ Select archived images
     │       │       ├─→ Mark 30-90 days old
     │       │       └─→ Delete 90+ days old
     │       │
     │       ├─→ Check all past offers
     │       ├─→ Archive automatically
     │       └─→ Show count
     │
     ├─→ List all archived
     ├─→ Paginated view
     ├─→ Restore individual
     └─→ Delete individual
```

---

### **TRAVEL_AGENCY_ADMIN** ⚡ (Limited)

```
┌─────────────────────────────────────────┐
│     TRAVEL_AGENCY_ADMIN INTERFACE       │
└─────────────────────────────────────────┘
              │
       ┌──────┴──────┐
       │             │
       ▼             ▼
   ┌───────┐     ┌───────┐
   │ARCHIVE│     │DELETE │
   │OWN    │     │OWN    │
   │OFFERS │     │OFFERS │
   └───────┘     └───────┘
       │             │
       │             ├─→ Only archived offers
       │             └─→ Permanent delete
       │
       ├─→ On own offers only
       ├─→ Click on archive button
       └─→ Offer moved to archive
           (can unarchive later)
```

---

### **TRAVEL_AGENCY_STAFF** 👀 (View Only)

```
┌─────────────────────────────────────────┐
│    TRAVEL_AGENCY_STAFF INTERFACE        │
└─────────────────────────────────────────┘
              │
              ▼
         ┌─────────┐
         │  VIEW   │
         │ ACTIVE  │
         │ OFFERS  │
         └─────────┘
              │
              ├─→ See archive badge
              ├─→ Can't click archive
              └─→ Can't see archived
```

---

## 📅 Image Lifecycle Timeline

```
                    Offer Archived
                          │
                          ▼
         ┌────────────────────────────────────┐
         │     PHASE 1: HOT STORAGE (0-30)    │
         │  ✅ Images on CDN (fast access)    │
         │  ✅ API returns image URLs         │
         │  ✅ Can unarchive easily           │
         │  📊 Status: isImageDeleted=FALSE   │
         └────────────────────────────────────┘
                          │
                          ▼  (30 days pass)
         ┌────────────────────────────────────┐
         │    PHASE 2: WARM STORAGE (30-60)   │
         │  ✅ Images on CDN (still fast)     │
         │  ✅ API returns image URLs         │
         │  ✅ Can unarchive easily           │
         │  📊 Status: isImageDeleted=FALSE   │
         └────────────────────────────────────┘
                          │
                          ▼  (60 days pass)
         ┌────────────────────────────────────┐
         │   PHASE 3: MARKED FOR DELETE ⚠️    │
         │  ⚠️  Images CDN cache expires      │
         │  ⚠️  API may not serve images      │
         │  ✅ Can still unarchive offer      │
         │  📊 Status: isImageDeleted=TRUE    │
         │  📅 Mark: imageDeletedAt = now     │
         │  🔧 Admin runs: Cleanup Images     │
         └────────────────────────────────────┘
                          │
                          ▼  (90+ days pass)
         ┌────────────────────────────────────┐
         │    PHASE 4: DELETED FROM DB 🗑️     │
         │  ❌ Images removed from database   │
         │  ❌ API can't find images          │
         │  ⚠️  Unarchive works (no images)   │
         │  📊 Database: Records gone         │
         │  🗑️  Supabase cleanup ready        │
         └────────────────────────────────────┘
```

---

## 🎮 UI Component Locations

### **Admin Archive Management Card**
```
┌──────────────────────────────────────────────┐
│  🏛️  ARCHIVE MANAGEMENT                      │
│  Manage archived offers and cleanup storage  │
├──────────────────────────────────────────────┤
│                                              │
│  [📁 View Archived]  [⏰ Auto-Archive Past] │
│  [🧹 Cleanup Images]                        │
│                                              │
│  ─ Timeline ─                                │
│  • 0-30d:   Keep in CDN                     │
│  • 30-90d:  Mark as deleted                 │
│  • 90+ d:   Ready for cleanup               │
│                                              │
└──────────────────────────────────────────────┘
```

### **Each Offer Card**
```
┌─────────────────────────────────┐
│  OFFER TITLE                    │
│  📍 Location | 📅 Dates | 💰 Price
│                                 │
│  [VIEW] [📁 ARCHIVE] [🗑️ DELETE]│
└─────────────────────────────────┘
         (Archive button appears
          only for admins/owners)
```

### **Archived Offers Dialog**
```
┌────────────────────────────────────┐
│  🏛️  ARCHIVED OFFERS               │
├────────────────────────────────────┤
│  [Offer 1]   🔄 🗑️                │
│  [Offer 2]   🔄 🗑️                │
│  [Offer 3]   🔄 🗑️                │
│                                    │
│  Page 1 of 5                       │
└────────────────────────────────────┘
    🔄 = Restore   🗑️ = Delete
```

---

## 📋 Decision Tree

### "Can I Archive This Offer?"

```
START → Are you SYSTEM_ADMIN? 
  │
  ├─ YES → Go to "Archive Offered"
  │         Archives ANY offer
  │         Can be ACTIVE, INACTIVE, or PENDING
  │
  └─ NO → Is it YOUR AGENCY'S offer?
           │
           ├─ YES → Go to "Archive Offered"
           │         Archives ONLY this offer
           │         Must NOT be ARCHIVED already
           │
           └─ NO → ❌ CANNOT ARCHIVE
                    (View/Read only)
```

### "Can I View Archived?"

```
START → Are you SYSTEM_ADMIN?
  │
  ├─ YES → ✅ YES
  │         View ALL archived offers
  │         Can restore any offer
  │
  └─ NO → Are you authenticated?
           │
           ├─ public user → ❌ NO
           │                (API auto-filters)
           │
           └─ Agency user → ❌ NO
                             (Archived hidden)
```

### "When Do Images Get Deleted?"

```
START → Offer is archived

  ├─ 0-30 days → Images on CDN
  │              Can unarchive & show images
  │              ✅ Safe
  │
  ├─ 30-60 days → Images on CDN (but marked)
  │               Can unarchive but images fading
  │               ⚠️  Still safe
  │
  ├─ 60-90 days → Admin runs cleanup
  │               Images marked isImageDeleted=true
  │               Unarchive works, no images shown
  │               ⚠️  Recovery window closing
  │
  └─ 90+ days → Images removed from DB
               Unarchive works but empty
               ❌ Images permanently gone
               BUT can re-upload
```

---

## 🚀 Common Actions

### **Action: Archive an Offer**
```
1. Go to Offers page
2. Find offer card
3. Click [📁 ARCHIVE] button
4. Offer disappears from main list
5. Offer goes to "Archived Offers"
6. Archive badge shown on card
```

### **Action: View All Archived**
```
1. Go to Offers page (admin only)
2. Click [📁 View Archived] in Archive Management
3. Dialog opens showing archived offers
4. See "Archived on: [date]" for each
5. Each offer has [🔄 Restore] and [🗑️ Delete]
```

### **Action: Restore Archived Offer**
```
1. Go to Offers page (admin only)
2. Click [📁 View Archived]
3. Find offer in dialog
4. Click [🔄 RESTORE] button
5. Offer moves back to active list
6. Banner & images restored (if < 90 days)
```

### **Action: Auto-Archive Past**
```
1. Go to Offers page (ADMIN ONLY)
2. Click [⏰ Auto-Archive Past] button
3. Confirmation dialog shows
4. Click [Confirm]
5. System archives all past offers
6. Shows success message with count
```

### **Action: Cleanup Images**
```
1. Go to Offers page (ADMIN ONLY)
2. Click [🧹 Cleanup Images] button
3. Confirmation dialog shows
4. Click [Cleanup]
5. System processes images
6. Shows: "Cleaned: 250, Marked: 450"
```

---

## 🎓 Key Concepts

### **Archived ≠ Deleted**
```
❌ WRONG: Archived means gone forever
✅ RIGHT: Archived means hidden but safe

Archives are like "storage" not "trash"
```

### **Soft Delete vs Hard Delete**
```
SOFT DELETE (Safe):
  • Image marked as deleted in DB
  • Still in storage for 90 days
  • Can unarchive and restore
  • ✅ This is what cleanup does for images

HARD DELETE (Permanent):
  • Image completely removed from DB
  • Cannot be recovered
  • ❌ Only happens after 90 days
  • ❌ Or explicit delete by admin
```

### **Image Cleanup is NOT Immediate**
```
❌ WRONG: Cleanup removes images immediately
✅ RIGHT: Cleanup marks images, actual deletion happens later

Timeline:
  Day 0-30: Keep
  Day 30-60: Keep but monitor  
  Day 60-90: Admin runs cleanup → Mark for deletion
  Day 90+: Images can be deleted from CDN
  Day 90+: When cleanup task runs → Remove from DB
```

---

## ⚙️ System Settings

### Auto-Archive Schedule (Backend)
```
Runs: 02:00 UTC Daily
Task: "Archive Past Offers"
Finds: All offers with checkInDate < today
Action: Set status=ARCHIVED, set archivedAt=now
```

### Image Cleanup Schedule (Manual)
```
Runs: On-demand (admin clicks button)
Task: "Cleanup Archived Images"
Phase 1: Mark 60-90 day old images
Phase 2: Delete 90+ day old images
```

---

## 📞 Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| Can't archive | Not admin/owner | Only admins or agency owners can archive |
| Archive button missing | Not logged in | Log in with proper role |
| Can't unarchive | Offer deleted | If deleted, can't restore (only backup helps) |
| Images gone after unarchive | >90 days archived | Images deleted after 90 days; re-upload |
| Archive collection empty | No archived offers | Archive offers first via button |

---

**Last Updated:** March 5, 2026  
**Quick Reference Version:** 1.0
