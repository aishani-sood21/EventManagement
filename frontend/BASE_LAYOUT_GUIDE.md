# Base Layout System - Usage Guide

## Overview
The base layout system provides a consistent, professional structure for all pages in the EventHub application. It includes predefined colors, typography, spacing, components, and utility classes.

## Key Features
- **CSS Variables** for consistent theming
- **Responsive Design** with mobile-first approach
- **Reusable Components** (cards, buttons, forms, badges, alerts)
- **Utility Classes** for quick styling
- **Accessibility** features built-in

---

## Page Structure

### Basic Page Template
```jsx
import '../styles/BaseLayout.css';

export default function YourPage() {
  return (
    <div className="page-container">
      <YourNavbar />
      
      <div className="content-wrapper">
        <section className="section">
          <div className="section-header">
            <h1 className="section-title">Page Title</h1>
            <p className="section-subtitle">Optional subtitle</p>
          </div>
          
          {/* Your content here */}
        </section>
      </div>
    </div>
  );
}
```

### Content Wrapper Variations
- `content-wrapper` - Default (max-width: 1280px)
- `content-wrapper-wide` - Wider layout (max-width: 1536px)
- `content-wrapper-narrow` - Narrower layout (max-width: 1024px)

---

## Components

### Cards
```jsx
<div className="card">
  <div className="card-header">
    <h3 className="card-title">Card Title</h3>
    <button className="btn btn-ghost">Action</button>
  </div>
  <div className="card-body">
    <p>Card content goes here</p>
  </div>
</div>
```

### Buttons
```jsx
{/* Primary Button */}
<button className="btn btn-primary">Primary Action</button>

{/* Secondary Button */}
<button className="btn btn-secondary">Secondary Action</button>

{/* Danger Button */}
<button className="btn btn-danger">Delete</button>

{/* Outline Button */}
<button className="btn btn-outline">Outline</button>

{/* Ghost Button */}
<button className="btn btn-ghost">Ghost</button>

{/* Disabled Button */}
<button className="btn btn-primary" disabled>Disabled</button>
```

### Forms
```jsx
<div className="form-group">
  <label className="form-label">Email Address</label>
  <input 
    type="email" 
    className="form-input" 
    placeholder="Enter email"
  />
  <p className="form-help">We'll never share your email</p>
</div>

<div className="form-group">
  <label className="form-label">Description</label>
  <textarea 
    className="form-textarea" 
    placeholder="Enter description"
  />
</div>

<div className="form-group">
  <label className="form-label">Category</label>
  <select className="form-select">
    <option>Option 1</option>
    <option>Option 2</option>
  </select>
</div>
```

### Badges
```jsx
<span className="badge badge-primary">Primary</span>
<span className="badge badge-success">Success</span>
<span className="badge badge-warning">Warning</span>
<span className="badge badge-danger">Danger</span>
<span className="badge badge-info">Info</span>
```

### Alerts
```jsx
<div className="alert alert-success">
  <span>✓</span>
  <div>
    <strong>Success!</strong> Your changes have been saved.
  </div>
</div>

<div className="alert alert-warning">
  <span>⚠</span>
  <div>
    <strong>Warning!</strong> Please review the information.
  </div>
</div>

<div className="alert alert-danger">
  <span>✕</span>
  <div>
    <strong>Error!</strong> Something went wrong.
  </div>
</div>

<div className="alert alert-info">
  <span>ℹ</span>
  <div>
    <strong>Info:</strong> New features are available.
  </div>
</div>
```

### Grid Layouts
```jsx
{/* 2 Column Grid */}
<div className="grid grid-2">
  <div className="card">Item 1</div>
  <div className="card">Item 2</div>
</div>

{/* 3 Column Grid */}
<div className="grid grid-3">
  <div className="card">Item 1</div>
  <div className="card">Item 2</div>
  <div className="card">Item 3</div>
</div>

{/* 4 Column Grid */}
<div className="grid grid-4">
  <div className="card">Item 1</div>
  <div className="card">Item 2</div>
  <div className="card">Item 3</div>
  <div className="card">Item 4</div>
</div>
```

### Loading State
```jsx
<div className="loading-container">
  <div className="loading-spinner"></div>
</div>
```

### Empty State
```jsx
<div className="empty-state">
  <div className="empty-state-icon">📭</div>
  <h3 className="empty-state-title">No Events Found</h3>
  <p className="empty-state-message">
    There are no events available at this time.
  </p>
  <button className="btn btn-primary">Create Event</button>
</div>
```

---

## CSS Variables

### Using CSS Variables
You can use any of the predefined CSS variables in your custom styles:

```css
.my-custom-element {
  color: var(--primary-color);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  transition: all var(--transition-base);
}
```

### Available Variable Categories
- **Colors**: `--primary-color`, `--secondary-color`, `--danger-color`, etc.
- **Spacing**: `--spacing-xs` to `--spacing-3xl`
- **Typography**: `--font-size-xs` to `--font-size-4xl`
- **Shadows**: `--shadow-sm` to `--shadow-xl`
- **Border Radius**: `--radius-sm` to `--radius-full`
- **Transitions**: `--transition-fast`, `--transition-base`, `--transition-slow`

