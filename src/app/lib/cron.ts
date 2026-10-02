import cron from "node-cron";
import {
	Role,
	ScheduleStatus,
	TechnicianVerificationStatus,
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
				new Date().toLocaleDateString(),
				new Date().toLocaleTimeString(),
			);
		}

		console.log(
			"Cron: Unverified technician delete scheduled (every 10 minutes): ",
			new Date().toLocaleDateString(),
			new Date().toLocaleTimeString(),
		);
	});
};

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
				new Date().toLocaleDateString(),
				new Date().toLocaleTimeString(),
			);
		}
		console.log(
			"Cron: Verified technician experience scheduled (every day at midnight): ",
			new Date().toLocaleDateString(),
			new Date().toLocaleTimeString(),
		);
	});
};

export const updateCompletedSchedules = async () => {
	cron.schedule("*/10 * * * *", async () => {
		try {
			const updatedSchedules = await prisma.schedule.updateMany({
				where: {
					status: ScheduleStatus.PUBLISHED,
					isDeleted: false,
					endDateTime: {
						lt: new Date(),
					},
				},
				data: {
					status: ScheduleStatus.COMPLETED,
				},
			});

			if (updatedSchedules.count > 0) {
				console.log(
					`Cron: Updated ${updatedSchedules.count} schedules as they have been completed.`,
				);
			}
		} catch (error) {
			console.error(
				"Cron: Failed to update schedule completion.",
				error,
				new Date().toLocaleDateString(),
				new Date().toLocaleTimeString(),
			);
		}
		console.log(
			"Cron: Schedule status update scheduled (every 10 minutes): ",
			new Date().toLocaleDateString(),
			new Date().toLocaleTimeString(),
		);
	});
};
