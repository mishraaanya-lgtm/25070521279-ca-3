import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 180 },
  project: { type: String, default: 'Personal', trim: true },
  status: { type: String, enum: ['To do', 'In progress', 'Done'], default: 'To do' },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  dueDate: { type: Date, default: null }
}, { timestamps: true });

export default mongoose.model('Task', taskSchema);
