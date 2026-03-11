# Layouts Directory

Reusable layout components that define the structural shells for different sections of the SafetyPro EHS platform.

## Planned Layouts

### `MainLayout`
The primary application shell used across all authenticated pages:
- **NavigationBar** (top) – Search, notifications, user menu, hamburger for mobile
- **Content Area** (center) – Page-specific content with scroll management
- **BottomTabNavigation** (bottom, mobile) – Quick access to core sections
- **Floating Elements** – AI Safety Assistant, Feedback Widget, Onboarding Walkthrough

### `AuthLayout`
Centered layout for login, signup, and password reset flows:
- Gradient background with brand logo
- Form card with glassmorphism styling
- Social login options and legal links

### `DashboardLayout`
Extended layout for data-heavy pages (analytics, reports):
- Sidebar filter panels (collapsible)
- Breadcrumb navigation
- Tab-based sub-navigation
- Export/print action bar

### `PrintLayout`
Clean, minimal layout for print-friendly report views:
- No navigation chrome
- Optimized typography for paper
- Page break controls

## Conventions
- Layouts accept `children` as their primary prop
- Use `<Outlet />` from React Router for nested route rendering
- Responsive: mobile-first with breakpoints at `sm`, `md`, `lg`, `xl`
- All layouts respect the current theme (dark/light) via ThemeProvider
