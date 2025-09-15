# Development Guide

## Overview

This guide provides comprehensive information for developers working on the BrandFlow project, including coding standards, development workflow, and contribution guidelines.

## Development Environment Setup

### Prerequisites

**Required Software:**
- Node.js ≥ 18.0.0
- Python ≥ 3.8
- Git
- Code editor (VS Code recommended)

**Optional Tools:**
- PostgreSQL (for local database testing)
- Docker (for containerized development)
- Postman (for API testing)

### IDE Configuration

#### VS Code Extensions

**Frontend Development:**
```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "ms-vscode.vscode-eslint",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

**Backend Development:**
```json
{
  "recommendations": [
    "ms-python.python",
    "ms-python.black-formatter",
    "ms-python.flake8",
    "ms-python.pylint",
    "ms-toolsai.jupyter",
    "ms-vscode.thunder-client"
  ]
}
```

#### Editor Settings

**VS Code settings.json:**
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "python.formatting.provider": "black",
  "python.linting.enabled": true,
  "python.linting.flake8Enabled": true,
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[python]": {
    "editor.defaultFormatter": "ms-python.black-formatter"
  }
}
```

### Local Development Setup

#### Frontend Setup

```bash
# Clone repository
git clone <repository-url>
cd brandflow-fix

# Install dependencies
npm install

# Start development server
npm run dev
```

#### Backend Setup

```bash
# Navigate to backend
cd brandflow-fastapi

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start development server
python main.py
```

## Coding Standards

### Frontend Standards

#### JavaScript/React Guidelines

**File Naming:**
- Components: `PascalCase.jsx` (e.g., `UserProfile.jsx`)
- Utilities: `camelCase.js` (e.g., `apiClient.js`)
- Constants: `UPPER_SNAKE_CASE.js` (e.g., `API_ENDPOINTS.js`)

**Component Structure:**
```jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

// Component definition with proper destructuring
const MyComponent = ({ prop1, prop2, onAction }) => {
  // Hooks at the top
  const [state, setState] = useState(initialValue);
  
  // Event handlers
  const handleAction = useCallback(() => {
    onAction?.(state);
  }, [state, onAction]);
  
  // Effects
  useEffect(() => {
    // Side effect logic
  }, [dependency]);
  
  // Render
  return (
    <div className="component-container">
      {/* Component content */}
    </div>
  );
};

// PropTypes definition
MyComponent.propTypes = {
  prop1: PropTypes.string.required,
  prop2: PropTypes.number,
  onAction: PropTypes.func
};

// Default props (if needed)
MyComponent.defaultProps = {
  prop2: 0
};

export default MyComponent;
```

**State Management:**
```jsx
// Use useState for local state
const [isLoading, setIsLoading] = useState(false);

// Use useContext for global state
const { user, updateUser } = useContext(AuthContext);

// Use useReducer for complex state
const [state, dispatch] = useReducer(reducer, initialState);
```

#### CSS/Styling Guidelines

**Tailwind CSS Usage:**
```jsx
// Preferred: Utility classes
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">

// Avoid: Inline styles
<div style={{ display: 'flex', padding: '16px' }}>

// Component-specific classes when needed
<div className="custom-component-class">
```

**Responsive Design:**
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Responsive grid layout */}
</div>
```

#### Performance Guidelines

**Component Optimization:**
```jsx
// Use React.memo for expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  // Component logic
});

// Use useCallback for event handlers
const handleClick = useCallback(() => {
  // Handler logic
}, [dependency]);

// Use useMemo for expensive calculations
const expensiveValue = useMemo(() => {
  return expensiveCalculation(data);
}, [data]);
```

**Lazy Loading:**
```jsx
// Lazy load components
const LazyComponent = lazy(() => import('./LazyComponent'));

// Use with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <LazyComponent />
</Suspense>
```

### Backend Standards

#### Python/FastAPI Guidelines

**File Structure:**
```
app/
├── api/
│   ├── endpoints/     # API route handlers
│   ├── deps.py       # Dependencies
│   └── router.py     # Router configuration
├── core/             # Core configurations
├── models/           # Database models
├── schemas/          # Pydantic schemas
├── services/         # Business logic
└── utils/           # Utility functions
```

**API Endpoint Structure:**
```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.db.database import get_async_db
from app.schemas.user import UserCreate, UserResponse
from app.services.user_service import UserService
from app.api.deps import get_current_active_user

