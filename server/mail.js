// Outgoing email through Brevo's transactional API (no SDK: one fetch).
//
//   BREVO_API_KEY    the API key (Brevo → SMTP & API → API keys)
//   MAIL_FROM_EMAIL  sender address, verified in Brevo
//   MAIL_FROM_NAME   sender name shown in the inbox (optional)
//
// Without BREVO_API_KEY, outside production the email is printed to the
// console instead (so the flow can be tried locally); in production it fails.

const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

export function createMailer({
  apiKey = process.env.BREVO_API_KEY,
  fromEmail = process.env.MAIL_FROM_EMAIL,
  fromName = process.env.MAIL_FROM_NAME ?? 'Fagi',
  production = process.env.NODE_ENV === 'production',
  log = console,
} = {}) {
  return async function sendMail({ to, subject, html, text }) {
    if (!apiKey || !fromEmail) {
      if (production) throw new Error('BREVO_API_KEY or MAIL_FROM_EMAIL is missing');
      log.info?.(`[mail] (not sent: no BREVO_API_KEY) to=${to} subject=${subject}\n${text}`);
      return;
    }
    const res = await fetch(BREVO_URL, {
      method: 'POST',
      headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        sender: { email: fromEmail, name: fromName },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        textContent: text,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Brevo ${res.status}: ${body.slice(0, 300)}`);
    }
  };
}
