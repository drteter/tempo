# UI/UX Design System

## Design Principles
1. **Progressive Disclosure**
   - Show the most important information first
   - Reveal complexity gradually
   - Keep primary actions visible, secondary actions in menus

2. **Calm Technology**
   - Minimize cognitive load
   - Use subtle animations and transitions
   - Avoid unnecessary notifications
   - Employ white space effectively

3. **Clear Hierarchy**
   - Important goals and habits should be immediately visible
   - Use visual weight to indicate priority
   - Group related items naturally

## Color System
### Primary Colors
- Primary: #4F46E5 (Indigo)
- Secondary: #10B981 (Emerald)
- Accent: #F59E0B (Amber)

### Semantic Colors
- Success: #10B981
- Celebration: #FFD700
- Warning: #F59E0B
- Error: #EF4444
- Info: #3B82F6

### Neutral Colors
- Background: #fbf9f2
- Surface: #f3f4f6
- Text Primary: #111827
- Text Secondary: #6B7280

## Typography
- Headings: Inter (sans-serif)
- Body: Inter (sans-serif)
- Monospace: JetBrains Mono (for data/numbers)

## Core Components

### Goal Cards
- Shows goal title, category, and progress
- Quick actions on hover
- Progress indicator appropriate to goal type
  - Habits: Streak/completion circles
  - Threshold Goals: Progress bar to minimum
  - Project Goals: Percentage complete
  - Vision Goals: Milestone markers

### Navigation
- Simple sidebar with collapsible categories
- Quick add button always accessible
- Search available from any screen

### Dashboard Layouts
1. **Overview Mode**
   - High-level view of all active goals
   - Key metrics and streaks
   - Recent activity

2. **Focus Mode**
   - Single goal or habit detail
   - Deep progress tracking
   - Related items and notes

3. **Planning Mode**
   - Weekly/monthly view
   - Goal setting and adjustment
   - Priority management

## User Flows

### Goal Creation
1. Click "+" button
2. Select goal type (shows brief explanation of each)
3. Fill basic details (title, category)
4. Add optional details (expandable sections)
5. Set tracking preferences
6. Confirm and create

### Daily Review
1. Open dashboard
2. See today's habits/tasks
3. Quick complete/update actions
4. Optional notes/reflection
5. See how I'm tracking against my weekly goals

### Weekly Planning
1. Review previous week
2. Set priorities for new week
3. Adjust goals if needed
4. Schedule key activities

## Responsive Design
- Desktop-optimized interface
  - Wide-screen layouts utilizing available space
  - Multi-column views for better information density
  - Hover states for quick actions
  - Keyboard shortcuts for power users
- Tablet-friendly adaptations
  - Collapsible sidebars
  - Responsive grid layouts
  - Touch-friendly tap targets
- Mobile support planned for future
  - Progressive enhancement approach
  - Core functionality will remain accessible
  - Mobile-specific features to be added later

## Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader friendly
- Sufficient color contrast
- Clear focus states

## Loading States
- Skeleton screens instead of spinners
- Optimistic UI updates
- Smooth transitions between states

## Empty States
- Helpful onboarding messages
- Suggested actions
- Visual illustrations

## Future Considerations
- Dark mode support
- Custom theme options
- Customizable dashboards
- Collaboration features