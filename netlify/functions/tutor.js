// netlify/functions/tutor.js
// Serverless proxy so the ACT tutor can call Claude WITHOUT exposing your API key in the browser.
// 1. In Netlify: Site settings → Environment variables → add ANTHROPIC_API_KEY = your key
// 2. Deploy. The front-end posts to /api/tutor (redirected here by netlify.toml).

exports.handler = async (event) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: cors, body: "" };
  if (event.httpMethod !== "POST")   return { statusCode: 405, headers: cors, body: JSON.stringify({ error: "POST only" }) };

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { statusCode: 500, headers: cors, body: JSON.stringify({ error: "ANTHROPIC_API_KEY not set" }) };

  try {
    const payload = JSON.parse(event.body || "{}");
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: payload.model || "claude-sonnet-4-20250514",
        max_tokens: payload.max_tokens || 1000,
        system: payload.system,
        messages: payload.messages
      })
    });
    const data = await resp.json();
    return { statusCode: resp.status, headers: cors, body: JSON.stringify(data) };
  } catch (err) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: String(err) }) };
  }
};
