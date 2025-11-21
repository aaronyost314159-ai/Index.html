// server.js
// Super minimal Node server for your HTML + Groq-backed chat.

const http = require('http');
const fs = require('fs');
const path = require('path');
const SYSTEM_PROMPT_I99T = `
You are the i99t Meta Engine — CBOOP kernel:

“Compiler of Behavior, Ontology, Output & Profit.”

You run as the inner operating system behind a chat UI (the φ-Field console). The UI handles visuals, filing, and timestamps. You handle STRUCTURE:

- How to interpret the user.
- How to transform their raw input into coherent systems, scripts, plans, and protocols.
- How to optimize for durable, compounding value (emotional, relational, and financial).

You are not a generic assistant. You are a meta-engine that thinks in terms of:

- i99t Kernel Axioms
- DIVR / DIR (Dual Informational Variability / Relativity)
- HRAS (Hyper-Residual Autonomy System)
- SCM (Structural Coherence Matrix)
- IT⁺ (Information-as-Trauma / Information-as-Matter lens)

You are allowed to be conversational and warm, but the core of your job is structural rigor and optimization.

[... PASTE THE REST OF THE BIG PROMPT I GAVE YOU PREVIOUSLY HERE ...]
`;
const PORT = process.env.PORT || 3000;
const GROQ_API_KEY = process.env.GROQ_API_KEY; // set this in Replit Secrets

const INDEX_PATH = path.join(__dirname, 'index.html');

async function handleChat(req, res, body) {
  if (!GROQ_API_KEY) {
    res.writeHead(500, {'Content-Type': 'application/json'});
    return res.end(JSON.stringify({ error: 'GROQ_API_KEY not set on server' }));
  }

  let msg;
  try {
    const data = JSON.parse(body || '{}');
    msg = data.message;
  } catch {
    res.writeHead(400, {'Content-Type': 'application/json'});
    return res.end(JSON.stringify({ error: 'Invalid JSON' }));
  }

  if (!msg || typeof msg !== 'string') {
    res.writeHead(400, {'Content-Type': 'application/json'});
    return res.end(JSON.stringify({ error: 'Missing "message" string in body' }));
  }

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + GROQ_API_KEY
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are the φ-Field console assistant for Aaron. Be clear, kind, and non-linear-friendly.'
          },
          { role: 'user', content: msg }
        ],
        temperature: 0.7
      })
    });

    const data = await groqRes.json().catch(() => ({}));
    const reply =
      data?.choices?.[0]?.message?.content ||
      '(No content returned from Groq API.)';

    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({ reply }));
  } catch (err) {
    console.error('Groq error:', err);
    res.writeHead(500, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({ error: 'Error talking to Groq API' }));
  }
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/chat') {
    // Collect JSON body
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => { handleChat(req, res, body); });
    return;
  }

  // For all GETs: just serve index.html
  if (req.method === 'GET') {
    fs.readFile(INDEX_PATH, (err, data) => {
      if (err) {
        res.writeHead(500, {'Content-Type': 'text/plain'});
        return res.end('Error loading index.html');
      }
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end(data);
    });
    return;
  }

  // Fallback
  res.writeHead(404, {'Content-Type': 'text/plain'});
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log('Server running on port', PORT);
});
