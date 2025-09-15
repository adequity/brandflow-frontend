# Troubleshooting Guide

## Common Issues & Solutions

This guide covers common problems you might encounter while developing or using the BrandFlow system, along with step-by-step solutions.

## Frontend Issues

### 1. Build & Development Issues

#### Issue: Vite Dev Server Won't Start

**Symptoms:**
- `npm run dev` fails
- Port already in use error
- Module not found errors

**Solutions:**

1. **Port Conflict:**
```bash
# Check what's using the port
netstat -ano | findstr :5173  # Windows
lsof -ti:5173                 # macOS/Linux

# Kill the process or use different port
npx kill-port 5173
# Or modify vite.config.js to use different port
```

2. **Clear Cache and Reinstall:**
```bash
rm -rf node_modules
rm package-lock.json
npm cache clean --force
npm install
```

3. **Check Node Version:**
```bash
node --version  # Should be ≥18.0.0
npm --version

# Update Node if needed
nvm install 18
nvm use 18
```

#### Issue: Build Fails with Memory Errors

**Symptoms:**
- `npm run build` fails
- "JavaScript heap out of memory" error
- Build process hangs

**Solutions:**

1. **Increase Node Memory:**
```bash
# Temporary fix
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build

# Permanent fix in package.json
"scripts": {
  "build": "NODE_OPTIONS='--max-old-space-size=4096' vite build"
}
```

2. **Optimize Bundle Size:**
```javascript
// vite.config.js
export default defineConfig({
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  }
})
```

#### Issue: Hot Reload Not Working

**Symptoms:**
- Changes don't reflect in browser
- Page doesn't auto-refresh
- Console shows connection errors

**Solutions:**

1. **Check HMR Configuration:**
```javascript
// vite.config.js
export default defineConfig({
  server: {
    hmr: {
      port: 5173,
      host: 'localhost'
    }
  }
})
```

2. **Clear Browser Cache:**
- Hard refresh: `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)
- Clear application data in DevTools
- Try incognito/private mode

### 2. API Connection Issues

#### Issue: API Calls Fail with CORS Errors

**Symptoms:**
- Console shows CORS policy errors
- Network tab shows failed preflight requests
- Authentication headers blocked

**Solutions:**

1. **Check Backend CORS Configuration:**
```python
# app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://your-domain.netlify.app"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["*"]
)
```

2. **Verify API Base URL:**
```javascript
// src/api/client.js
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-backend.railway.app'
  : 'http://localhost:8000';
