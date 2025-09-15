# Configuration & Deployment Guide

## Overview

BrandFlow uses a two-tier deployment architecture:
- **Frontend**: Deployed on Netlify with automatic builds from Git
- **Backend**: Deployed on Railway with PostgreSQL database

## Environment Configuration

### Frontend Configuration

#### Development Environment

**Environment Variables:**
- No environment variables required for development
- API calls are proxied through Vite dev server

**Configuration Files:**

1. **vite.config.js**
```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'https://brandflow-backend-production-99ae.up.railway.app',
        changeOrigin: true,
        secure: true,
        ws: false
      }
    }
  }
})
```

2. **package.json Scripts**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview --port 4173"
  }
}
```

3. **tailwind.config.js**
```javascript
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {}
  },
  plugins: []
}
```

#### Production Environment

**Build Configuration:**
- **Bundle Optimization**: Automatic code splitting
- **Asset Optimization**: Image and CSS minification
- **Chunk Strategy**: Library separation for better caching

**Netlify Configuration:**

1. **Build Settings**
   - Build Command: `npm run build`
   - Publish Directory: `dist`
   - Node Version: 18.x

2. **_redirects File**
```
/*    /index.html   200
```

### Backend Configuration

#### Development Environment

**Required Dependencies:**
```bash
pip install -r requirements.txt
```

**Environment Variables (.env):**
```env
# Database (SQLite for development)
DATABASE_URL=sqlite+aiosqlite:///./database.sqlite

# Security
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Development Settings
DEBUG=true
USE_POSTGRESQL=false

# Upload Settings
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

#### Production Environment (Railway)

**Required Environment Variables:**
```env
# Database (Automatically provided by Railway PostgreSQL)
DATABASE_URL=postgresql+asyncpg://user:pass@host:port/db

# Security (MUST be changed in production)
SECRET_KEY=your-production-secret-key-change-this
ACCESS_TOKEN_EXPIRE_MINUTES=30
ALGORITHM=HS256

# Production Settings
DEBUG=false

# Railway Specific
PORT=8080
RAILWAY_ENVIRONMENT_NAME=production

# File Upload
UPLOAD_DIR=/app/uploads
MAX_FILE_SIZE=10485760

# PostgreSQL Connection Details (Railway provides these)
POSTGRES_HOST=
POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_DB=
POSTGRES_PORT=5432
```

**Application Settings (app/core/config.py):**
```python
class Settings(BaseSettings):
    # Database with Railway auto-detection
    @property
    def get_database_url(self) -> str:
        railway_db_url = os.getenv("DATABASE_URL")
        if railway_db_url:
            return railway_db_url.replace("postgres://", "postgresql+asyncpg://")
        return "sqlite+aiosqlite:///./database.sqlite"
    
    # CORS origins for production
    ALLOWED_ORIGINS: List[str] = [
        "https://brandflo.netlify.app",
        "https://adequate-brandflow.netlify.app",
        "http://localhost:5173"  # Development
    ]
```

## Database Configuration

### Development Database (SQLite)

**Setup:**
```bash
cd brandflow-fastapi
python main.py  # Automatically creates database.sqlite
```

**Features:**
- File-based storage
- No installation required
- Automatic table creation
- Sample data initialization

**Location:** `./database.sqlite` in project root

### Production Database (PostgreSQL on Railway)

**Automatic Setup:**
1. Railway automatically provisions PostgreSQL
2. `DATABASE_URL` environment variable is provided
3. Application auto-detects and connects

**Manual Setup (if needed):**
```bash
# Connect to Railway project
railway login
railway link

# View database URL
railway variables

# Access database console
railway run psql $DATABASE_URL
```

**Connection String Format:**
```
postgresql+asyncpg://user:password@host:port/database
```

**Migration Commands:**
```bash
# Generate migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Check current version
alembic current
```

## Deployment Procedures

### Frontend Deployment (Netlify)

#### Automatic Deployment

1. **Git Integration:**
   - Connect Repository to Netlify
   - Set build branch (usually `main`)
   - Configure build settings

2. **Build Configuration:**
   ```yaml
   # netlify.toml
   [build]
     publish = "dist"
     command = "npm run build"
   
   [build.environment]
     NODE_VERSION = "18"
   
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

3. **Domain Configuration:**
   - Custom domain setup
   - SSL certificate (automatic)
   - DNS configuration

#### Manual Deployment

```bash
# Build for production
cd brandflow-fix
npm install
npm run build

# Deploy with Netlify CLI
npm install -g netlify-cli
netlify login
netlify deploy --prod --dir=dist
```

### Backend Deployment (Railway)

#### Automatic Deployment

1. **Railway Setup:**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login and connect
   railway login
   railway link
   ```

2. **Project Configuration:**
   - Connect GitHub repository
   - Set Python runtime
   - Configure environment variables

3. **Build Configuration:**
   ```toml
   # railway.toml
   [build]
     builder = "nixpacks"
   
   [deploy]
     startCommand = "python main.py"
     healthcheckPath = "/health"
     healthcheckTimeout = 300
   ```

#### Manual Deployment

```bash
# Deploy to Railway
cd brandflow-fastapi
railway up
```

#### Database Setup on Railway

1. **Add PostgreSQL Service:**
   ```bash
   railway add postgresql
   ```

2. **Configure Connection:**
   - Railway automatically sets `DATABASE_URL`
   - Application auto-detects PostgreSQL
   - Database initialization runs on first start

3. **Database Migration:**
   ```bash
   # Run migration on Railway
   railway run python -c "
   import asyncio
   from app.db.database import create_tables, create_performance_indexes
   from app.db.init_data import init_database_data
   from app.db.database import get_async_db
   
   async def migrate():
       await create_tables()
       async for db in get_async_db():
           await init_database_data(db)
           break
   
   asyncio.run(migrate())
   "
   ```

## Domain Configuration

### Frontend Domain (Netlify)

1. **Custom Domain Setup:**
   - Add domain in Netlify dashboard
   - Configure DNS records:
     ```
     Type: CNAME
     Name: www
     Value: <netlify-subdomain>.netlify.app
     ```

2. **SSL Configuration:**
   - Automatic Let's Encrypt certificates
   - Force HTTPS redirect
   - HTTP/2 support

### Backend Domain (Railway)

1. **Railway Domain:**
   - Automatic: `<project-name>.up.railway.app`
   - Custom domain support available

2. **DNS Configuration:**
   ```
   Type: CNAME
   Name: api
   Value: <railway-project>.up.railway.app
   ```

## Monitoring & Health Checks

### Health Check Endpoints

**Backend Health Check:**
```bash
# Basic health check
curl https://your-backend-domain.railway.app/health

# Detailed system status
curl https://your-backend-domain.railway.app/api/system/health
```

**Response Example:**
```json
{
  "status": "healthy",
  "version": "2.3.0",
  "message": "BrandFlow FastAPI Health Check",
  "timestamp": "2025-09-14T12:00:00Z",
  "database_status": "connected",
  "registered_apis": 112
}
```

### Monitoring Setup

**Railway Monitoring:**
- Automatic uptime monitoring
- Performance metrics dashboard
- Log aggregation and search
- Alert notifications

**Netlify Monitoring:**
- Build status monitoring
- Deploy notifications
- Performance analytics
- Error tracking

### Performance Monitoring

**Backend Metrics:**
- Request response times
- Database query performance
- Memory usage
- CPU utilization

**Frontend Metrics:**
- Bundle size analysis
- Load time metrics
- Core Web Vitals
- User interaction tracking

## Backup & Recovery

### Database Backup

**Automated Backups (Railway):**
- Daily automatic backups
- Point-in-time recovery
- Backup retention: 7 days (free plan)

**Manual Backup:**
```bash
# Export database
railway run pg_dump $DATABASE_URL > backup.sql

# Import backup
railway run psql $DATABASE_URL < backup.sql
```

### File Upload Backup

**Development:**
```bash
# Backup uploads directory
tar -czf uploads-backup.tar.gz uploads/
```

**Production:**
- Configure persistent storage
- Regular file backup schedule
- Consider cloud storage integration

### Configuration Backup

**Environment Variables:**
```bash
# Export Railway variables
railway variables > railway-vars.json

# Netlify environment variables
# Export from dashboard or CLI
```

## Security Configuration

### SSL/TLS Configuration

**Frontend (Netlify):**
- Automatic SSL certificates
- TLS 1.2+ enforcement
- HSTS headers

**Backend (Railway):**
- Automatic SSL termination
- Certificate management
- Secure headers middleware

### Environment Security

**Secrets Management:**
```bash
# Railway secrets
railway variables set SECRET_KEY=your-secret-key

# Netlify environment variables
netlify env:set API_URL https://your-backend-domain
```

**Security Headers:**
```python
# Backend security middleware
from starlette.middleware.trustedhost import TrustedHostMiddleware

app.add_middleware(
    TrustedHostMiddleware, 
    allowed_hosts=["*.railway.app", "yourdomain.com"]
)
```

### CORS Configuration

**Backend CORS Settings:**
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-frontend-domain.netlify.app",
        "http://localhost:5173"  # Development
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"]
)
```

## Scaling Configuration

### Frontend Scaling (Netlify)

**CDN Configuration:**
- Global edge network
- Automatic asset optimization
- Gzip/Brotli compression
- Image optimization

**Performance Optimization:**
```javascript
// Vite build optimization
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['lucide-react']
        }
      }
    }
  }
})
```

### Backend Scaling (Railway)

**Horizontal Scaling:**
- Multiple service instances
- Load balancing
- Auto-scaling based on metrics

**Vertical Scaling:**
- Memory allocation adjustment
- CPU resource scaling
- Database connection pooling

**Database Scaling:**
```python
# Connection pool configuration
from sqlalchemy.pool import QueuePool

engine = create_async_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True
)
```

## Troubleshooting Deployment

### Common Issues

**Frontend Build Errors:**
```bash
# Clear build cache
rm -rf node_modules/.vite
npm install
npm run build
```

**Backend Deployment Errors:**
```bash
# Check Railway logs
railway logs

# Verify environment variables
railway variables
```

**Database Connection Issues:**
```bash
# Test database connection
railway run python -c "
from app.db.database import engine
print(engine.url)
"
```

### Log Analysis

**Frontend Logs (Netlify):**
- Build logs in deploy dashboard
- Function logs for serverless functions
- Edge logs for CDN performance

**Backend Logs (Railway):**
```bash
# View real-time logs
railway logs --follow

# Filter logs by level
railway logs --filter error
```

### Rollback Procedures

**Frontend Rollback:**
1. Netlify dashboard → Deploys
2. Select previous successful deploy
3. Click "Publish deploy"

**Backend Rollback:**
```bash
# Railway rollback
railway rollback [deployment-id]

# Or redeploy previous commit
git revert HEAD
git push origin main
```

## Development Workflow

### Local Development

**Setup Steps:**
1. Clone repositories
2. Install dependencies
3. Configure environment variables
4. Start development servers

**Development Commands:**
```bash
# Frontend
cd brandflow-fix
npm install
npm run dev

# Backend
cd brandflow-fastapi
pip install -r requirements.txt
python main.py
```

### Testing Before Deployment

**Frontend Testing:**
```bash
# Build test
npm run build
npm run preview

# Component tests
npm test
```

**Backend Testing:**
```bash
# API tests
python -m pytest tests/

# Manual testing
curl localhost:8000/health
```

### CI/CD Pipeline

**Automated Testing:**
1. Code push triggers build
2. Run test suites
3. Deploy to staging
4. Deploy to production (if tests pass)

**Quality Gates:**
- Code formatting (Prettier/Black)
- Linting (ESLint/Flake8)
- Unit tests
- Integration tests
- Security scanning

This deployment guide ensures reliable, scalable deployment of the BrandFlow system with proper monitoring, security, and recovery procedures.