export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { name, email, phone, source } = req.body || {};

    if (!name || !email) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing RESEND_API_KEY" });
    }

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safePhone = escapeHtml(phone || "");
    const safeSource = escapeHtml(source || "website");

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "עצמאי פלוס <support@azmaiplus.co.il>",
        to: ["azmaiplusapp@gmail.com"],
        reply_to: email,
        subject: `ליד חדש מאתר עצמאי פלוס - ${safeName}`,
        html: `
          <div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.7;color:#10223f">
            <h2>ליד חדש מאתר עצמאי פלוס</h2>
            <p><strong>שם:</strong> ${safeName}</p>
            <p><strong>אימייל:</strong> ${safeEmail}</p>
            <p><strong>טלפון:</strong> ${safePhone}</p>
            <p><strong>מקור:</strong> ${safeSource}</p>
          </div>
        `
      })
    });

    if (!resendResponse.ok) {
      const text = await resendResponse.text();
      return res.status(500).json({ error: "Resend failed", details: text });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: "Server error" });
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
