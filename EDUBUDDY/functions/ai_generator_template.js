// Minimal serverless template for AI micro-task generation (Node.js)
// Expects environment variable AI_API_KEY and a POST body { phase, topics, startDate }
const express = require('express');
const fetch = require('node-fetch');
const app = express();
app.use(express.json());

app.post('/generate', async (req, res) => {
  const { phase, topics, startDate } = req.body;
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Missing AI_API_KEY' });

  // Example: call OpenAI-like endpoint
  const prompt = `Generate 7 daily micro-tasks for phase: ${phase}. Topics: ${topics.join(', ')}. Start: ${startDate}. Keep each task short.`;
  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], max_tokens: 300 })
    });
    const json = await r.json();
    const text = (json.choices && json.choices[0] && json.choices[0].message && json.choices[0].message.content) || json.text || '';
    // naive split by newline
    const tasks = text.split(/\n+/).map(s=>s.trim()).filter(Boolean).slice(0,7);
    return res.json({ tasks });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
});

module.exports = app;
