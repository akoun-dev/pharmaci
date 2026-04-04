import { db } from '../src/lib/db';

async function checkUser() {
  const user = await db.user.findUnique({ where: { email: 'koffi@example.com' } });
  if (user) {
    console.log('User found:', { email: user.email, phone: user.phone, role: user.role, password: user.password ? 'has password' : 'no password' });
  } else {
    console.log('User NOT found');
  }
}
checkUser().catch(console.error);
