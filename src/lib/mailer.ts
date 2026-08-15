// Minimal transactional email sender using the Resend HTTP API.
// No SDK dependency: a single fetch call, so it works without touching
// package.json. Configure RESEND_API_KEY (and optionally EMAIL_FROM) to
// enable real delivery; without it, callers should fall back to logging.

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "PHARMACI <onboarding@resend.dev>";

export function isEmailConfigured(): boolean {
  return !!RESEND_API_KEY;
}

export async function sendMail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<boolean> {
  if (!RESEND_API_KEY) return false;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [params.to],
        subject: params.subject,
        html: params.html,
        text: params.text,
      }),
    });
    if (!res.ok) {
      console.error(
        "[Mailer] Resend API error:",
        res.status,
        await res.text().catch(() => "")
      );
      return false;
    }
    return true;
  } catch (error) {
    console.error("[Mailer] Failed to send email:", error);
    return false;
  }
}
