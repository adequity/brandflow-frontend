# Frontend Components Documentation

## Overview

The BrandFlow frontend is built with React 18 and uses a component-based architecture. The application features role-based UI layouts, context-driven state management, and performance-optimized components.

## Component Architecture

### Directory Structure

```
src/
├── components/
│   ├── common/              # Shared utility components
│   ├── modals/              # Modal dialogs
│   ├── ui/                  # Basic UI components
│   ├── campaigns/           # Campaign-specific components
│   └── calendar/            # Calendar components
├── pages/                   # Page-level components
├── contexts/                # React Context providers
├── hooks/                   # Custom React hooks
├── utils/                   # Utility functions
└── api/                     # API client
```

## Core Components

### 1. App Component (`src/App.jsx`)

Main application component that handles routing and authentication.

**Features:**
- Route-based authentication
- Role-based navigation
- Session persistence
- Context providers setup

**Props:** None (root component)

**Usage:**
```jsx
import App from './App';
// Rendered at application root
```

### 2. Sidebar Component (`src/components/Sidebar.jsx`)

Navigation sidebar with menu items and logo display.

**Props:**
- `activePage` (string): Current active page identifier
- `setActivePage` (function): Function to change active page

**Features:**
- Memoized menu items for performance
- Icon-based navigation
- Active state highlighting
- Logo integration

**Usage:**
```jsx
import Sidebar from './components/Sidebar';

<Sidebar 
  activePage="dashboard" 
  setActivePage={setActivePage} 
/>
```

**Menu Items:**
- Dashboard (대시보드)
- Campaign Management (캠페인 관리)
- Purchase Requests (구매요청 관리)
- Order Management (발주 관리)
- Products (상품 관리)
- Sales (매출 관리)
- Monthly Incentives (월간 인센티브 관리)
- Calendar (일정 관리)
- Users (고객사/사용자 관리)
- System Settings (시스템 설정)

### 3. Header Component (`src/components/Header.jsx`)

Application header with user info and navigation.

**Props:**
- `user` (object): Current user information
- `onLogout` (function): Logout handler

**Features:**
- User profile display
- Logout functionality
- Notification bell
- Role-based header content

### 4. Dashboard Component (`src/pages/Dashboard.jsx`)

Main dashboard showing key metrics and statistics.

**Props:**
- `campaigns` (array): List of campaigns
- `activities` (array): Recent activities
- `onSeeAll` (function): Handler for "see all" actions
- `user` (object): Current user information

**Features:**
- Statistics cards
- Purchase request metrics
- Sales statistics
- Activity feed
- Role-based data filtering

**Statistics Displayed:**
- Total/Active campaigns
- Purchase request counts and amounts
- Sales revenue and margins
- User activity metrics

## Modal Components

### 1. NewCampaignModal (`src/components/modals/NewCampaignModal.jsx`)

Modal for creating new campaigns.

**Props:**
- `users` (array): List of users for assignment
- `onSave` (function): Save handler
- `onClose` (function): Close handler

**Features:**
- Form validation
- User assignment
- Budget formatting
- Invoice/payment tracking
- Role-based field visibility

**Form Fields:**
- Campaign name
- Budget (with number formatting)
- Notes
- Reminders
- Invoice/payment dates
- User assignment

### 2. PurchaseRequestModal (`src/components/modals/PurchaseRequestModal.jsx`)

Modal for creating and editing purchase requests.

**Features:**
- Request details form
- Amount validation
- File attachments
- Approval workflow integration

### 3. UserEditModal (`src/components/modals/UserEditModal.jsx`)

Modal for editing user information.

**Features:**
- User profile editing
- Role management
- Permission settings
- Form validation

## UI Components

### 1. LoadingSpinner (`src/components/ui/LoadingSpinner.jsx`)

Reusable loading indicator.

**Props:**
- `size` (string): Size variant ('small', 'medium', 'large')
- `color` (string): Color variant

**Usage:**
```jsx
import LoadingSpinner from './components/ui/LoadingSpinner';

<LoadingSpinner size="medium" color="blue" />
```

### 2. Toast System (`src/components/ui/Toast.jsx` & `ToastContainer.jsx`)

Notification system for user feedback.

**Features:**
- Multiple toast types (success, error, warning, info)
- Auto-dismiss functionality
- Stacking support
- Animation transitions

**Usage with Context:**
```jsx
import { useToast } from './contexts/ToastContext';

const { showSuccess, showError } = useToast();

showSuccess('Operation completed successfully');
showError('An error occurred');
```

### 3. StatusBadge (`src/components/common/StatusBadge.jsx`)

Status indicator component.

**Props:**
- `status` (string): Status text
- `variant` (string): Visual variant
- `size` (string): Size variant

**Usage:**
```jsx
import StatusBadge from './components/common/StatusBadge';

<StatusBadge status="활성" variant="success" size="small" />
```

## Context Providers

### 1. ToastContext (`src/contexts/ToastContext.jsx`)

Global toast notification management.

**Methods:**
- `showSuccess(message, duration)`: Show success toast
- `showError(message, duration)`: Show error toast
- `showWarning(message, duration)`: Show warning toast
- `showInfo(message, duration)`: Show info toast

### 2. NotificationContext (`src/contexts/NotificationContext.jsx`)

Real-time notification management.

**Features:**
- WebSocket integration
- Notification counting
- Read/unread status
- Real-time updates

### 3. OrderContext (`src/contexts/OrderContext.jsx`)

Order and purchase request state management.

**Features:**
- Order state tracking
- Request workflow management
- Status updates

## Custom Hooks

### 1. useModal (`src/hooks/useModal.js`)

Modal state management hook.

