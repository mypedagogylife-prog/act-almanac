// netlify/functions/track.js
// Logs a student session-completion event to Supabase (upserts, so re-marking
// the same session just updates the timestamp instead of creating duplicates).
// Requires two Netlify env vars: SUPABASE_URL and SUPABASE_SERVICE_KEY.

exports.handler = async (event) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: cors, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers: cors, body: JSON.stringify({ error: "POST only" }) };

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return { statusCode: 500, headers: cors, body: JSON.stringify({ error: "Supabase not configured (missing SUPABASE_URL / SUPABASE_SERVICE_KEY)" }) };

  try {
    const { studentName, sessionId, sessionTitle, completed } = JSON.parse(event.body || "{}");
    if (!studentName || !sessionId) {
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "studentName and sessionId are required" }) };
    }

    const resp = await fetch(`${url}/rest/v1/progress`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": key,
        "Authorization": `Bearer ${key}`,
        "Prefer": "resolution=merge-duplicates"
      },
      body: JSON.stringify([{
        student_name: String(studentName).trim(),
        session_id: sessionId,
        session_title: sessionTitle || null,
        completed: completed !== false,
        completed_at: new Date().toISOString()
      }])
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return { statusCode: resp.status, headers: cors, body: JSON.stringify({ error: errText }) };
    }
    return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: String(err) }) };
  }
};
