import { db } from '../src/lib/db';
import { verifyPassword, signToken, createSessionCookie } from '../src/lib/auth';

async function testFullLogin() {
  try {
    const email = 'koffi@example.com';
    const password = 'demo1234';
    
    console.log('1. Finding user...');
    const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      console.log('User NOT found');
      return;
    }
    
    console.log('2. User found:', { email: user.email, hasPassword: !!user.password });
    
    if (!user.password) {
      console.log('No password on user');
      return;
    }
    
    console.log('3. Verifying password...');
    const isValid = await verifyPassword(password, user.password);
    console.log('4. Password valid:', isValid);
    
    if (!isValid) {
      console.log('Password verification failed');
      return;
    }
    
    console.log('5. Generating token...');
    const token = await signToken({ userId: user.id, email: user.email, role: user.role, provider: user.authProvider });
    console.log('6. Token generated:', token.substring(0, 50) + '...');
    
    console.log('7. Creating cookie...');
    const cookie = createSessionCookie(token);
    console.log('8. Cookie created:', cookie.sessionCookie.substring(0, 100) + '...');
    
    console.log('SUCCESS: Login process completed successfully');
  } catch (error) {
    console.error('ERROR:', error);
  }
}
testFullLogin().catch(console.error);
