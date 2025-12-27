import cron from 'node-cron';
import { cleanupExpiredVerificationCodes } from '../services/emails/emailVerificationService.js';
import prisma from '../database.js';
export const scheduleVerificationCleanup = () => {
  cron.schedule('0 0 * * *', async () => {
    console.log('Starting cleanup of expired verification codes...');
    
    try {
      const cleanedCount = await cleanupExpiredVerificationCodes();
      console.log(`Cleaned up ${cleanedCount} expired verification codes`);
    } catch (error) {
      console.error('Failed to clean up verification codes:', error);
    }
  });
  
  console.log('Verification cleanup scheduled (daily at midnight)');
};

export const scheduleUnverifiedUserCleanup = () => {
  cron.schedule('0 1 * * *', async () => {
    console.log('Starting cleanup of old unverified users...');
    
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      const result = await prisma.user.deleteMany({
        where: {
          isVerified: false,
          createdAt: {
            lt: sevenDaysAgo
          },
          orders: {
            none: {}
          }
        }
      });
      
      console.log(`Cleaned up ${result.count} old unverified users`);
    } catch (error) {
      console.error('Failed to clean up unverified users:', error);
    }
  });
  
  console.log('Unverified user cleanup scheduled (daily at 1 AM)');
};
export const initializeCronJobs = () => {
  scheduleVerificationCleanup();
  scheduleUnverifiedUserCleanup(); 
};