router = APIRouter()

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new user.
    
    Args:
        user_data: User creation data
        db: Database session
        current_user: Current authenticated user
        
    Returns:
        Created user information
        
    Raises:
        HTTPException: If user creation fails
    """
    try:
        service = UserService(db)
        user = await service.create_user(user_data)
        return UserResponse.from_orm(user)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
```

**Model Definition:**
```python
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from typing import Optional

from .base import Base, TimestampMixin

class User(Base, TimestampMixin):
    __tablename__ = "users"
    
    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Required fields
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    
    # Optional fields
    company = Column(String(200), nullable=True)
    
    # Foreign keys
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    
    # Relationships
    role = relationship("Role", back_populates="users")
    campaigns = relationship("Campaign", back_populates="creator")
    
    def __repr__(self):
        return f"<User(id={self.id}, email={self.email})>"
```

**Service Layer Pattern:**
```python
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional

from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate

class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_user(self, user_data: UserCreate) -> User:
        """Create a new user."""
        user = User(**user_data.dict())
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user
    
    async def get_user_by_id(self, user_id: int) -> Optional[User]:
        """Get user by ID."""
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()
    
    async def update_user(self, user_id: int, user_data: UserUpdate) -> Optional[User]:
        """Update user information."""
        user = await self.get_user_by_id(user_id)
        if not user:
            return None
        
        for field, value in user_data.dict(exclude_unset=True).items():
            setattr(user, field, value)
        
        await self.db.commit()
        await self.db.refresh(user)
        return user
```

#### Error Handling

**Exception Handling:**
```python
from fastapi import HTTPException, status
import logging

logger = logging.getLogger(__name__)

@router.get("/users/{user_id}")
async def get_user(user_id: int, db: AsyncSession = Depends(get_async_db)):
    try:
        service = UserService(db)
        user = await service.get_user_by_id(user_id)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with ID {user_id} not found"
            )
        
        return UserResponse.from_orm(user)
    
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error retrieving user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )
```

### Database Guidelines

#### Migration Best Practices

```python
# Use descriptive revision messages
alembic revision --autogenerate -m "Add user profile fields"

# Check migration before applying
alembic show revision_id

# Test migrations on copy of production data
alembic upgrade head --sql > migration.sql
```

#### Query Optimization

```python
# Use eager loading for relationships
from sqlalchemy.orm import joinedload

users = await db.execute(
    select(User)
    .options(joinedload(User.campaigns))
    .where(User.is_active == True)
    .limit(10)
)

# Use proper indexing
class User(Base):
    email = Column(String, unique=True, index=True)  # Indexed
    created_at = Column(DateTime, index=True)        # For date queries
```

## Git Workflow

### Branch Strategy

**Main Branches:**
- `main`: Production-ready code
- `develop`: Integration branch for features
- `staging`: Pre-production testing

**Feature Branches:**
- `feature/user-authentication`
- `feature/campaign-management`
- `bugfix/login-redirect-issue`
- `hotfix/security-patch`

### Commit Guidelines

**Commit Message Format:**
```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test additions or modifications
- `chore`: Maintenance tasks

**Examples:**
```bash
feat(auth): add JWT token refresh functionality

fix(api): resolve CORS issue for Netlify domain

docs(readme): update deployment instructions

refactor(components): extract common modal logic
```

### Pull Request Process

1. **Create Feature Branch:**
```bash
git checkout -b feature/new-feature
git push -u origin feature/new-feature
```

2. **Development Cycle:**
```bash
# Make changes
git add .
git commit -m "feat(feature): implement new functionality"
git push origin feature/new-feature
```

3. **Pull Request:**
- Create PR against `develop` branch
- Add detailed description
- Include screenshots if UI changes
- Request code review

4. **Code Review Checklist:**
- [ ] Code follows style guidelines
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No security vulnerabilities
- [ ] Performance impact considered

5. **Merge Process:**
```bash
# Squash and merge for feature branches
# Regular merge for release branches
```

## Testing Strategy

### Frontend Testing

#### Unit Tests (Jest + React Testing Library)

```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import UserProfile from './UserProfile';

describe('UserProfile Component', () => {
  const mockUser = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com'
  };

  it('renders user information correctly', () => {
    render(<UserProfile user={mockUser} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    const mockOnEdit = jest.fn();
    render(<UserProfile user={mockUser} onEdit={mockOnEdit} />);
    
    fireEvent.click(screen.getByText('Edit'));
    expect(mockOnEdit).toHaveBeenCalledWith(mockUser);
  });
});
```

#### Integration Tests

```jsx
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import Dashboard from './Dashboard';

// Mock API calls
jest.mock('../api/client');

describe('Dashboard Integration', () => {
  it('loads and displays dashboard data', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Dashboard />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Campaign Statistics')).toBeInTheDocument();
    });
  });
});
```

### Backend Testing

#### Unit Tests (pytest)

```python
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.main import app
from app.services.user_service import UserService
from app.schemas.user import UserCreate

client = TestClient(app)

@pytest.mark.asyncio
async def test_create_user(db_session: AsyncSession):
    """Test user creation service."""
    service = UserService(db_session)
    user_data = UserCreate(
        name="Test User",
        email="test@example.com",
        password="password123"
    )
    
    user = await service.create_user(user_data)
    
    assert user.name == "Test User"
    assert user.email == "test@example.com"
    assert user.id is not None

def test_get_users_endpoint():
    """Test users API endpoint."""
    response = client.get("/api/users/")
    
    assert response.status_code == 200
    assert isinstance(response.json(), list)
```

#### API Tests

```python
def test_user_authentication():
    """Test user login flow."""
    # Create user
    user_data = {
        "name": "Test User",
        "email": "test@example.com",
        "password": "password123"
    }
    response = client.post("/api/users/", json=user_data)
    assert response.status_code == 201
    
    # Login
    login_data = {
        "email": "test@example.com",
        "password": "password123"
    }
    response = client.post("/api/auth/login-json", json=login_data)
    assert response.status_code == 200
    
    token = response.json()["access_token"]
    assert token is not None
```

### End-to-End Testing

#### Playwright Tests

```javascript
import { test, expect } from '@playwright/test';

test.describe('User Management Flow', () => {
  test('admin can create and manage users', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('[name="email"]', 'admin@brandflow.com');
    await page.fill('[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Navigate to user management
    await expect(page).toHaveURL('/admin/dashboard');
    await page.click('text=사용자 관리');
    
    // Create new user
    await page.click('text=새 사용자');
    await page.fill('[name="name"]', 'Test User');
    await page.fill('[name="email"]', 'newuser@example.com');
    await page.selectOption('[name="role"]', '직원');
    await page.click('text=저장');
    
    // Verify user creation
    await expect(page.locator('text=Test User')).toBeVisible();
  });
});
```

## Performance Optimization

### Frontend Optimization

#### Bundle Optimization

```javascript
// vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react'],
          'utils': ['date-fns', 'lodash']
        }
      }
    }
  }
});
```

#### Component Optimization

```jsx
// Memoize expensive components
const ExpensiveList = React.memo(({ items, filter }) => {
  const filteredItems = useMemo(() => {
    return items.filter(item => item.category === filter);
  }, [items, filter]);
  
  return (
    <div>
      {filteredItems.map(item => (
        <ExpensiveItem key={item.id} item={item} />
      ))}
    </div>
  );
});

// Virtualize large lists
import { FixedSizeList as List } from 'react-window';

const VirtualizedList = ({ items }) => (
  <List
    height={400}
    itemCount={items.length}
    itemSize={50}
    itemData={items}
  >
    {({ index, style, data }) => (
      <div style={style}>
        {data[index].name}
      </div>
    )}
  </List>
);
```

### Backend Optimization

#### Database Optimization

```python
# Use connection pooling
engine = create_async_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_recycle=3600
)

# Optimize queries with proper indexing
class User(Base):
    email = Column(String, unique=True, index=True)
    created_at = Column(DateTime, index=True)
    
    # Composite index for common query patterns
    __table_args__ = (
        Index('idx_user_role_status', 'role', 'status'),
    )
```

#### API Optimization

```python
# Use background tasks for heavy operations
from fastapi import BackgroundTasks

@router.post("/send-email/")
async def send_email(
    email_data: EmailData,
    background_tasks: BackgroundTasks
):
    background_tasks.add_task(send_email_task, email_data)
    return {"message": "Email will be sent in background"}

# Implement caching
from functools import lru_cache

@lru_cache(maxsize=100)
async def get_cached_user_stats(user_id: int):
    # Expensive calculation
    return stats
```

## Security Guidelines

### Frontend Security

```jsx
// Sanitize user input
import DOMPurify from 'dompurify';

const SafeHTML = ({ content }) => (
  <div 
    dangerouslySetInnerHTML={{ 
      __html: DOMPurify.sanitize(content) 
    }} 
  />
);

// Secure token storage
const TokenManager = {
  setToken: (token) => {
    // Consider more secure storage options
    localStorage.setItem('authToken', token);
  },
  
  getToken: () => {
    return localStorage.getItem('authToken');
  },
  
  removeToken: () => {
    localStorage.removeItem('authToken');
  }
};
```

### Backend Security

```python
# Input validation
from pydantic import BaseModel, validator, EmailStr

class UserCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    
    @validator('password')
    def validate_password(cls, v):
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain lowercase letter')
        return v

# SQL injection prevention (SQLAlchemy handles this)
from sqlalchemy import text

# GOOD: Parameterized query
result = await db.execute(
    select(User).where(User.email == email)
)

# AVOID: String concatenation
# result = await db.execute(text(f"SELECT * FROM users WHERE email = '{email}'"))
```

## Monitoring & Logging

### Application Monitoring

```python
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

# Performance monitoring
import time
from functools import wraps

def monitor_performance(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        start_time = time.time()
        try:
            result = await func(*args, **kwargs)
            execution_time = time.time() - start_time
            logger.info(f"{func.__name__} executed in {execution_time:.2f}s")
            return result
        except Exception as e:
            logger.error(f"Error in {func.__name__}: {str(e)}")
            raise
    return wrapper

@router.get("/users/")
@monitor_performance
async def get_users():
    # Endpoint implementation
    pass
```

### Error Tracking

```python
# Custom exception handling
class BrandFlowException(Exception):
    """Base exception for BrandFlow application."""
    pass

class UserNotFoundError(BrandFlowException):
    """Raised when user is not found."""
    pass

# Global exception handler
@app.exception_handler(BrandFlowException)
async def brandflow_exception_handler(request: Request, exc: BrandFlowException):
    logger.error(f"BrandFlow error: {str(exc)}")
    return JSONResponse(
        status_code=400,
        content={"detail": str(exc)}
    )
```

## Documentation Standards

### Code Documentation

```python
def create_user(user_data: UserCreate, db: AsyncSession) -> User:
    """
    Create a new user in the system.
    
    This function creates a new user with the provided data,
    validates the input, and stores it in the database.
    
    Args:
        user_data: User creation data containing name, email, and password
        db: Database session for transaction handling
        
    Returns:
        User: The created user instance with assigned ID
        
    Raises:
        ValueError: If email already exists or validation fails
        DatabaseError: If database operation fails
        
    Example:
        >>> user_data = UserCreate(name="John", email="john@example.com")
        >>> user = create_user(user_data, db)
        >>> print(user.id)
        1
    """
    # Function implementation
```

### API Documentation

```python
@router.post("/users/", response_model=UserResponse, status_code=201)
async def create_user(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Create a new user account.
    
    Creates a new user with the provided information. Email must be unique.
    Password will be hashed before storage.
    
    - **name**: User's full name (required)
    - **email**: Valid email address (required, unique)
    - **password**: Minimum 8 characters (required)
    - **role**: User role (optional, defaults to 'staff')
    """
    # Implementation
```

## Contribution Guidelines

### Before Contributing

1. Read the documentation thoroughly
2. Set up development environment
3. Run existing tests to ensure setup is correct
4. Check issue tracker for existing work

### Making Changes

1. Create feature branch from `develop`
2. Write tests for new functionality
3. Ensure all tests pass
4. Update documentation as needed
5. Follow code style guidelines
6. Create pull request with detailed description

### Code Review Process

**Review Checklist:**
- [ ] Code follows established patterns
- [ ] Tests are comprehensive and passing
- [ ] Documentation is updated
- [ ] No security vulnerabilities introduced
- [ ] Performance impact is acceptable
- [ ] BREAKING CHANGES are documented

**Review Timeline:**
- Initial review within 1 business day
- Follow-up reviews within same day
- Final approval and merge within 2 business days

This development guide ensures consistent, high-quality code across the BrandFlow project while maintaining security, performance, and maintainability standards.