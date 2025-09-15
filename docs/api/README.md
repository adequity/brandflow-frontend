# API Documentation

## Overview

The BrandFlow API is built with FastAPI and provides comprehensive endpoints for campaign management, user authentication, purchase requests, and more. The API supports both development (SQLite) and production (PostgreSQL) databases.

## Base URLs

- **Development**: `http://localhost:8000`
- **Production**: `https://brandflow-backend.railway.app`

## Authentication

The API uses JWT (JSON Web Token) based authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-access-token>
```

## API Endpoints Overview

### Authentication Endpoints
- `POST /api/auth/login` - User login with form data
- `POST /api/auth/login-json` - User login with JSON data
- `POST /api/auth/logout` - User logout and token blacklist
- `POST /api/auth/refresh` - Refresh access token (planned)

### User Management
- `GET /api/users/` - Get all users
- `POST /api/users/` - Create new user
- `GET /api/users/{user_id}` - Get specific user
- `PUT /api/users/{user_id}` - Update user
- `DELETE /api/users/{user_id}` - Delete user
- `GET /api/users/me` - Get current user info

### Campaign Management
- `GET /api/campaigns/` - Get campaigns with filtering
- `POST /api/campaigns/` - Create new campaign
- `GET /api/campaigns/{campaign_id}` - Get specific campaign
- `PUT /api/campaigns/{campaign_id}` - Update campaign
- `DELETE /api/campaigns/{campaign_id}` - Delete campaign

### Purchase Requests
- `GET /api/purchase-requests/` - Get purchase requests
- `POST /api/purchase-requests/` - Create new request
- `PUT /api/purchase-requests/{request_id}` - Update request
- `PATCH /api/purchase-requests/{request_id}/status` - Update status
- `DELETE /api/purchase-requests/{request_id}` - Delete request

### Company & Assets
- `GET /api/company/logo` - Get company logo
- `POST /api/company/logo` - Upload company logo
- `DELETE /api/company/logo` - Delete company logo

### Products & Work Types
- `GET /api/products/` - Get all products
- `POST /api/products/` - Create product
- `PUT /api/products/{product_id}` - Update product
- `DELETE /api/products/{product_id}` - Delete product
- `GET /api/work-types/` - Get work types
- `POST /api/work-types/` - Create work type

### Notifications
- `GET /api/notifications/` - Get user notifications
- `POST /api/notifications/mark-read` - Mark notifications as read

### File Management
- `POST /api/files/upload` - Upload files
- `GET /api/files/{file_id}` - Get file
- `DELETE /api/files/{file_id}` - Delete file

### Dashboard & Analytics
- `GET /api/dashboard/summary` - Dashboard summary
- `GET /api/dashboard/charts` - Chart data
- `GET /api/dashboard/recent-activities` - Recent activities
- `GET /api/dashboard-simple/` - Simple dashboard data

### System & Monitoring
- `GET /api/system/health` - Health check
- `GET /api/monitoring/system` - System metrics
- `GET /api/performance/metrics` - Performance metrics
- `GET /api/cache/clear` - Clear cache

## Detailed Endpoint Documentation

### Authentication

#### POST /api/auth/login-json

Authenticate user with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "user@example.com",
    "role": "직원",
    "company": "Example Company",
    "contact": "+1234567890",
    "incentive_rate": 0.05,
    "status": "활성",
    "is_active": true,
    "created_at": "2025-09-14T00:00:00Z",
    "updated_at": "2025-09-14T00:00:00Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid credentials
- `400 Bad Request` - Inactive account

### User Management

#### GET /api/users/

Get list of users with optional filtering and pagination.

**Query Parameters:**
- `skip` (integer, optional): Number of users to skip (default: 0)
- `limit` (integer, optional): Maximum number of users to return (default: 100)
- `role` (string, optional): Filter by user role

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "user@example.com",
      "role": "직원",
      "company": "Example Company",
      "contact": "+1234567890",
      "incentive_rate": 0.05,
      "status": "활성",
      "is_active": true,
      "created_at": "2025-09-14T00:00:00Z",
      "updated_at": "2025-09-14T00:00:00Z"
    }
  ],
  "total": 1,
  "skip": 0,
  "limit": 100
}
```

#### POST /api/users/

Create a new user.

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "password123",
  "role": "직원",
  "company": "Example Company",
  "contact": "+1234567890",
  "incentive_rate": 0.05
}
```

**Response:**
```json
{
  "id": 2,
  "name": "Jane Smith",
  "email": "jane@example.com",
  "role": "직원",
  "company": "Example Company",
  "contact": "+1234567890",
  "incentive_rate": 0.05,
  "status": "휴면",
  "is_active": true,
  "created_at": "2025-09-14T00:00:00Z",
  "updated_at": "2025-09-14T00:00:00Z"
}
```

### Campaign Management

#### GET /api/campaigns/

Get campaigns with filtering and pagination.

**Query Parameters:**
- `viewerId` (integer, optional): Viewer user ID for filtering
- `viewerRole` (string, optional): Viewer role for filtering
- `page` (integer, optional): Page number (default: 1)
- `size` (integer, optional): Page size (default: 10)

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Summer Campaign 2025",
      "description": "Summer marketing campaign",
      "status": "진행중",
      "start_date": "2025-06-01T00:00:00Z",
      "end_date": "2025-08-31T00:00:00Z",
      "budget": 50000.0,
      "creator_id": 1,
      "created_at": "2025-09-14T00:00:00Z",
      "updated_at": "2025-09-14T00:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "size": 10,
  "total_pages": 1
}
```

