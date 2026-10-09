import test from 'node:test';
import assert from 'node:assert/strict';
import { createMailer } from '../server/mail.js';
import { resetEmail } from '../server/emails.js';

test('mailer posts to Brevo with the api key and sender', async (t) => {
  const calls = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => { calls.push({ url, init }); return new Response('{"messageId":"x"}', { status: 201 }); };
  t.after(() => { globalThis.fetch = realFetch; });

  const send = createMailer({ apiKey: 'k-123', fromEmail: 'no-reply@fagi.example', fromName: 'Fagi' });
  await send({ to: 'a@b.test', subject: 'S', html: '<p>h</p>', text: 't' });
  assert.equal(calls[0].url, 'https://api.brevo.com/v3/smtp/email');
  assert.equal(calls[0].init.headers['api-key'], 'k-123');
  const body = JSON.parse(calls[0].init.body);
  assert.deepEqual(body.sender, { email: 'no-reply@fagi.example', name: 'Fagi' });
  assert.deepEqual(body.to, [{ email: 'a@b.test' }]);
  assert.equal(body.textContent, 't');
});

test('mailer surfaces Brevo errors, and refuses to run unconfigured in production', async (t) => {
  const realFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response('{"code":"unauthorized"}', { status: 401 });
  t.after(() => { globalThis.fetch = realFetch; });
  await assert.rejects(createMailer({ apiKey: 'bad', fromEmail: 'x@y.test' })({ to: 'a@b.test', subject: 's', html: '', text: '' }), /Brevo 401/);
  await assert.rejects(createMailer({ apiKey: '', fromEmail: '', production: true })({ to: 'a@b.test' }), /BREVO_API_KEY/);
  const logged = [];
  await createMailer({ apiKey: '', fromEmail: '', production: false, log: { info: (m) => logged.push(m) } })({ to: 'a@b.test', subject: 's', text: 'link' });
  assert.match(logged[0], /link/);
});

test('reset email carries the link in both languages', () => {
  const es = resetEmail({ link: 'https://x.test/jugar#reset=abc', lang: 'es', minutes: 60 });
  const en = resetEmail({ link: 'https://x.test/jugar#reset=abc', lang: 'en', minutes: 60 });
  assert.match(es.subject, /contraseña/);
  assert.match(en.subject, /password/);
  for (const m of [es, en]) { assert.match(m.text, /#reset=abc/); assert.match(m.html, /#reset=abc/); }
});