```

3. **Check Vite Proxy Configuration:**
```javascript
// vite.config.js
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
```

#### Issue: Authentication Token Issues

**Symptoms:**
- Login succeeds but subsequent requests fail
- 401 Unauthorized errors
- Token not being sent in headers

**Solutions:**

1. **Check Token Storage:**
```javascript
// Verify token is stored
const user = JSON.parse(localStorage.getItem('user'));
console.log('Stored user:', user);
console.log('Token:', user?.access_token);
```

2. **Check API Client Headers:**
```javascript
// src/api/client.js
const getAuthHeaders = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.access_token ? {
    'Authorization': `Bearer ${user.access_token}`
  } : {};
};
```

3. **Token Expiry Handling:**
```javascript
const handleApiError = (error) => {
  if (error.response?.status === 401) {
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
  return Promise.reject(error);
};
```

### 3. UI/UX Issues

#### Issue: Components Not Rendering Properly

**Symptoms:**
- White screen or blank components
- Missing styles
- Layout broken

**Solutions:**

1. **Check Console for Errors:**
- Open DevTools (F12)
- Look for JavaScript errors
- Check failed resource loads

2. **Verify Imports:**
```javascript
// Check all imports are correct
import React from 'react';
import Component from './Component'; // Correct path
```

3. **Check CSS Classes:**
```javascript
// Verify Tailwind classes are correct
<div className="flex items-center justify-center">
  {/* Content */}
</div>
```

#### Issue: Modal or Overlay Issues

**Symptoms:**
- Modals don't close
- Background not clickable
- Z-index issues

**Solutions:**

1. **Check Modal State Management:**
```javascript
const { isOpen, openModal, closeModal } = useModal();

// Ensure proper state updates
const handleClose = () => {
  closeModal();
  // Clear any form data if needed
};
```

2. **Fix Z-index Issues:**
```css
/* Add to CSS */
.modal-overlay {
  z-index: 1000;
}
.modal-content {
  z-index: 1001;
}
```

## Backend Issues

### 1. Server Startup Issues

#### Issue: FastAPI Server Won't Start

**Symptoms:**
- `python main.py` fails
- Import errors
- Database connection errors

**Solutions:**

1. **Check Dependencies:**
```bash
# Verify all packages installed
pip list
pip install -r requirements.txt

# Check Python version
python --version  # Should be ≥3.8
```

2. **Check Database Connection:**
```python
# Test database URL
from app.core.config import settings
print(settings.get_database_url)

# Test connection
from app.db.database import engine
print("Database URL:", engine.url)
```

3. **Check Port Availability:**
```bash
# Check if port 8000 is in use
netstat -ano | findstr :8000  # Windows
lsof -ti:8000                 # macOS/Linux

# Use different port if needed
python -m uvicorn main:app --port 8001
```

#### Issue: Database Initialization Errors

**Symptoms:**
- Tables not created
- Migration errors
- Foreign key constraint errors

**Solutions:**

1. **Manual Database Creation:**
```python
# Run in Python console
import asyncio
from app.db.database import create_tables, get_async_db
from app.db.init_data import init_database_data

async def setup_db():
    await create_tables()
    async for db in get_async_db():
        await init_database_data(db)
        break

asyncio.run(setup_db())
```

2. **Reset Database (Development Only):**
```bash
# SQLite
rm database.sqlite
python main.py

# PostgreSQL
psql $DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
python main.py
```

3. **Check Migration Status:**
```bash
# Alembic commands
alembic current
alembic history
alembic upgrade head
```

### 2. API Endpoint Issues

#### Issue: 404 Not Found on API Endpoints

**Symptoms:**
- API endpoints return 404
- Routes not registered
- Swagger docs missing endpoints

**Solutions:**

1. **Check Router Registration:**
```python
# app/main.py
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
# Ensure all routers are included
```

2. **Verify Route Definitions:**
```python
# Check endpoint definitions
@router.get("/", response_model=List[UserResponse])
async def get_users():  # Function name matters
    # Implementation
```

3. **Test Routes:**
```bash
# Check registered routes
curl http://localhost:8000/debug/routes

# Test specific endpoint
curl http://localhost:8000/api/users/
```

#### Issue: 422 Validation Errors

**Symptoms:**
- Request validation fails
- Missing required fields
- Type validation errors

**Solutions:**

1. **Check Request Schema:**
```python
# Verify Pydantic models
class UserCreate(BaseModel):
    name: str = Field(..., min_length=1)
    email: EmailStr
    # Check field definitions match frontend
```

2. **Check Request Data:**
```javascript
// Frontend - ensure data structure matches
const requestData = {
  name: "John Doe",
  email: "john@example.com",
  password: "password123"
  // Verify all required fields present
};
```

3. **Debug Validation:**
```python
# Add logging to endpoint
@router.post("/")
async def create_user(user_data: UserCreate):
    print(f"Received data: {user_data}")
    # Process request
```

### 3. Database Issues

#### Issue: Connection Pool Exhaustion

**Symptoms:**
- "Connection pool exhausted" errors
- Slow API responses
- Database timeout errors

**Solutions:**

1. **Optimize Connection Pool:**
```python
# app/db/database.py
engine = create_async_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_recycle=3600,
    pool_pre_ping=True
)
```

2. **Proper Session Management:**
```python
# Always use dependency injection
async def get_data(db: AsyncSession = Depends(get_async_db)):
    try:
        result = await db.execute(query)
        return result.all()
    finally:
        # Session automatically closed by dependency
        pass
```

3. **Monitor Connections:**
```python
# Check active connections
from sqlalchemy import text
result = await db.execute(text("SELECT count(*) FROM pg_stat_activity"))
print(f"Active connections: {result.scalar()}")
```

#### Issue: Migration Conflicts

**Symptoms:**
- Alembic revision conflicts
- Database schema mismatch
- Foreign key errors

**Solutions:**

1. **Resolve Migration Conflicts:**
```bash
# Check revision history
alembic history

# Merge heads if multiple branches
alembic merge -m "merge conflicts" head1 head2

# Apply specific revision
alembic upgrade revision_id
```

2. **Reset Migrations (Development Only):**
```bash
# Delete alembic version table
psql $DATABASE_URL -c "DROP TABLE IF EXISTS alembic_version"

# Recreate migration
alembic stamp head
alembic revision --autogenerate -m "Initial migration"
```

## Deployment Issues

### 1. Netlify Deployment Issues

#### Issue: Build Fails on Netlify

**Symptoms:**
- Build succeeds locally but fails on Netlify
- Missing dependencies
- Environment differences

**Solutions:**

1. **Check Node Version:**
```toml
# netlify.toml
[build.environment]
  NODE_VERSION = "18"
```

2. **Fix Path Issues:**
```bash
# Use exact paths in imports
import Component from './Component.jsx'
# Not relative paths that might resolve differently
```

3. **Check Build Command:**
```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"
```

#### Issue: SPA Routing Issues

**Symptoms:**
- 404 errors on page refresh
- Direct URL access fails
- React Router not working

**Solutions:**

1. **Add Redirect Rules:**
```
# _redirects file in public/
/*    /index.html   200
```

2. **Check Router Configuration:**
```javascript
// Ensure BrowserRouter is used
import { BrowserRouter } from 'react-router-dom';

<BrowserRouter>
  <Routes>
    {/* Your routes */}
  </Routes>
