import { db } from '../src/lib/db';
import { verifyPassword, signToken } from '../src/lib/auth';

async function testLogin() {
  const email = 'koffi@example.com';
  const password = 'demo1234';
  
  const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    console.log('User NOT found');
    return;
  }
  
  console.log('User found:', { email: user.email, hasPassword: !!user.password });
  
  if (!user.password) {
    console.log('No password on user');
    return;
  }
  
  const isValid = await verifyPassword(password, user.password);
  console.log('Password valid:', isValid);
  
  if (isValid) {
    const token = await signToken({ userId: user.id, email: user.email, role: user.role, provider: user.authProvider });
    console.log('Token generated:', token.substring(0, 50) + '...');
  }
}
testLogin().catch(console.error);
