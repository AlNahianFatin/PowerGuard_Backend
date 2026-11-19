import cron from "node-cron";
import {
	Role,
	ScheduleStatus,
	TechnicianVerificationStatus,
} from "../../generated/prisma/enums";
import { prisma } from "./prisma";
import { calculateExperienceYears } from "../utils/calculateExperienceYears";

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
	},
		{
			timezone: "Asia/Dhaka",
		},
	);

	console.log(
		"Cron: Unverified technician delete scheduled (every 10 minutes): ",
		new Date().toLocaleDateString("en-BD", {
			timeZone: "Asia/Dhaka",
		}),
		new Date().toLocaleTimeString("en-BD", {
			timeZone: "Asia/Dhaka",
		}),
	);
};

export const updateTechnicianExperience = () => {
	cron.schedule(
		"0 0 * * *",
		async () => {
			try {
				const today = new Date();

				const technicians = await prisma.technician.findMany({
					where: {
						verificationStatus: TechnicianVerificationStatus.APPROVED,
						reviewedAt: {
							not: null,
						},
						user: {
							role: Role.TECHNICIAN,
							emailVerified: true,
						},
					},
					select: {
						id: true,
						experienceYears: true,
						reviewedAt: true,
					},
				});

				if (technicians.length === 0)
					return;

				const techniciansByExperience = new Map<number, string[]>();

				for (const technician of technicians) {
					if (!technician.reviewedAt)
						continue;

					const calculatedExperience = calculateExperienceYears(
						technician.reviewedAt,
						today,
					);

					if (technician.experienceYears === calculatedExperience)
						continue;

					const ids =
						techniciansByExperience.get(calculatedExperience) ?? [];

					ids.push(technician.id);

					techniciansByExperience.set(calculatedExperience, ids);
				}

				if (techniciansByExperience.size === 0)
					return;

				const updateOperations = Array.from(
					techniciansByExperience.entries(),
				).map(([experienceYears, ids]) =>
					prisma.technician.updateMany({
						where: {
							id: {
								in: ids,
							},
							verificationStatus: TechnicianVerificationStatus.APPROVED,
						},
						data: {
							experienceYears,
						},
					}),
				);

				const results = await prisma.$transaction(updateOperations);

				const totalUpdated = results.reduce(
					(total, result) => total + result.count,
					0,
				);

				if (totalUpdated > 0) {
					console.log(
						`Cron: Recalculated experience for ${totalUpdated} approved technicians.`,
					);
				}
			} catch (error) {
				console.error(
					"Cron: Failed to recalculate approved technician experience.",
					error,
					new Date().toLocaleDateString("en-BD", {
						timeZone: "Asia/Dhaka",
					}),
					new Date().toLocaleTimeString("en-BD", {
						timeZone: "Asia/Dhaka",
					}),
				);
			}
		},
		{
			timezone: "Asia/Dhaka",
		},
	);

	console.log(
		"Cron: Approved technician experience recalculation scheduled daily at 12:00 AM (Asia/Dhaka): ",
		new Date().toLocaleDateString("en-BD", {
			timeZone: "Asia/Dhaka",
		}),
		new Date().toLocaleTimeString("en-BD", {
			timeZone: "Asia/Dhaka",
		}),
	);
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
				new Date().toLocaleDateString("en-BD", {
					timeZone: "Asia/Dhaka",
				}),
				new Date().toLocaleTimeString("en-BD", {
					timeZone: "Asia/Dhaka",
				}),
			);
		}
	},
		{
			timezone: "Asia/Dhaka",
		},
	);

	console.log(
		"Cron: Schedule status update scheduled (every 10 minutes): ",
		new Date().toLocaleDateString("en-BD", {
			timeZone: "Asia/Dhaka",
		}),
		new Date().toLocaleTimeString("en-BD", {
			timeZone: "Asia/Dhaka",
		}),
	);
};