</BrowserRouter>
```

### 2. Railway Deployment Issues

#### Issue: Application Not Starting

**Symptoms:**
- Railway shows "Crashed" status
- Health checks fail
- Logs show startup errors

**Solutions:**

1. **Check Start Command:**
```toml
# railway.toml
[deploy]
  startCommand = "python main.py"
  healthcheckPath = "/health"
```

2. **Verify Port Configuration:**
```python
# main.py
import os
port = int(os.environ.get("PORT", 8080))
uvicorn.run(app, host="0.0.0.0", port=port)
```

3. **Check Environment Variables:**
```bash
# Verify required variables are set
railway variables

# Set missing variables
railway variables set SECRET_KEY=your-secret-key
```

#### Issue: Database Connection Fails

**Symptoms:**
- Database connection errors in logs
- 500 errors on API calls
- Cannot create tables

**Solutions:**

1. **Verify Database Service:**
```bash
# Check PostgreSQL is provisioned
railway services

# Check database URL
railway variables | grep DATABASE_URL
```

2. **Test Connection:**
```python
# Test connection in Railway environment
railway run python -c "
from app.db.database import engine
print('Database URL:', engine.url)
"
```

3. **Check Connection String:**
```python
# Ensure proper async driver
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql+asyncpg://")
```

## Performance Issues

### 1. Slow API Responses

**Symptoms:**
- Long response times
- Timeout errors
- Poor user experience

**Solutions:**

1. **Optimize Database Queries:**
```python
# Use eager loading for relationships
campaigns = await db.execute(
    select(Campaign)
    .options(joinedload(Campaign.creator))
    .limit(10)
)
```

2. **Add Database Indexes:**
```python
# Add indexes for commonly queried fields
class User(Base):
    email = Column(String, unique=True, index=True)
    role = Column(Enum(UserRole), index=True)
```

3. **Implement Caching:**
```python
from functools import lru_cache

@lru_cache(maxsize=100)
def get_cached_data(key: str):
    # Expensive operation
    return result
```

### 2. Large Bundle Sizes

**Symptoms:**
- Slow initial page load
- Large JavaScript files
- Poor performance scores

**Solutions:**

1. **Code Splitting:**
```javascript
// Use dynamic imports
const LazyComponent = lazy(() => import('./LazyComponent'));
```

2. **Bundle Analysis:**
```bash
# Analyze bundle
npm install -g vite-bundle-analyzer
npx vite-bundle-analyzer
```

3. **Optimize Dependencies:**
```javascript
// Import only needed functions
import { format } from 'date-fns/format';
// Not entire library
```

## Security Issues

### 1. Authentication Issues

**Symptoms:**
- Unauthorized access
- Token vulnerabilities
- Session management problems

**Solutions:**

1. **Secure Token Storage:**
```javascript
// Use secure storage
const storeToken = (token) => {
  // Consider more secure alternatives to localStorage
  localStorage.setItem('authToken', token);
};
```

2. **Implement Token Refresh:**
```javascript
const refreshToken = async () => {
  try {
    const response = await api.post('/auth/refresh');
    updateStoredToken(response.data.access_token);
  } catch (error) {
    // Redirect to login
    window.location.href = '/login';
  }
};
```

3. **Validate Permissions:**
```python
# Backend permission checking
def check_permission(user: User, action: str, resource: str):
    if user.role == UserRole.CLIENT and action == "delete":
        raise HTTPException(403, "Insufficient permissions")
```

## Getting Help

### 1. Debugging Tools

**Frontend Debugging:**
- Browser DevTools (F12)
- React Developer Tools extension
- Vue DevTools (if applicable)
- Network tab for API calls

**Backend Debugging:**
- FastAPI automatic documentation (`/docs`)
- Python debugger (`pdb`)
- Logging statements
- Database query logging

### 2. Log Analysis

**Frontend Logs:**
```javascript
// Add comprehensive logging
console.log('API call:', { url, method, data });
console.error('Error occurred:', error);
```

**Backend Logs:**
```python
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

logger.info(f"Processing request: {request.method} {request.url}")
```

### 3. Community Resources

**Documentation:**
- FastAPI documentation: https://fastapi.tiangolo.com/
- React documentation: https://react.dev/
- Railway documentation: https://docs.railway.app/
- Netlify documentation: https://docs.netlify.com/

**Support Channels:**
- GitHub Issues (for bug reports)
- Stack Overflow (for general questions)
- Discord/Slack communities
- Official support channels for hosting providers

### 4. Emergency Procedures

**Production Issues:**
1. Check system status dashboards
2. Review recent deployments
3. Check error logs
4. Implement hotfix if needed
5. Roll back if necessary

**Data Recovery:**
1. Access backup systems
2. Identify last known good state
3. Restore from backup
4. Verify data integrity
5. Test all critical functions

**Contact Information:**
- Development Team: [contact information]
- DevOps Support: [contact information]
- Emergency Contact: [24/7 contact information]

Remember to always check the logs first, as they often contain the specific error messages needed to identify and resolve issues quickly.