---

## Utility Classes

### Text Utilities
```jsx
<p className="text-center">Centered text</p>
<p className="text-left">Left aligned</p>
<p className="text-right">Right aligned</p>
<p className="font-bold">Bold text</p>
<p className="font-semibold">Semibold text</p>
<p className="text-primary">Primary color</p>
<p className="text-danger">Danger color</p>
<p className="text-muted">Muted text</p>
```

### Flexbox Utilities
```jsx
<div className="flex items-center justify-between gap-md">
  <span>Left content</span>
  <span>Right content</span>
</div>

<div className="flex flex-col items-center gap-lg">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

### Spacing Utilities
```jsx
<div className="mb-lg">Margin bottom large</div>
<div className="mt-xl">Margin top extra large</div>
<div className="p-md">Padding medium</div>
```

### Other Utilities
```jsx
<div className="rounded shadow">Rounded with shadow</div>
<div className="rounded-lg shadow-lg">Large rounded with large shadow</div>
```

### Responsive Utilities
```jsx
<div className="mobile-hidden">Visible only on desktop</div>
<div className="desktop-hidden">Visible only on mobile</div>
```

---

## Color Palette

### Primary Colors
- Primary: `#6366f1` (Indigo)
- Secondary: `#10b981` (Green)
- Accent: `#f59e0b` (Amber)

### Status Colors
- Success: `#10b981` (Green)
- Warning: `#f59e0b` (Amber)
- Danger: `#ef4444` (Red)
- Info: `#3b82f6` (Blue)

### Neutral Colors
- Gray scale from `--gray-50` to `--gray-900`
- White: `--white`
- Black: `--black`

---

## Best Practices

### 1. Always Use the Page Container
```jsx
// ✓ Good
<div className="page-container">
  <Navbar />
  <div className="content-wrapper">
    {/* content */}
  </div>
</div>

// ✗ Bad
<div style={{padding: '20px'}}>
  {/* content */}
</div>
```

### 2. Use Sections for Content Grouping
```jsx
// ✓ Good
<div className="content-wrapper">
  <section className="section">
    <h2 className="section-title">Profile Information</h2>
    {/* content */}
  </section>
  
  <section className="section">
    <h2 className="section-title">Account Settings</h2>
    {/* content */}
  </section>
</div>
```

### 3. Prefer Utility Classes Over Inline Styles
```jsx
// ✓ Good
<div className="flex items-center gap-md mb-lg">

// ✗ Bad
<div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem'}}>
```

### 4. Use CSS Variables for Custom Styles
```css
/* ✓ Good */
.my-component {
  color: var(--primary-color);
  padding: var(--spacing-md);
}

/* ✗ Bad */
.my-component {
  color: #6366f1;
  padding: 16px;
}
```

### 5. Maintain Consistency
- Use predefined components (cards, buttons, forms)
- Use spacing utilities instead of custom margins/paddings
- Use color variables instead of hardcoded colors
- Use the grid system for layouts

---

## Examples

### Dashboard Page Structure
```jsx
export default function Dashboard() {
  return (
    <div className="page-container">
      <ParticipantNavbar />
      
      <div className="content-wrapper">
        {/* Stats Section */}
        <section className="section">
          <h2 className="section-title">Dashboard Overview</h2>
          <div className="grid grid-3">
            <div className="card">
              <h3 className="card-title">Total Events</h3>
              <p className="text-primary" style={{fontSize: '2rem'}}>24</p>
            </div>
            {/* More cards */}
          </div>
        </section>
        
        {/* Events List */}
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">Upcoming Events</h2>
            <button className="btn btn-primary">View All</button>
          </div>
          <div className="grid grid-2">
            {/* Event cards */}
          </div>
        </section>
      </div>
    </div>
  );
}
```

### Form Page Structure
```jsx
export default function CreateEvent() {
  return (
    <div className="page-container">
      <OrganizerNavbar />
      
      <div className="content-wrapper-narrow">
        <section className="section">
          <div className="section-header">
            <h1 className="section-title">Create New Event</h1>
            <p className="section-subtitle">Fill in the details below</p>
          </div>
          
          <form>
            <div className="form-group">
              <label className="form-label">Event Name</label>
              <input type="text" className="form-input" />
            </div>
            
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" />
            </div>
            
            <div className="flex gap-md justify-end">
              <button type="button" className="btn btn-ghost">Cancel</button>
              <button type="submit" className="btn btn-primary">Create Event</button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
```

---

## Mobile Responsiveness

The base layout is mobile-first and automatically adjusts:
- Content wrapper reduces padding on mobile
- Grid layouts become single column on mobile (< 768px)
- Sections have reduced padding on mobile
- Use `mobile-hidden` and `desktop-hidden` classes for responsive content

---

## Next Steps

Now you can start updating all your pages to use this base layout system:

1. Import `BaseLayout.css` (already imported globally in main.tsx)
2. Wrap page content in `page-container` div
3. Use `content-wrapper` for the main content area
4. Use `section` for content grouping
5. Use predefined components and utility classes
6. Replace custom styles with CSS variables

This will ensure consistency across all pages and make maintenance much easier!
