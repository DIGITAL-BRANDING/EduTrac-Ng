# 🚀 Offline Functionality - Deployment Guide

**Status:** ✅ All fixes ready  
**Date:** 2026-05-16

---

## 📋 What Was Fixed

| # | Issue | Fix | File | Priority |
|---|-------|-----|------|----------|
| 1 | Cache version mismatch (v3.1 vs v3.2) | Updated to v3.2-portal | `pwa-v2.1-FIXED.js:498` | 🔴 CRITICAL |
| 2 | Single connectivity endpoint (fragile) | Multi-endpoint fallback | `pwa-v2.1-FIXED.js:215-245` | 🔴 CRITICAL |
| 3 | Delayed SyncEngine init (1.5s) | Parallel initialization | `pwa-v2.1-FIXED.js:268` | 🔴 CRITICAL |
| 4 | No offline prefetch on login | New `onAuthSuccess()` hook | `pwa-v2.1-FIXED.js:928-947` | 🟡 HIGH |

---

## 🔄 Deployment Steps

### **Step 1: Replace PWA Manager (5 min)**

**OLD FILE:** `client/js/pwa-v2.1.js`  
**NEW FILE:** `client/js/pwa-v2.1-FIXED.js`

```bash
# Option A: Copy file
cp client/js/pwa-v2.1-FIXED.js client/js/pwa-v2.1.js

# Option B: Rename (keep both versions)
# Then update all HTML to reference the fixed version
```

### **Step 2: Update All HTML Templates**

Find all HTML files and update the PWA script:

```html
<!-- OLD (lightweight, minimal offline support) -->
<script src="/js/pwa1.js"></script>

<!-- NEW (full offline-first with sync) -->
<script src="/js/pwa-v2.1.js"></script>
```

**Files to update:**
- ✅ `/login.html`
- ✅ `/index.html`
- ✅ `/admin/index.html`
- ✅ `/admin/*.html` (all portal pages)
- ✅ `/portals/student/login.html`
- ✅ `/teacher/index.html`
- ✅ `/exam-officer/index.html`
- ✅ `/parent/index.html`
- ✅ `/student/index.html`
- ✅ Any other main entry points

### **Step 3: Add Prefetch Hook After Login (Optional but Recommended)**

In your auth success handler, add:

```javascript
// After user successfully logs in (in your auth handler)
async function handleLoginSuccess(user) {
  // ... your existing auth logic ...
  
  // NEW: Pre-fetch offline data
  if (window.onAuthSuccess) {
    window.onAuthSuccess(user, user.school_id);
  }
}
```

Or simply add this to your login page HTML:

```html
<script>
  // Override if you have custom auth logic
  const originalSetUser = window.setUser;
  window.setUser = async function(user) {
    const result = await originalSetUser?.(user);
    
    // Trigger offline prefetch
    if (window.onAuthSuccess) {
      window.onAuthSuccess(user, user.school_id);
    }
    
    return result;
  };
</script>
```

### **Step 4: Update Service Worker Reference (if upgrading)**

If you also want to upgrade Service Worker to v3.2 (optional):

```bash
# Backup current version
cp client/sw.js client/sw-v3.1-backup.js

# Deploy new version
cp client/sw-v3.2.js client/sw.js
```

> **Note:** PWA v2.1-FIXED works with both `sw.js` v3.1 and v3.2. Only upgrade if you need the extra features in v3.2.

### **Step 5: Clear Cache & Test**

```bash
# Hard refresh in browser
Ctrl+Shift+R  (Windows/Linux)
Cmd+Shift+R   (Mac)

# OR programmatically
localStorage.clear()
sessionStorage.clear()
// In DevTools: Application > Service Workers > Unregister
// Then reload
```

---

## ✅ Testing Checklist

After deployment, verify each scenario:

### **Test 1: Offline Pages Load**
```
1. Go online → Visit /admin/index.html
2. DevTools > Application > Service Workers > Check "Offline"
3. Refresh page
4. ✅ Page should load from cache
5. Check console: [PWA] Serving offline portal: /admin/index.html
```

