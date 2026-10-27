# API Routes

Base URL: `/api`

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/health` | API health check |
| POST | `/auth/signup` | Create user and return JWT |
| POST | `/auth/login` | Login and return JWT |
| GET | `/me` | Current user profile |
| GET | `/subjects` | List subjects and topics |
| POST | `/subjects` | Create subject with topics |
| PATCH | `/subjects/:id/topics/:topicId` | Update topic progress or strength |
| POST | `/plans/generate` | Generate adaptive AI timetable |
| GET | `/plans/current` | Fetch latest timetable |
| POST | `/focus-sessions` | Save Pomodoro study or break session |
| GET | `/analytics` | Focus score, backlog risk, streak, weak topics |
| POST | `/goals` | Create daily or weekly goal |
| POST | `/notifications/register` | Save Firebase Cloud Messaging token |
| GET | `/calendar/export.ics` | Export current plan as calendar file |
| GET | `/ai/backlog-risk` | Predict current backlog risk |

Authenticated routes require:

```http
Authorization: Bearer <jwt>
```
