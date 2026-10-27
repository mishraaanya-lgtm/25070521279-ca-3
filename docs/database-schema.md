# Database Schema

The app uses MongoDB with Mongoose models in `server/src/models.js`.

## User

Stores authentication, profile, theme, notification, and calendar preferences.

```js
{
  name: String,
  email: String,
  passwordHash: String,
  avatarUrl: String,
  timezone: String,
  theme: "light" | "dark" | "system",
  fcmTokens: [String],
  calendarProvider: "none" | "google" | "apple" | "outlook"
}
```

## Subject

Stores exam details and nested syllabus topics.

```js
{
  userId: ObjectId,
  name: String,
  examDate: Date,
  difficulty: Number,
  availableHoursPerWeek: Number,
  color: String,
  topics: [{
    name: String,
    difficulty: Number,
    strength: "weak" | "medium" | "strong",
    progress: Number,
    estimatedHours: Number,
    completedAt: Date
  }]
}
```

## Plan

Stores generated AI timetables and adaptive reschedules.

```js
{
  userId: ObjectId,
  title: String,
  source: "ai" | "manual",
  summary: String,
  backlogRisk: Number,
  recommendations: [String],
  items: [{
    subject: String,
    topic: String,
    mode: String,
    startsAt: Date,
    endsAt: Date,
    priority: "low" | "medium" | "high",
    risk: "low" | "medium" | "high",
    status: "planned" | "done" | "missed" | "rescheduled"
  }]
}
```

## FocusSession

Stores Pomodoro cycles and focus analytics.

```js
{
  userId: ObjectId,
  subjectId: ObjectId,
  topicName: String,
  durationMinutes: Number,
  mode: "study" | "break",
  completed: Boolean
}
```

## Goal

Stores daily and weekly goals.

```js
{
  userId: ObjectId,
  title: String,
  type: "daily" | "weekly",
  targetHours: Number,
  targetDate: Date,
  completed: Boolean
}
```
