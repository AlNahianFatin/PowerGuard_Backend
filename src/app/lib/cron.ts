import cron from "node-cron";
import {
	TechnicianVerificationStatus,
	Role,
} from "../../generated/prisma/enums";
import { prisma } from "./prisma";

export const deleteUnverifiedTechnicians = async () => {
	cron.schedule("*/10 * * * *", async () => {
		try {
			const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
			const deletedTechnicians = await prisma.user.deleteMany({
				where: {
					role: Role.TECHNICIAN,
					emailVerified: false,
					createdAt: { lt: oneHourAgo },
					technician: {
						verificationStatus: TechnicianVerificationStatus.PENDING,
					},
				},
			});

			if (deletedTechnicians.count > 0) {
				console.log(`
                Cron: Deleted ${deletedTechnicians.count} unverified email technician applications older than 1 hour
                `);
			}
		} catch (error) {
			console.log(
				"Cron: Failed to delete unverified technician applications",
				error,
			);
		}

		console.log(
			"Unverified technician delete cron schedule (every 10 minutes)",
		);
	});
};

// export const updateTechnicianExperience = async () => {
// 	cron.schedule("0 0 0 0 */1", async () => {
// 		try {
// 			const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

// 			const updatedTechnicians = await prisma.technician.updateMany({
// 				where: {
// 					verificationStatus: TechnicianVerificationStatus.APPROVED,
// 					user: {
// 						role: Role.TECHNICIAN,
// 						emailVerified: true,
// 						createdAt: { lt: oneYearAgo },
// 					},
// 				},
// 				data: {
// 					experienceYears: {
// 						increment: 1,
// 					},
// 				},
// 			});

// 			if (updatedTechnicians.count > 0) {
// 				console.log(`
//                 Cron: Updated ${updatedTechnicians.count} verified technician experience older than 1 year
//                 `);
// 			}
// 		} catch (error) {
// 			console.log(
// 				"Cron: Failed to update verified technician experience",
// 				error,
// 			);
// 		}

// 		console.log(
// 			"Verified technician experience update cron schedule (every 10 days)",
// 		);
// 	});
// };

export const updateTechnicianExperience = async () => {
	cron.schedule("0 0 * * *", async () => {
		try {
			const today = new Date();
			const technicians = await prisma.technician.findMany({
				where: {
					verificationStatus: TechnicianVerificationStatus.APPROVED,
					user: {
						role: Role.TECHNICIAN,
						emailVerified: true,
						createdAt: {
							lt: new Date(
								today.getFullYear() - 1,
								today.getMonth(),
								today.getDate(),
							),
						},
					},
				},
				select: {
					id: true,
					user: {
						select: { createdAt: true },
					},
				},
			});

			const techniciansToUpdate = technicians.filter((technician) => {
				const createdAt = technician.user.createdAt;
				return (
					createdAt.getMonth() === today.getMonth() &&
					createdAt.getDate() === today.getDate()
				);
			});

			if (techniciansToUpdate.length === 0) {
				return;
			}

			const ids = techniciansToUpdate.map((technician) => technician.id);

			const updatedTechnicians = await prisma.technician.updateMany({
				where: {
					id: { in: ids },
				},
				data: {
					experienceYears: { increment: 1 },
				},
			});

			if (updatedTechnicians.count > 0) {
				console.log(
					`Cron: Updated ${updatedTechnicians.count} technician anniversary experience milestones.`,
				);
			}
		} catch (error) {
			console.error(
				"Cron: Failed to update verified technician experience",
				error,
			);
		}
		console.log(
			"Verified technician experience cron scheduled: every day at midnight",
		);
	});
};
