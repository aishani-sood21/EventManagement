# CSS Architecture Guide

## Overview
The application uses a **base layout + page-specific CSS** architecture for maintainable and consistent styling.

## File Structure

```
frontend/src/
├── styles/
│   ├── BaseLayout.css         # Global base styles (imported in main.tsx)
│   ├── ParticipantNavbar.css  # Participant navbar styles
│   ├── Dashboard.css          # Dashboard-specific styles
│   └── [PageName].css         # Other page-specific styles
└── pages/
    └── Dashboard.tsx          # Imports '../styles/Dashboard.css'
```

## Architecture Principles

### 1. BaseLayout.css - Global Foundation
**Location**: `src/styles/BaseLayout.css`  
**Imported**: Once in `main.tsx` - available to all components  
**Contains**:
- CSS variables (colors, spacing, typography)
- Global resets
- Page containers (`.page-container`, `.content-wrapper`)
- Reusable components (`.card`, `.btn`, `.form-*`, `.badge`, `.alert`)
- Grid layouts (`.grid`, `.grid-2`, `.grid-3`, `.grid-4`)
- Utility classes (`.flex`, `.text-center`, `.mb-lg`, etc.)

### 2. Page-Specific CSS Files
**Location**: `src/styles/[PageName].css`  
**Imported**: In each individual page component  
**Contains**:
- Styles specific to that page only
- Custom layouts for that page
- Overrides if needed

### 3. Component-Specific CSS Files
**Location**: `src/styles/[ComponentName].css`  
**Imported**: In the component file  
**Contains**:
- Styles for reusable components (navbars, modals, etc.)

## How to Style a New Page

### Step 1: Use BaseLayout Classes
```tsx
import { useEffect, useState } from 'react';
import '../styles/YourPage.css'; // Import page-specific CSS

export default function YourPage() {
  return (
    <div className="page-container">
      <YourNavbar />
      
      <div className="content-wrapper">
        <div className="dashboard-header"> {/* Custom class if needed */}
          <h2 className="section-title">Page Title</h2>
          <button className="btn btn-primary">Action</button>
        </div>
        
        <div className="grid grid-3">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Card Title</h3>
              <span className="badge badge-success">Status</span>
            </div>
            <div className="card-body">
              <p className="your-custom-class">Content</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Step 2: Create Page-Specific CSS
```css
/* YourPage.css */

/* Only add styles that are unique to this page */
.your-custom-class {
  color: var(--gray-600);
  margin-bottom: var(--spacing-lg);
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
}
```

## Best Practices

### ✅ DO:
1. **Use BaseLayout classes first** - `btn`, `card`, `grid`, etc.
2. **Use CSS variables** - `var(--primary-color)`, `var(--spacing-lg)`
3. **Create page-specific classes** for unique layouts
4. **Keep specificity low** - avoid deep nesting
5. **Use semantic class names** - `.event-description`, `.banner-title`
6. **Import page CSS in the component** - `import '../styles/Dashboard.css'`

### ❌ DON'T:
1. **Don't use inline styles** - `style={{ marginBottom: '1rem' }}`
2. **Don't duplicate BaseLayout classes** in page CSS
3. **Don't use hardcoded values** - Use CSS variables instead
4. **Don't override base classes** - Create new classes instead
5. **Don't import BaseLayout.css** in pages - It's already global

## Example: Dashboard Page

### Dashboard.tsx (Component)
```tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import ParticipantNavbar from '../components/ParticipantNavbar';
import '../styles/Dashboard.css'; // Page-specific styles

export default function Dashboard() {
  // ... component logic ...
  
  return (
    <div className="page-container">          {/* Base class */}
      <ParticipantNavbar />
      
      <div className="content-wrapper">       {/* Base class */}
        <div className="dashboard-header">    {/* Custom class */}
          <h2 className="section-title">Events</h2>  {/* Base class */}
          <button className="btn btn-primary">      {/* Base class */}
            Refresh
          </button>
        </div>

        <div className="grid grid-3">         {/* Base class */}
          <div className="card">              {/* Base class */}
            <div className="card-header">     {/* Base class */}
              <h3 className="card-title">Event Name</h3>
              <span className="badge badge-success">Active</span>
            </div>
            <div className="card-body">       {/* Base class */}
              <p className="event-description">Description</p>  {/* Custom class */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Dashboard.css (Page Styles)
```css
/* Only custom styles for Dashboard */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
}

.event-description {
  color: var(--gray-600);
  line-height: 1.5;
}
```

## Converting Existing Pages

### Before (With Inline Styles):
```tsx
<div style={{ display: 'flex', marginBottom: '2rem' }}>
  <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Title</h2>
  <button style={{ background: '#6366f1', color: 'white', padding: '0.75rem' }}>
    Button
  </button>
</div>
```

### After (Using Base Layout):
```tsx
<div className="flex justify-between mb-xl">
  <h2 className="section-title">Title</h2>
  <button className="btn btn-primary">Button</button>
</div>
```

## Benefits of This Approach

1. **Consistency** - All pages use the same components and spacing
2. **Maintainability** - Change one variable, update entire app
3. **Performance** - CSS is cached, not recalculated for each inline style
4. **Readability** - Clean JSX without style clutter
5. **Responsiveness** - Built-in mobile breakpoints
6. **Theming** - Easy to change colors globally via CSS variables
7. **Developer Experience** - Predictable class names

## Quick Reference

### Common Base Classes:
- **Layout**: `.page-container`, `.content-wrapper`, `.section`
- **Components**: `.card`, `.btn`, `.badge`, `.alert`, `.empty-state`
- **Grid**: `.grid`, `.grid-2`, `.grid-3`, `.grid-4`
- **Forms**: `.form-input`, `.form-label`, `.form-group`
- **Utilities**: `.flex`, `.text-center`, `.mb-lg`, `.p-md`

### Common CSS Variables:
- **Colors**: `--primary-color`, `--secondary-color`, `--gray-600`
- **Spacing**: `--spacing-sm`, `--spacing-md`, `--spacing-lg`, `--spacing-xl`
- **Typography**: `--font-size-sm`, `--font-size-base`, `--font-size-xl`
- **Effects**: `--shadow-md`, `--radius-lg`, `--transition-base`

## Next Steps

1. ✅ **Dashboard.tsx** - Already converted
2. ⏳ **Other participant pages** - Convert next (Profile, BrowseEvents, Clubs, etc.)
3. ⏳ **Organizer pages** - Convert after participant pages
4. ⏳ **Admin pages** - Convert last

For each page:
1. Remove all inline styles
2. Use base layout classes
3. Create page-specific CSS file for unique styles
4. Import the CSS file in the component
