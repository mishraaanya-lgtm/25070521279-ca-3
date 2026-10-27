import OpenAI from 'openai';

const client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export async function generateStudyPlan(input) {
  const prompt = buildPlannerPrompt(input);
  if (!client) return fallbackPlan(input);

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: 'You are an expert study coach. Return strict JSON for a student timetable.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.4
  });

  return JSON.parse(response.choices[0].message.content);
}

export function buildPlannerPrompt({ subjects, availableHoursPerDay, startDate, endDate, preferredSessionMinutes, missedTasks = [], goals = [] }) {
  return `
Create an adaptive study timetable as JSON.
Use active recall, spaced repetition, topic difficulty, exam date urgency, weak/strong topics, and available hours.
Regenerate missed tasks without overloading the student.

Student constraints:
- Start: ${startDate}
- End: ${endDate}
- Available hours per day: ${availableHoursPerDay}
- Preferred session minutes: ${preferredSessionMinutes}
- Missed task ids: ${missedTasks.join(', ') || 'none'}
- Goals: ${goals.join(', ') || 'balanced exam prep'}

Subjects:
${JSON.stringify(subjects, null, 2)}

Return:
{
  "title": string,
  "summary": string,
  "backlogRisk": number,
  "recommendations": string[],
  "items": [
    { "subject": string, "topic": string, "mode": string, "startsAt": ISODate, "endsAt": ISODate, "priority": "low|medium|high", "risk": "low|medium|high", "status": "planned" }
  ]
}`;
}

export function predictBacklogRisk(subjects, sessions = []) {
  const topics = subjects.flatMap((subject) => subject.topics || []);
  if (!topics.length) return 0;
  const avgProgress = topics.reduce((sum, topic) => sum + topic.progress, 0) / topics.length;
  const weakLoad = topics.filter((topic) => topic.strength === 'weak').length / topics.length;
  const recentMinutes = sessions.filter((s) => s.completed && s.mode === 'study').reduce((sum, s) => sum + s.durationMinutes, 0);
  return Math.min(95, Math.max(5, Math.round((100 - avgProgress) * 0.58 + weakLoad * 28 - recentMinutes / 90)));
}

function fallbackPlan({ subjects, availableHoursPerDay, startDate, preferredSessionMinutes }) {
  const base = new Date(startDate);
  const topics = subjects.flatMap((subject) => (subject.topics || []).map((topic) => ({
    subject: subject.name,
    topic: topic.name,
    examDate: subject.examDate,
    score: (100 - topic.progress) + topic.difficulty * 4 + (topic.strength === 'weak' ? 25 : 0)
  }))).sort((a, b) => b.score - a.score);

  const items = topics.slice(0, Math.max(4, availableHoursPerDay)).map((entry, index) => {
    const startsAt = new Date(base);
    startsAt.setDate(base.getDate() + Math.floor(index / Math.max(1, availableHoursPerDay)));
    startsAt.setHours(18 + (index % 3), 0, 0, 0);
    const endsAt = new Date(startsAt.getTime() + preferredSessionMinutes * 60000);
    return {
      subject: entry.subject,
      topic: entry.topic,
      mode: index % 2 ? 'Practice questions + error log' : 'Concept repair + active recall',
      startsAt,
      endsAt,
      priority: entry.score > 95 ? 'high' : 'medium',
      risk: entry.score > 95 ? 'high' : 'medium',
      status: 'planned'
    };
  });

  return {
    title: 'Adaptive Study Plan',
    summary: 'Generated locally because OPENAI_API_KEY is not configured.',
    backlogRisk: predictBacklogRisk(subjects, []),
    recommendations: ['Start weak topics first', 'Use Pomodoro cycles', 'Review mistakes before new lessons'],
    items
  };
}
