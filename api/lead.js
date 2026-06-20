export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { name, email, phone, source } = req.body || {};
    if (!name || !email) return res.status(400).json({ error: "Missing required fields" });
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Missing RESEND_API_KEY" });
    const html = `<div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.7"><h2>ליד חדש מאתר עצמאי פלוס</h2><p><strong>שם:</strong> ${escapeHtml(name)}</p><p><strong>אימייל:</strong> ${escapeHtml(email)}</p><p><strong>טלפון:</strong> ${escapeHtml(phone || "")}</p><p><strong>מקור:</strong> ${escapeHtml(source || "website")}</p></div>`;
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "עצמאי פלוס <support@azmaiplus.co.il>",
        to: ["azmaiplusapp@gmail.com"],
        reply_to: email,
        subject: `ליד חדש מאתר עצמאי פלוס - ${name}`,
        html
      })
    });
    if (!resendResponse.ok) return res.status(500).json({ error: "Resend failed", details: await resendResponse.text() });
    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: "Server error" });
  }
}
function escapeHtml(value) {
  return String(value).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
}