**Returns:**
- `isOpen` (boolean): Modal open state
- `openModal` (function): Open modal function
- `closeModal` (function): Close modal function

**Usage:**
```jsx
import useModal from './hooks/useModal';

const { isOpen, openModal, closeModal } = useModal();
```

### 2. useLogo (`src/hooks/useLogo.js`)

Company logo management hook.

**Features:**
- Logo upload/delete
- Logo state management
- Error handling

### 3. useImagePaste (`src/hooks/useImagePaste.js`)

Image paste functionality hook.

**Features:**
- Clipboard image detection
- File processing
- Error handling

## Page Components

### 1. Login (`src/pages/Login.jsx`)

User authentication page.

**Props:**
- `onLogin` (function): Login success handler

**Features:**
- Form validation
- Error handling
- Remember me functionality
- Role-based redirect

### 2. CampaignManagement (`src/pages/CampaignManagement.jsx`)

Campaign management interface.

**Features:**
- Campaign listing
- CRUD operations
- Filtering and search
- Bulk actions
- Role-based permissions

### 3. UserManagement (`src/pages/UserManagement.jsx`)

User administration interface.

**Features:**
- User listing and management
- Role assignment
- Bulk operations
- User creation/editing

### 4. PurchaseRequestsPage (`src/pages/PurchaseRequestsPage.jsx`)

Purchase request management.

**Features:**
- Request listing
- Approval workflow
- Status tracking
- File attachments

## Utility Components

### 1. LazyRoutes (`src/components/LazyRoutes.jsx`)

Dynamic route loading for performance optimization.

**Features:**
- Code splitting
- Lazy loading
- Error boundaries
- Loading states

### 2. LogoDisplay (`src/components/LogoDisplay.jsx`)

Company logo display component.

**Props:**
- `size` (string): Logo size variant
- `className` (string): Additional CSS classes

### 3. ImageViewer (`src/components/common/ImageViewer.jsx`)

Image viewing modal component.

**Features:**
- Full-screen image viewing
- Zoom functionality
- Navigation controls

## Styling System

### Tailwind CSS Configuration

The application uses Tailwind CSS for styling with custom configuration:

**Color Palette:**
- Primary: Blue variations
- Success: Green variations
- Warning: Yellow variations
- Error: Red variations
- Gray: Neutral variations

**Component Classes:**
- Buttons: Consistent button styling
- Cards: Shadow and border styling
- Forms: Input and validation styling
- Tables: Data table styling

### Responsive Design

The application is fully responsive with breakpoints:
- `sm`: 640px and up
- `md`: 768px and up
- `lg`: 1024px and up
- `xl`: 1280px and up

### Dark Mode Support

Currently not implemented but structure allows for easy addition.

## Performance Optimizations

### 1. Component Memoization

Critical components use `React.memo` for optimization:
```jsx
const Sidebar = React.memo(({ activePage, setActivePage }) => {
  // Component implementation
});
```

### 2. Callback Optimization

Event handlers use `useCallback` for performance:
```jsx
const handleMenuClick = useCallback((menuId) => {
  setActivePage(menuId);
}, [setActivePage]);
```

### 3. Memoized Values

Expensive calculations use `useMemo`:
```jsx
const menus = useMemo(() => [
  // Menu configuration
], []);
```

### 4. Lazy Loading

Components are lazy loaded using dynamic imports:
```jsx
const LazyComponent = lazy(() => import('./Component'));
```

## Data Flow Architecture

### 1. State Management

**Local State:** Component-specific state using `useState`
**Global State:** Context providers for shared state
**Server State:** API calls with caching

### 2. API Integration

Centralized API client (`src/api/client.js`) handles:
- Authentication headers
- Error handling
- Request/response transformation
- Base URL configuration

### 3. Error Handling

**Component Level:** Error boundaries for component errors
**API Level:** Centralized error handling in API client
**User Level:** Toast notifications for user feedback

## Development Guidelines

### 1. Component Creation

```jsx
import React from 'react';
import PropTypes from 'prop-types';

const MyComponent = ({ prop1, prop2 }) => {
  return (
    <div className="component-wrapper">
      {/* Component content */}
    </div>
  );
};

MyComponent.propTypes = {
  prop1: PropTypes.string.required,
  prop2: PropTypes.func
};

export default MyComponent;
```

### 2. Performance Best Practices

- Use `React.memo` for expensive components
- Implement `useCallback` for event handlers
- Use `useMemo` for expensive calculations
- Avoid inline object creation in props
- Implement proper key props for lists

### 3. Accessibility Guidelines

- Use semantic HTML elements
- Implement ARIA labels and roles
- Ensure keyboard navigation
- Maintain color contrast ratios
- Provide alternative text for images

### 4. Testing Strategy

- Unit tests for individual components
- Integration tests for user workflows
- Performance testing for optimization
- Accessibility testing for compliance

## Common Patterns

### 1. Modal Pattern

```jsx
const MyModal = ({ isOpen, onClose, onSave }) => {
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {/* Modal content */}
        <button onClick={onClose}>Close</button>
        <button onClick={onSave}>Save</button>
      </div>
    </div>
  );
};
```

### 2. Form Pattern

```jsx
const MyForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  
  const handleSubmit = (e) => {
    e.preventDefault();
    // Validation logic
    if (isValid) {
      onSubmit(formData);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
};
```

### 3. List Pattern

```jsx
const MyList = ({ items, onItemClick }) => {
  return (
    <div className="list-container">
      {items.map(item => (
        <div key={item.id} onClick={() => onItemClick(item)}>
          {item.name}
        </div>
      ))}
    </div>
  );
};
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Build Configuration

The application uses Vite for build optimization:
- Hot module replacement in development
- Tree shaking for production builds
- Asset optimization
- Code splitting