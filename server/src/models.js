import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  avatarUrl: String,
  timezone: { type: String, default: 'Asia/Calcutta' },
  theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
  fcmTokens: [String],
  calendarProvider: { type: String, enum: ['none', 'google', 'apple', 'outlook'], default: 'none' }
}, { timestamps: true });

userSchema.statics.createWithPassword = async function createWithPassword({ name, email, password }) {
  const passwordHash = await bcrypt.hash(password, 12);
  return this.create({ name, email, passwordHash });
};

userSchema.methods.verifyPassword = function verifyPassword(password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.methods.safeProfile = function safeProfile() {
  return { id: this._id, name: this.name, email: this.email, avatarUrl: this.avatarUrl, timezone: this.timezone, theme: this.theme };
};

const topicSchema = new Schema({
  name: { type: String, required: true },
  difficulty: { type: Number, min: 1, max: 10, default: 5 },
  strength: { type: String, enum: ['weak', 'medium', 'strong'], default: 'medium' },
  progress: { type: Number, min: 0, max: 100, default: 0 },
  estimatedHours: { type: Number, default: 1 },
  completedAt: Date
});

const subjectSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  examDate: { type: Date, required: true },
  difficulty: { type: Number, min: 1, max: 10, default: 5 },
  availableHoursPerWeek: { type: Number, default: 7 },
  color: { type: String, default: '#5b8def' },
  topics: [topicSchema]
}, { timestamps: true });

const planItemSchema = new Schema({
  subject: String,
  topic: String,
  mode: String,
  startsAt: Date,
  endsAt: Date,
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  risk: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  status: { type: String, enum: ['planned', 'done', 'missed', 'rescheduled'], default: 'planned' }
});

const planSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, default: 'AI Study Plan' },
  source: { type: String, enum: ['ai', 'manual'], default: 'ai' },
  summary: String,
  backlogRisk: { type: Number, min: 0, max: 100, default: 0 },
  recommendations: [String],
  items: [planItemSchema]
}, { timestamps: true });

const focusSessionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  subjectId: { type: Schema.Types.ObjectId, ref: 'Subject' },
  topicName: String,
  durationMinutes: Number,
  mode: { type: String, enum: ['study', 'break'], required: true },
  completed: { type: Boolean, default: false }
}, { timestamps: true });

const goalSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: String,
  type: { type: String, enum: ['daily', 'weekly'], required: true },
  targetHours: Number,
  targetDate: Date,
  completed: { type: Boolean, default: false }
}, { timestamps: true });

export const User = model('User', userSchema);
export const Subject = model('Subject', subjectSchema);
export const Plan = model('Plan', planSchema);
export const FocusSession = model('FocusSession', focusSessionSchema);
export const Goal = model('Goal', goalSchema);
