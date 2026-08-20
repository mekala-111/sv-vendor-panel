# Phase 1: Vendor Authentication — Test Guide

## Prerequisites Checklist

### Backend Setup
- [ ] Backend is running on `http://localhost:4000`
- [ ] MySQL database is running and migrations applied
- [ ] At least one vendor account exists in the database

### Vendor Panel Setup
- [ ] `.env.local` exists with `NEXT_PUBLIC_API_URL=http://localhost:4000/api`
- [ ] `src/lib/api.ts` created (HTTP client)
- [ ] `src/lib/auth.ts` updated (backend login)
- [ ] `src/proxy.ts` updated (JWT validation)
- [ ] `middleware.ts` created (routing)

---

## Test Scenario: Login Flow

### Step 1: Start Backend
```bash
cd /Users/jh/Desktop/Projects\ /sv-live-backend
npm run dev
# Should output: Server running on http://localhost:4000
```

### Step 2: Verify Backend is Ready
```bash
curl http://localhost:4000/health
# Expected: { "status": "ok", "env": "development" }
```

### Step 3: Get a Valid Vendor Account

**Option A: Use Admin Panel to Create Vendor**
```bash
# In another terminal:
cd /Users/jh/Desktop/Projects\ /sv-admin-panel
npm run dev
# Visit http://localhost:3000/admin/vendors
# Create a new vendor with email (e.g., vendor@example.com)
```

**Option B: Manually Insert via Database**
```sql
-- Connect to MySQL
mysql -u root svlive

-- Create vendor user
INSERT INTO User (id, name, email, phone, hashedPassword, role, status, createdAt, updatedAt)
VALUES (
  UUID(),
  'Test Vendor',
  'vendor@example.com',
  '+1234567890',
  '$2b$10$...', -- bcrypt hash of password123
  'VENDOR',
  'ACTIVE',
  NOW(),
  NOW()
);
```

### Step 4: Start Vendor Panel
```bash
cd /Users/jh/Desktop/Projects\ /sv-vendor-panel
npm run dev
# Should output: Local: http://localhost:3000
```

### Step 5: Test Login
1. Open http://localhost:3000/login
2. Enter credentials:
   - **Email**: vendor@example.com
   - **Password**: password123 (or whatever you set)
   - **Remember me**: Optional
3. Click "Sign In"

### Expected Behavior

#### Success Path
- [ ] Form submits
- [ ] Backend is called: `POST http://localhost:4000/api/auth/login`
- [ ] Backend returns JWT tokens (accessToken, refreshToken)
- [ ] Vendor panel stores tokens in httpOnly cookies
- [ ] Browser redirects to `/vendor/dashboard`
- [ ] Vendor can see dashboard

#### Error Path (Invalid Credentials)
- [ ] Form submits
- [ ] Backend returns 401 Unauthorized
- [ ] Vendor panel redirects to `/login?error=1`
- [ ] Error message displays: "Enter a valid email and password."

---

## Debugging

### Check Cookies in Browser DevTools
```javascript
// Open DevTools → Application → Cookies
// Look for:
// - vendor_access_token
// - vendor_refresh_token
// - vendor_user
```

### Check Network Requests
1. Open DevTools → Network tab
2. Filter: `fetch`
3. Look for `auth/login` request
4. Verify response contains `accessToken` and `refreshToken`

### Check Terminal Output
```bash
# Backend should log successful auth:
[auth.service] Login successful for vendor@example.com

# Vendor panel should log:
API call successful to /auth/login
```

### Manually Test Backend Login
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"vendor@example.com","password":"password123"}'

# Expected response:
{
  "user": {
    "id": "uuid",
    "name": "Test Vendor",
    "email": "vendor@example.com",
    "role": "VENDOR"
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

---

## Common Issues & Solutions

### Issue: "Backend did not return tokens"
**Cause**: Backend returned incomplete response
**Solution**: 
- Verify backend is returning both `accessToken` and `refreshToken`
- Check backend logs for errors

### Issue: "Cannot POST /api/auth/login"
**Cause**: Backend URL is incorrect or backend is not running
**Solution**:
- Verify backend is running: `curl http://localhost:4000/health`
- Check `.env.local` has correct `NEXT_PUBLIC_API_URL`

### Issue: Redirects to login with error
**Cause**: Backend rejected credentials
**Solution**:
- Verify vendor account exists
- Verify password is correct
- Check backend logs for why auth failed

### Issue: Tokens stored but dashboard is blank
**Cause**: Dashboard page is trying to load data but API client not yet integrated
**Solution**: This is expected — Phase 2 will wire dashboard to API

---

## Next: Phase 2 — Dashboard Data

Once login works:
1. Verify cookies are set correctly
2. Verify dashboard can access API via JWT tokens
3. Wire dashboard cards to real backend data: `GET /api/vendors/dashboard`

**Files to update in Phase 2**:
- `src/app/vendor/dashboard/page.tsx` — Fetch real data instead of mocks
- Possibly create `src/lib/hooks/useDashboard.ts` — React hook for dashboard queries
