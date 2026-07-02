// netlify/functions/stats.js
// Returns all completion rows so the admin dashboard can summarize participation.
// Protected by a shared password (ADMIN_PASSWORD env var) sent as a header —
// simple on purpose, since this is a small internal tool, not a public API.

exports.handler = async (event) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Password",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json"
  };
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: cors, body: "" };

  const adminPass = process.env.ADMIN_PASSWORD;
  const given = event.headers["x-admin-password"] || event.headers["X-Admin-Password"];
  if (!adminPass) return { statusCode: 500, headers: cors, body: JSON.stringify({ error: "ADMIN_PASSWORD not set" }) };
  if (given !== adminPass) return { statusCode: 401, headers: cors, body: JSON.stringify({ error: "Unauthorized" }) };

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return { statusCode: 500, headers: cors, body: JSON.stringify({ error: "Supabase not configured" }) };

  try {
    const resp = await fetch(
      `${url}/rest/v1/progress?select=student_name,session_id,session_title,completed_at&order=completed_at.desc`,
      { headers: { "apikey": key, "Authorization": `Bearer ${key}` } }
    );
    if (!resp.ok) {
      const errText = await resp.text();
      return { statusCode: resp.status, headers: cors, body: JSON.stringify({ error: errText }) };
    }
    const rows = await resp.json();
    return { statusCode: 200, headers: cors, body: JSON.stringify(rows) };
  } catch (err) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: String(err) }) };
  }
};