### **Test 2: Sync Metadata Persists**
```
1. In console:
   const db = await openSyncMetadataDB();
   const tx = db.transaction('syncMetadata', 'readonly');
   const meta = await tx.objectStore('syncMetadata').get('sync-metadata');
   console.log(meta.data);

2. ✅ Should show:
   {
     syncing: false,
     lastError: null,
     lastSyncTime: <timestamp>,
     syncAttempts: 1,
     failedSyncAttempts: 0,
     ...
   }
```

### **Test 3: Multi-Endpoint Connectivity**
```
1. DevTools > Network > Offline
2. Open console and run:
   const connected = await checkNetworkConnectivity();
   console.log(connected); // Should be false

3. Uncheck offline
4. Run again: Should return true (with fallback endpoint message)
```

### **Test 4: Offline Data Access**
```
1. Log in while online
2. DevTools > Network > Offline
3. In console:
   const students = await window._eduSyncEngine.getLocal('students');
   console.log(students.length);

4. ✅ Should return cached student count
```

### **Test 5: Offline Pages List**
```
1. While offline, in console:
   const pages = await window._getOfflinePages();
   console.log(pages);

2. ✅ Should list all cached portal pages with icons
```

### **Test 6: Go Back Online → Auto Sync**
```
1. Make changes while offline (e.g., attendance entry)
2. Keep changes in memory
3. Uncheck offline in DevTools
4. Should see sync banner: "Syncing data..."
5. Console: [Sync] ✓ Sync complete
```

---

## 🐛 Troubleshooting

### **Problem: Pages still load from network when offline**

**Cause:** Service Worker not installed or old cache version

**Solution:**
```javascript
// In DevTools console:
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(r => r.unregister());
});

// Reload page, SW will reinstall
```

### **Problem: Cache version mismatch errors**

**Cause:** old `pwa-v2.1.js` still expects v3.1

**Solution:**
```bash
# Verify you're using the FIXED version
grep "v3.2-portal" client/js/pwa-v2.1.js

# Should find line 498 in the fixed version
# If not, make sure you deployed pwa-v2.1-FIXED.js
```

### **Problem: SyncEngine not initialized**

**Cause:** Could be delayed initialization or missing Supabase

**Solution:**
```javascript
// In console:
console.log('SyncEngine ready:', await window._syncEngineReady);
console.log('Supabase loaded:', typeof window._supabase);
console.log('Sync status:', window._syncStatus);
```

---

## 📊 Monitoring

Add these to your analytics/logging:

```javascript
// Track offline instances
if (!navigator.onLine) {
  console.log('[Analytics] User offline at:', new Date().toISOString());
  // Send to your logging service
}

// Track sync completion
window.addEventListener('storage', (e) => {
  if (e.key === '_sync_event') {
    const data = JSON.parse(e.newValue);
    console.log('[Analytics] Sync attempt:', data.attempt, data.status);
    // Send to analytics
  }
});

// Track cache size
caches.keys().then(names => {
  Promise.all(names.map(name =>
    caches.open(name).then(c => c.keys().then(keys => ({
      cache: name,
      entries: keys.length
    })))
  )).then(stats => console.log('[Analytics] Cache stats:', stats));
});
```

---

## 🎯 Next: Optional Upgrades

After confirming offline functionality works:

1. **Upgrade Service Worker** to v3.2 (for better error handling)
2. **Add Push Notifications** support (already in v3.2)
3. **Add Background Sync** for failed operations
4. **Monitor cache usage** and implement cleanup

---

## 📞 Support

**Still having issues?** Check:
- ✅ `OFFLINE_ISSUES_ANALYSIS.md` — detailed issue breakdown
- ✅ `docs/PWA_IMPLEMENTATION_GUIDE.md` — implementation details
- ✅ `client/js/pwa-v2.1-FIXED.js` — code comments with fixes

---

**Last Updated:** 2026-05-16
