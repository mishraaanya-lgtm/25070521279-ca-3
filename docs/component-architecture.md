# Component Architecture

The frontend is implemented in `client/src/main.jsx` as a compact demo app. For production, split the screen functions into this structure:

```text
client/src/
  app/
    App.jsx
    routes.jsx
  components/
    AppShell.jsx
    Topbar.jsx
    Metric.jsx
    ProgressLine.jsx
    charts/
      ProductivityChart.jsx
      SyllabusPie.jsx
      StudyHeatmap.jsx
  screens/
    AuthScreen.jsx
    Dashboard.jsx
    PlannerGenerator.jsx
    SubjectManager.jsx
    PomodoroFocus.jsx
    Analytics.jsx
    CalendarView.jsx
    SettingsProfile.jsx
  services/
    api.js
    notifications.js
    calendar.js
    offline.js
  state/
    plannerStore.js
    authStore.js
  styles/
    tokens.css
    global.css
```

Recommended production additions:

- React Router for screen routing.
- Zustand or Redux Toolkit for shared app state.
- TanStack Query for server cache and offline retries.
- Firebase Auth and FCM SDK for authentication and notifications.
- `react-to-print` or server-side PDF generation for timetable export.
- Google Calendar API OAuth for true calendar sync.
