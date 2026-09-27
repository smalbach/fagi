// Turns an already registered account into an approved admin. For the first admin
// if ADMIN_EMAIL was not used, or to add another one.
//
//   DATABASE_URL=postgres://... npm run make-admin -- email@example.com

import { createPool } from '../db.js';

const email = process.argv[2];
if (!email) {
  console.error('Usage: npm run make-admin -- email@example.com');
  process.exit(1);
}

const pool = createPool();
try {
  const { rows } = await pool.query(
    `UPDATE users SET role = 'admin', status = 'approved', approved_at = COALESCE(approved_at, now())
      WHERE email = $1 RETURNING email`,
    [email.trim().toLowerCase()],
  );
  console.log(rows[0] ? `${rows[0].email} is now admin` : `No account exists with ${email}`);
  if (!rows[0]) process.exitCode = 1;
} finally {
  await pool.end();
}
