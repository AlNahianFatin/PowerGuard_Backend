import cron from 'node-cron';
import { TechnicianVerificationStatus, Role } from '../../generated/prisma/enums';
import { prisma } from './prisma';


export const deleteUnverifiedTechnicians = async () => {
    cron.schedule('*/10 * * * *', async () => {

       try {
           const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
           const deletedTechnicians = await prisma.user.deleteMany({
               where: {
                   role: Role.TECHNICIAN,
                   emailVerified: false,
                   createdAt: { lt: oneHourAgo },
                   technician: {
                       verificationStatus: TechnicianVerificationStatus.PENDING
                   }
               }
           });


           if (deletedTechnicians.count > 0) {
               console.log(`
                Cron: Deleted ${deletedTechnicians.count} unverified email technician applications older than 1 hour
                `);
           }
       } catch (error) {

            console.log("Cron: Failed to delete unverified technician applications", error);
       }

       console.log("Unverified technician delete cron schedule (every 10 minutes)");
    });
}