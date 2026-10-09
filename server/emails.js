// The texts of the emails the server sends, in Spanish and English.

const RESET = {
  es: {
    subject: 'Restablece tu contraseña de Fagi',
    intro: 'Alguien (seguramente tú) pidió restablecer la contraseña de tu cuenta de Fagi.',
    action: 'Elegir una contraseña nueva',
    expires: (m) => `El enlace sirve una sola vez y caduca en ${m} minutos.`,
    ignore: 'Si no lo pediste, ignora este correo: tu contraseña no cambia.',
  },
  en: {
    subject: 'Reset your Fagi password',
    intro: 'Someone (probably you) asked to reset the password of your Fagi account.',
    action: 'Choose a new password',
    expires: (m) => `The link works once and expires in ${m} minutes.`,
    ignore: 'If you did not ask for it, ignore this email: your password stays the same.',
  },
};

export function resetEmail({ link, lang, minutes }) {
  const s = RESET[lang] ?? RESET.es;
  const text = `${s.intro}\n\n${s.action}: ${link}\n\n${s.expires(minutes)}\n${s.ignore}\n`;
  const html = `<div style="font-family: system-ui, sans-serif; max-width: 480px; line-height: 1.5; color: #222">
  <p>${s.intro}</p>
  <p><a href="${link}" style="display: inline-block; padding: 10px 18px; background: #2f7d4a; color: #fff; text-decoration: none; border-radius: 6px">${s.action}</a></p>
  <p style="font-size: 13px; color: #666">${s.expires(minutes)}<br>${s.ignore}</p>
  <p style="font-size: 12px; color: #999; word-break: break-all">${link}</p>
</div>`;
  return { subject: s.subject, text, html };
}
