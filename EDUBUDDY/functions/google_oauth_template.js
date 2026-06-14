// Minimal serverless template for Google Calendar OAuth + event insertion
// This is a skeleton. You must provide CLIENT_ID, CLIENT_SECRET, and set redirect URIs.
const express = require('express');
const fetch = require('node-fetch');
const app = express();
app.use(express.json());

app.get('/auth-url', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirect = process.env.GOOGLE_REDIRECT_URI;
  const scope = encodeURIComponent('https://www.googleapis.com/auth/calendar.events');
  // support optional state param (e.g. user id) encoded as base64 JSON
  const stateRaw = req.query.state || req.query.userId || '';
  const state = stateRaw ? encodeURIComponent(String(stateRaw)) : '';
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirect)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent${state ? `&state=${state}` : ''}`;
  res.json({ url });
});

// OAuth2 callback route - exchange code for tokens and postMessage to opener
app.get('/oauth2callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send('Missing code');
  try {
    const params = new URLSearchParams();
    params.append('code', String(code));
    params.append('client_id', process.env.GOOGLE_CLIENT_ID);
    params.append('client_secret', process.env.GOOGLE_CLIENT_SECRET);
    params.append('redirect_uri', process.env.GOOGLE_REDIRECT_URI);
    params.append('grant_type', 'authorization_code');
    const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', body: params });
    const data = await r.json();
    // if state contains user id, try to save tokens to Supabase using service role key
    try {
      const rawState = req.query.state;
      let decodedState = null;
      if (rawState) {
        try { decodedState = decodeURIComponent(String(rawState)); } catch {}
      }
      let userId = null;
      if (decodedState) {
        try {
          const parsed = JSON.parse(decodedState);
          if (parsed && parsed.userId) userId = parsed.userId;
        } catch (e) {
          // not JSON, may be plain userId
          userId = decodedState;
        }
      }
      const SUP_URL = process.env.SUPABASE_URL;
      const SUP_KEY = process.env.SUPABASE_SERVICE_KEY;
      if (SUP_URL && SUP_KEY && userId) {
        const saveUrl = `${SUP_URL}/rest/v1/users?id=eq.${encodeURIComponent(userId)}`;
        const body = { google_tokens: data };
        await fetch(saveUrl, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'apikey': SUP_KEY, 'Authorization': `Bearer ${SUP_KEY}`, 'Prefer': 'return=representation' }, body: JSON.stringify(body) });
      }
    } catch (e) {
      console.warn('Could not auto-save tokens to Supabase:', e);
    }
    // Optionally persist refresh_token server-side here (not implemented)
    const payload = JSON.stringify({ type: 'google_oauth', tokens: data });
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>OAuth Complete</title></head><body>
      <script>
        try {
          if (window.opener) {
            window.opener.postMessage(${payload}, '*');
          }
        } catch (e) {
          console.error(e);
        }
        // close popup after short delay
        setTimeout(()=>{ window.close(); }, 500);
      </script>
      <div>Authentication complete. You can close this window.</div>
    </body></html>`;
    res.set('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    console.error('oauth callback error', err);
    res.status(500).send('OAuth error');
  }
});

// allow explicit saving of tokens via POST (requires SUPABASE_URL + SUPABASE_SERVICE_KEY)
app.post('/save-tokens', async (req, res) => {
  const { user_id, tokens } = req.body || {};
  const SUP_URL = process.env.SUPABASE_URL;
  const SUP_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SUP_URL || !SUP_KEY) return res.status(400).json({ error: 'Supabase not configured on server' });
  if (!user_id || !tokens) return res.status(400).json({ error: 'missing user_id or tokens' });
  try {
    const saveUrl = `${SUP_URL}/rest/v1/users?id=eq.${encodeURIComponent(user_id)}`;
    const body = { google_tokens: tokens };
    const r = await fetch(saveUrl, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'apikey': SUP_KEY, 'Authorization': `Bearer ${SUP_KEY}`, 'Prefer': 'return=representation' }, body: JSON.stringify(body) });
    const result = await r.json();
    res.json({ ok: true, result });
  } catch (e) {
    console.error('save-tokens error', e);
    res.status(500).json({ error: String(e) });
  }
});

app.post('/token', async (req, res) => {
  const { code } = req.body;
  const params = new URLSearchParams();
  params.append('code', code);
  params.append('client_id', process.env.GOOGLE_CLIENT_ID);
  params.append('client_secret', process.env.GOOGLE_CLIENT_SECRET);
  params.append('redirect_uri', process.env.GOOGLE_REDIRECT_URI);
  params.append('grant_type', 'authorization_code');
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', body: params });
  const data = await r.json();
  res.json(data);
});

app.post('/create-event', async (req, res) => {
  const { access_token, event } = req.body; // event in Google Calendar format
  const r = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST', headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(event)
  });
  const data = await r.json();
  res.json(data);
});

module.exports = app;
