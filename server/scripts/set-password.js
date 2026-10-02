// Sets a new password for an existing account (an admin's, or anyone's) and
// closes all its open login sessions, so the old password stops working
// everywhere at once.
//
//   DATABASE_URL=postgres://... npm run set-password -- email@example.com
//
// The password is asked for twice without echoing it, never taken as an
// argument: arguments end up in the shell history. Without a terminal (CI,
// a pipe) it is read from the first line of stdin.

import { createInterface } from 'node:readline';
import { createPool } from '../db.js';
import { hashPassword, MIN_PASSWORD } from '../auth.js';

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error('Usage: npm run set-password -- email@example.com');
  process.exit(1);
}

const password = process.stdin.isTTY ? await askTwice() : await firstLine();
if (!password || password.length < MIN_PASSWORD) {
  console.error(`The password must be at least ${MIN_PASSWORD} characters`);
  process.exit(1);
}

const pool = createPool();
try {
  const hash = await hashPassword(password);
  const { rows } = await pool.query(
    'UPDATE users SET password_hash = $2 WHERE email = $1 RETURNING id, email, role',
    [email, hash],
  );
  if (!rows[0]) {
    console.error(`No account exists with ${email}`);
    process.exitCode = 1;
  } else {
    const { rowCount } = await pool.query('DELETE FROM auth_sessions WHERE user_id = $1', [rows[0].id]);
    console.log(`Password changed for ${rows[0].email} (${rows[0].role}); ${rowCount} session(s) closed`);
  }
} finally {
  await pool.end();
}

async function askTwice() {
  const first = await askHidden('New password: ');
  const second = await askHidden('Repeat it: ');
  if (first !== second) {
    console.error('The passwords do not match');
    process.exit(1);
  }
  return first;
}

// Reads one line from the terminal without echoing what is typed.
function askHidden(prompt) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (s) => { if (s.includes(prompt)) process.stdout.write(s); };
    rl.question(prompt, (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
  });
}

async function firstLine() {
  const rl = createInterface({ input: process.stdin });
  for await (const line of rl) {
    rl.close();
    return line;
  }
  return '';
}
