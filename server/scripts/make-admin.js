// Convierte una cuenta ya registrada en admin aprobado. Para el primer admin
// si no se usó ADMIN_EMAIL, o para añadir otro.
//
//   DATABASE_URL=postgres://... npm run make-admin -- correo@ejemplo.com

import { createPool } from '../db.js';

const email = process.argv[2];
if (!email) {
  console.error('Uso: npm run make-admin -- correo@ejemplo.com');
  process.exit(1);
}

const pool = createPool();
try {
  const { rows } = await pool.query(
    `UPDATE users SET role = 'admin', status = 'approved', approved_at = COALESCE(approved_at, now())
      WHERE email = $1 RETURNING email`,
    [email.trim().toLowerCase()],
  );
  console.log(rows[0] ? `${rows[0].email} ahora es admin` : `No existe ninguna cuenta con ${email}`);
  if (!rows[0]) process.exitCode = 1;
} finally {
  await pool.end();
}
