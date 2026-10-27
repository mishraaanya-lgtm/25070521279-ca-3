import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import Task from './models/Task.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }));
app.get('/api/tasks', async (_req, res) => {
  try { res.json(await Task.find().sort({ createdAt: -1 })); }
  catch (error) { res.status(500).json({ message: 'Could not load tasks', error: error.message }); }
});
app.post('/api/tasks', async (req, res) => {
  try { res.status(201).json(await Task.create(req.body)); }
  catch (error) { res.status(400).json({ message: 'Could not create task', error: error.message }); }
});
app.patch('/api/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (error) { res.status(400).json({ message: 'Could not update task', error: error.message }); }
});
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.status(204).end();
  } catch (error) { res.status(400).json({ message: 'Could not delete task', error: error.message }); }
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`FLEXI API listening on http://localhost:${port}`));
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((error) => console.error('MongoDB connection failed:', error.message));
} else console.warn('MONGODB_URI is not set. Add it to .env to enable persistence.');