#### POST /api/campaigns/

Create a new campaign.

**Request Body:**
```json
{
  "name": "Autumn Campaign 2025",
  "description": "Autumn marketing campaign",
  "start_date": "2025-09-01T00:00:00Z",
  "end_date": "2025-11-30T00:00:00Z",
  "budget": 75000.0
}
```

**Response:**
```json
{
  "id": 2,
  "name": "Autumn Campaign 2025",
  "description": "Autumn marketing campaign",
  "status": "계획",
  "start_date": "2025-09-01T00:00:00Z",
  "end_date": "2025-11-30T00:00:00Z",
  "budget": 75000.0,
  "creator_id": 1,
  "created_at": "2025-09-14T00:00:00Z",
  "updated_at": "2025-09-14T00:00:00Z"
}
```

### Purchase Requests

#### GET /api/purchase-requests/

Get purchase requests with filtering.

**Query Parameters:**
- `status` (string, optional): Filter by status
- `requester_id` (integer, optional): Filter by requester
- `skip` (integer, optional): Number of items to skip
- `limit` (integer, optional): Maximum number of items

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "title": "Marketing Materials",
      "description": "Purchase request for marketing materials",
      "amount": 1500.0,
      "status": "대기",
      "requester_id": 2,
      "approved_by": null,
      "approved_at": null,
      "created_at": "2025-09-14T00:00:00Z",
      "updated_at": "2025-09-14T00:00:00Z"
    }
  ],
  "total": 1,
  "skip": 0,
  "limit": 10
}
```

#### POST /api/purchase-requests/

Create a new purchase request.

**Request Body:**
```json
{
  "title": "Office Supplies",
  "description": "Purchase request for office supplies",
  "amount": 850.0
}
```

**Response:**
```json
{
  "id": 2,
  "title": "Office Supplies",
  "description": "Purchase request for office supplies",
  "amount": 850.0,
  "status": "대기",
  "requester_id": 1,
  "approved_by": null,
  "approved_at": null,
  "created_at": "2025-09-14T00:00:00Z",
  "updated_at": "2025-09-14T00:00:00Z"
}
```

### File Upload

#### POST /api/files/upload

Upload files to the system.

**Request:**
- Content-Type: `multipart/form-data`
- Body: File data

**Response:**
```json
{
  "filename": "document.pdf",
  "file_path": "/uploads/document_20250914_123456.pdf",
  "file_size": 1024000,
  "content_type": "application/pdf",
  "upload_time": "2025-09-14T12:34:56Z"
}
```

### Dashboard

#### GET /api/dashboard/summary

Get dashboard summary statistics.

**Response:**
```json
{
  "total_campaigns": 15,
  "active_campaigns": 8,
  "total_users": 25,
  "active_users": 23,
  "total_purchase_requests": 45,
  "pending_requests": 12,
  "total_budget": 250000.0,
  "spent_budget": 180000.0,
  "this_month_campaigns": 3,
  "last_month_campaigns": 2
}
```

## Error Handling

The API uses standard HTTP status codes and returns detailed error messages:

### Common Error Responses

#### 400 Bad Request
```json
{
  "detail": "Validation error message"
}
```

#### 401 Unauthorized
```json
{
  "detail": "Could not validate credentials"
}
```

#### 403 Forbidden
```json
{
  "detail": "Insufficient permissions"
}
```

#### 404 Not Found
```json
{
  "detail": "Resource not found"
}
```

#### 422 Unprocessable Entity
```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

#### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:
- **100 requests per minute** per IP address
- **10 requests per second** per IP address

## CORS Policy

The API allows cross-origin requests from specific domains:
- `https://brandflo.netlify.app`
- `https://brandflow-frontend.netlify.app`
- `https://adequate-brandflow.netlify.app`
- `https://adequity-brandflow.netlify.app`
- Local development servers (`localhost:3000`, `localhost:5173`, etc.)

## WebSocket Support

Real-time features are supported via WebSocket connections at:
- **Development**: `ws://localhost:8000/api/ws`
- **Production**: `wss://brandflow-backend.railway.app/api/ws`

## API Testing

You can test the API using:
- **Interactive Documentation**: Visit `/docs` endpoint for Swagger UI
- **Alternative Documentation**: Visit `/redoc` endpoint for ReDoc
- **Postman**: Import the API collection
- **curl**: Use command-line requests

### Example curl Commands

```bash
# Login
curl -X POST "http://localhost:8000/api/auth/login-json" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@brandflow.com", "password": "admin123"}'

# Get campaigns
curl -X GET "http://localhost:8000/api/campaigns/" \
  -H "Authorization: Bearer <your-token>"

# Create user
curl -X POST "http://localhost:8000/api/users/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{"name": "New User", "email": "newuser@example.com", "password": "password123", "role": "직원"}'
```

## SDK and Client Libraries

Currently, the frontend uses a custom API client located at `src/api/client.js`. Consider creating dedicated SDKs for other platforms as needed.

## Versioning

The current API version is v2.3.0. API versioning is handled through the application version rather than URL versioning.

## Support

For API issues or questions:
1. Check the troubleshooting guide
2. Review the error response details
3. Consult the development team
4. Check server logs for detailed error information