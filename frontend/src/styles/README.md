# Styles Directory

Global styling and design system configuration for the SafetyPro EHS platform.

## Design System

### Theme
The application uses a **futuristic dark theme** with glassmorphism effects:
- **Primary Colors**: Cyan (`#06B6D4`), Purple (`#8B5CF6`), Emerald (`#10B981`)
- **Surface Palette**: Dark grays with transparency (`bg-gray-900/80`, `bg-gray-800/60`)
- **Glass Effects**: `backdrop-blur-xl` with semi-transparent backgrounds
- **Neon Accents**: Glow effects via `shadow-lg shadow-cyan-500/20`

### Tailwind Configuration
- Custom colors defined in `tailwind.config.js` under `brand-*` and `surface-*` namespaces
- Responsive breakpoints follow mobile-first approach
- Dark mode is the default; light mode supported via ThemeProvider

### Typography
- **Headings**: Bold, gradient text (`bg-gradient-to-r from-cyan-400 to-purple-400`)
- **Body**: `text-gray-300` on dark surfaces
- **Labels/Captions**: `text-xs text-gray-500`

### Animation
- Framer Motion for page transitions and card animations
- CSS transitions for hover/focus states
- Skeleton loading placeholders in `SkeletonDark` component

### Component Patterns
- **Cards**: `bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl`
- **Buttons**: Gradient backgrounds with hover scale transforms
- **Inputs**: `bg-gray-900/50 border-gray-700 focus:border-cyan-500`
- **Badges**: Color-coded by status (green=active, amber=warning, red=critical)

## Global CSS
- Base styles in `src/index.css`
- PostCSS with Tailwind directives
- Custom scrollbar styles for dark theme
