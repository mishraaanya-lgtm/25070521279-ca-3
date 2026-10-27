import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { z } from 'zod';
import mongoose from 'mongoose';
import { connectDb } from './lib/db.js';
import { requireAuth, signToken } from './middleware/auth.js';
import { User, Subject, Plan, FocusSession, Goal } from './models.js';
import { generateStudyPlan, predictBacklogRisk } from './services/ai.js';

const app = express();
const port = process.env.PORT || 4000;

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => res.status(mongoose.connection.readyState === 1 ? 200 : 503).json({ ok: mongoose.connection.readyState === 1, database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected', service: 'flexi-api' }));

app.post('/api/auth/signup', async (req, res, next) => {
  try {
    const input = z.object({ name: z.string().min(2), email: z.string().email(), password: z.string().min(8) }).parse(req.body);
    const user = await User.createWithPassword(input);
    res.status(201).json({ token: signToken(user), user: user.safeProfile() });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const input = z.object({ email: z.string().email(), password: z.string().min(1) }).parse(req.body);
    const user = await User.findOne({ email: input.email.toLowerCase() });
    if (!user || !(await user.verifyPassword(input.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    res.json({ token: signToken(user), user: user.safeProfile() });
  } catch (error) {
    next(error);
  }
});

app.get('/api/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json({ user: user.safeProfile() });
});

app.get('/api/subjects', requireAuth, async (req, res) => {
  const subjects = await Subject.find({ userId: req.user.id }).sort({ examDate: 1 });
  res.json({ subjects });
});

app.post('/api/subjects', requireAuth, async (req, res, next) => {
  try {
    const input = subjectSchema.parse(req.body);
    const subject = await Subject.create({ ...input, userId: req.user.id });
    res.status(201).json({ subject });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/subjects/:id/topics/:topicId', requireAuth, async (req, res, next) => {
  try {
    const input = z.object({ progress: z.number().min(0).max(100), strength: z.enum(['weak', 'medium', 'strong']).optional() }).parse(req.body);
    const subject = await Subject.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id, 'topics._id': req.params.topicId },
      { $set: { 'topics.$.progress': input.progress, ...(input.strength ? { 'topics.$.strength': input.strength } : {}) } },
      { new: true }
    );
    res.json({ subject });
  } catch (error) {
    next(error);
  }
});

app.post('/api/plans/generate', requireAuth, async (req, res, next) => {
  try {
    const input = planInputSchema.parse(req.body);
    const subjects = await Subject.find({ userId: req.user.id });
    const missedTasks = input.missedTaskIds || [];
    const planPayload = await generateStudyPlan({ ...input, subjects, missedTasks });
    const plan = await Plan.create({ userId: req.user.id, ...planPayload, source: 'ai' });
    res.status(201).json({ plan });
  } catch (error) {
    next(error);
  }
});

app.get('/api/plans/current', requireAuth, async (req, res) => {
  const plan = await Plan.findOne({ userId: req.user.id }).sort({ createdAt: -1 });
  res.json({ plan });
});

app.post('/api/focus-sessions', requireAuth, async (req, res, next) => {
  try {
    const input = z.object({
      subjectId: z.string().optional(),
      topicName: z.string().optional(),
      durationMinutes: z.number().min(1),
      mode: z.enum(['study', 'break']),
      completed: z.boolean()
    }).parse(req.body);
    const session = await FocusSession.create({ ...input, userId: req.user.id });
    res.status(201).json({ session });
  } catch (error) {
    next(error);
  }
});

app.get('/api/analytics', requireAuth, async (req, res) => {
  const [subjects, sessions, goals] = await Promise.all([
    Subject.find({ userId: req.user.id }),
    FocusSession.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(200),
    Goal.find({ userId: req.user.id }).sort({ targetDate: 1 }).limit(20)
  ]);
  res.json({ analytics: buildAnalytics(subjects, sessions, goals) });
});

app.post('/api/goals', requireAuth, async (req, res, next) => {
  try {
    const input = z.object({
      title: z.string().min(2),
      type: z.enum(['daily', 'weekly']),
      targetHours: z.number().min(0).optional(),
      targetDate: z.coerce.date()
    }).parse(req.body);
    const goal = await Goal.create({ ...input, userId: req.user.id });
    res.status(201).json({ goal });
  } catch (error) {
    next(error);
  }
});

app.post('/api/notifications/register', requireAuth, async (req, res, next) => {
  try {
    const input = z.object({ fcmToken: z.string().min(10) }).parse(req.body);
    await User.findByIdAndUpdate(req.user.id, { $addToSet: { fcmTokens: input.fcmToken } });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.get('/api/calendar/export.ics', requireAuth, async (req, res) => {
  const plan = await Plan.findOne({ userId: req.user.id }).sort({ createdAt: -1 });
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//StudyOS//Smart Study Planner//EN'];
  for (const item of plan?.items || []) {
    lines.push('BEGIN:VEVENT', `SUMMARY:${item.subject} - ${item.topic}`, `DESCRIPTION:${item.mode}`, `DTSTART:${toIcsDate(item.startsAt)}`, `DTEND:${toIcsDate(item.endsAt)}`, 'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  res.setHeader('Content-Type', 'text/calendar');
  res.send(lines.join('\r\n'));
});

app.get('/api/ai/backlog-risk', requireAuth, async (req, res) => {
  const subjects = await Subject.find({ userId: req.user.id });
  const sessions = await FocusSession.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(30);
  res.json({ risk: predictBacklogRisk(subjects, sessions) });
});

app.use((error, _req, res, _next) => {
  if (error.name === 'ZodError') return res.status(400).json({ message: 'Validation failed', issues: error.issues });
  if (error.code === 11000) return res.status(409).json({ message: 'Record already exists' });
  console.error(error);
  res.status(500).json({ message: 'Server error' });
});

await connectDb();
app.listen(port, () => console.log(`FLEXI API running on :${port}`));

const subjectSchema = z.object({
  name: z.string().min(2),
  examDate: z.coerce.date(),
  difficulty: z.number().min(1).max(10),
  availableHoursPerWeek: z.number().min(1),
  color: z.string().default('#5b8def'),
  topics: z.array(z.object({
    name: z.string().min(2),
    difficulty: z.number().min(1).max(10),
    strength: z.enum(['weak', 'medium', 'strong']),
    progress: z.number().min(0).max(100).default(0),
    estimatedHours: z.number().min(0)
  }))
});

const planInputSchema = z.object({
  availableHoursPerDay: z.number().min(1).max(16),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  preferredSessionMinutes: z.number().min(15).max(120).default(50),
  missedTaskIds: z.array(z.string()).optional(),
  goals: z.array(z.string()).optional()
});

function buildAnalytics(subjects, sessions, goals) {
  const topics = subjects.flatMap((subject) => subject.topics);
  const progress = topics.length ? Math.round(topics.reduce((sum, topic) => sum + topic.progress, 0) / topics.length) : 0;
  const completedMinutes = sessions.filter((s) => s.completed && s.mode === 'study').reduce((sum, s) => sum + s.durationMinutes, 0);
  const streak = calculateStreak(sessions);
  return {
    syllabusProgress: progress,
    focusMinutes: completedMinutes,
    focusHours: Number((completedMinutes / 60).toFixed(1)),
    sessions,
    focusScore: Math.min(99, Math.round(progress * 0.45 + streak * 4 + completedMinutes / 90)),
    backlogRisk: predictBacklogRisk(subjects, sessions),
    goals,
    weakTopics: subjects.flatMap((subject) => subject.topics.filter((topic) => topic.strength === 'weak').map((topic) => ({ name: topic.name, subject: subject.name })))
  };
}

function calculateStreak(sessions) {
  const days = new Set(sessions.filter((s) => s.completed).map((s) => new Date(s.createdAt).toISOString().slice(0, 10)));
  let streak = 0;
  for (let i = 0; i < 365; i += 1) {
    const day = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    if (!days.has(day)) break;
    streak += 1;
  }
  return streak;
}

function toIcsDate(date) {
  return new Date(date).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}
