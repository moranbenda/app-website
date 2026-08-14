export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const d = req.body || {};

    if (!d.fullName || !d.email || !d.phone) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing RESEND_API_KEY" });
    }

    const esc = escapeHtml;
    const line = (label, value) =>
      `<tr><td style="padding:8px 10px;border-bottom:1px solid #eceff5;color:#6b7280;vertical-align:top">${esc(label)}</td>` +
      `<td style="padding:8px 10px;border-bottom:1px solid #eceff5;font-weight:600">${esc(value || "לא צוין")}</td></tr>`;

    const list = value => Array.isArray(value) ? value.join(", ") : (value || "לא צוין");

    const generalRows = [
      line("שם מלא", d.fullName),
      line("טלפון", d.phone),
      line("אימייל", d.email),
      line("גיל", d.age),
      line("ניסיון", d.experienceLabel || d.experience),
      line("מטרות", list(d.goalsLabels || d.goals)),
      line("הערה למטרות", d.goalNotes),
      line("מקום אימון", list(d.locationsLabels || d.locations)),
      line("ציוד בבית", list(d.homeEquipmentLabels || d.homeEquipment)),
      line("גישה לחדר כושר", d.gymAccess),
      line("ציוד בפארק", d.parkEquipment),
      line("אימונים בשבוע", d.daysPerWeek),
      line("משך אימון", d.duration ? `${d.duration} דקות` : ""),
      line("חסמים להתמדה", list(d.barriersLabels || d.barriers)),
      line("הערה לחסמים", d.barrierNotes),
      line("חבילה", d.packageLabel || d.package)
    ].join("");

    const healthRows = [
      line("מצב רפואי רלוונטי", yesNo(d.medicalCondition)),
      line("פירוט מצב רפואי", d.medicalConditionDetails),
      line("כאב / פציעה / מגבלת תנועה", yesNo(d.injury)),
      line("פירוט כאב / פציעה", d.injuryDetails),
      line("תרופות רלוונטיות לפעילות", yesNo(d.medication)),
      line("פירוט תרופות", d.medicationDetails)
    ].join("");

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "AzmaiPlus-FitCoach/1.0"
      },
      body: JSON.stringify({
        from: "FIT COACH <support@azmaiplus.co.il>",
        to: ["azmaiplusapp@gmail.com"],
        reply_to: d.email,
        subject: `מתאמנת חדשה ב-FIT COACH - ${esc(d.fullName)}`,
        html: `
          <div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.6;color:#17213a;max-width:720px;margin:auto">
            <div style="background:#24105f;color:white;padding:22px 24px;border-radius:16px 16px 0 0">
              <div style="font-size:13px;opacity:.8">FIT COACH</div>
              <h2 style="margin:5px 0 0">שאלון התאמה חדש</h2>
            </div>

            <div style="border:1px solid #e5e7eb;border-top:0;padding:22px 24px">
              <h3 style="margin-top:0;color:#24105f">פרטי המתאמנת והליווי</h3>
              <table style="width:100%;border-collapse:collapse">${generalRows}</table>

              <div style="margin:26px 0 12px;padding:12px 14px;background:#fff7ed;border:1px solid #fed7aa;border-radius:10px">
                <strong>מידע בריאותי רגיש</strong><br>
                המידע הבא נמסר לצורך התאמת האימון בלבד ויש לשמור עליו באופן פרטי.
              </div>
              <table style="width:100%;border-collapse:collapse">${healthRows}</table>

              <p style="margin:24px 0 0;color:#6b7280;font-size:12px">
                מקור: azmaiplus.co.il/fit-coach · נשלח מטופס ההצטרפות
              </p>
            </div>
          </div>
        `
      })
    });

    if (!resendResponse.ok) {
      const details = await resendResponse.text();
      return res.status(500).json({ error: "Resend failed", details });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: "Server error" });
  }
}

function yesNo(value) {
  if (value === "yes") return "כן";
  if (value === "no") return "לא";
  return value || "לא צוין";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
