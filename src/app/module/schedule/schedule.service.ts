import { addDays, isBefore, startOfDay } from "date-fns";
import httpStatus from "http-status";
import { ScheduleStatus } from "../../../generated/prisma/enums";
import type { ScheduleWhereInput } from "../../../generated/prisma/models";
import type { IQuery } from "../../interfaces";
import { prisma } from "../../lib/prisma";
import type { RequestUser } from "../../middleware/checkAuth";
import { AppError } from "../../utils/AppError";
import type {
	ICreateSchedulePayload,
	IUpdateSchedulePayload,
} from "./schedule.interface";

const getAllSchedules = async (query: IQuery) => {
	const limit = query.limit ? Number(query.limit) : 10;
	const page = query.page ? Number(query.page) : 1;
	const skip = (page - 1) * limit;
	const sortBy = query.sortBy ? query.sortBy : "createdAt";
	const sortOrder = query.sortOrder ? query.sortOrder : "desc";

	const andConditions: ScheduleWhereInput[] = [
		{
			isDeleted: false,
		},
		{
			isDeleted: false,
		},
		{
			feeder: {
				isDeleted: false,
			},
		},
	];

	if (query.operatorId) {
		andConditions.push({ operatorId: query.operatorId });
	}

	// if (query.email) {
	// 	andConditions.push({
	// 		operator: {
	// 			email: query.email,
	// 		},
	// 	});
	// }

	if (query.status) {
		andConditions.push({ status: query.status });
	}

	if (query.feederCode) {
		andConditions.push({
			feeder: {
				code: query.feederCode,
			},
		});
	}

	if (query.areaCode) {
		andConditions.push({
			feeder: {
				areas: {
					some: {
						code: query.areaCode,
					},
				},
			},
		});
	}

	if (query.searchTerm) {
		andConditions.push({
			OR: [
				// Feeder name
				{
					feeder: {
						name: {
							contains: query.searchTerm,
							mode: "insensitive",
						},
					},
				},

				// Feeder code
				{
					feeder: {
						code: {
							contains: query.searchTerm,
							mode: "insensitive",
						},
					},
				},

				// Feeder area name
				{
					feeder: {
						areas: {
							some: {
								name: {
									contains: query.searchTerm,
									mode: "insensitive",
								},
							},
						},
					},
				},

				// Feeder area code
				{
					feeder: {
						areas: {
							some: {
								code: {
									contains: query.searchTerm,
									mode: "insensitive",
								},
							},
						},
					},
				},

				// Operator name
				{
					operator: {
						name: {
							contains: query.searchTerm,
							mode: "insensitive",
						},
					},
				},

				// Operator email
				{
					operator: {
						email: {
							contains: query.searchTerm,
							mode: "insensitive",
						},
					},
				},
			],
		});
	}

	const schedules = await prisma.schedule.findMany({
		where: {
			AND: andConditions,
		},

		take: limit,
		skip,
		orderBy: {
			// sortBy : sortOrder
			[sortBy]: sortOrder,
		},
		include: {
			feeder: {
				include: {
					areas: true,
				},
			},
		},
	});

	const total = await prisma.schedule.count({ where: { AND: andConditions } });

	return {
		data: schedules,
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
};

const getTodaysSchedules = async (query: IQuery) => {
	const limit = query.limit ? Number(query.limit) : 10;
	const page = query.page ? Number(query.page) : 1;
	const skip = (page - 1) * limit;
	const sortBy = query.sortBy ? query.sortBy : "createdAt";
	const sortOrder = query.sortOrder ? query.sortOrder : "desc";

	const now = new Date();
	const startOfToday = startOfDay(now);
	const startOfTomorrow = addDays(startOfToday, 1);

	const andConditions: ScheduleWhereInput[] = [
		// {
		// 	operatorId: query.operatorId,
		// },
		{
			isDeleted: false,
		},
		{
			status: ScheduleStatus.PUBLISHED,
		},
		{
			startDateTime: {
				gte: startOfToday,
				// gt: now,
				lt: startOfTomorrow,
			},
		},
		{
			feeder: { isDeleted: false },
		},
	];

	// if (query.operatorId) {
	// 	andConditions.push({ operatorId: query.operatorId });
	// }

	// if (query.email) {
	// 	andConditions.push({
	// 		operator: {
	// 			email: query.email,
	// 		},
	// 	});
	// }

	if (query.status) {
		andConditions.push({ status: query.status });
	}

	if (query.feederCode) {
		andConditions.push({ feeder: { code: query.feederCode } });
	}

	if (query.areaCode) {
		andConditions.push({
			feeder: { areas: { some: { code: query.areaCode } } },
		});
	}

	if (query.searchTerm) {
		andConditions.push({
			OR: [
				// Feeder name
				{
					feeder: {
						name: {
							contains: query.searchTerm,
							mode: "insensitive",
						},
					},
				},

				// Feeder code
				{
					feeder: {
						code: {
							contains: query.searchTerm,
							mode: "insensitive",
						},
					},
				},

				// Feeder area name
				{
					feeder: {
						areas: {
							some: {
								name: {
									contains: query.searchTerm,
									mode: "insensitive",
								},
							},
						},
					},
				},

				// Feeder area code
				{
					feeder: {
						areas: {
							some: {
								code: {
									contains: query.searchTerm,
									mode: "insensitive",
								},
							},
						},
					},
				},

				// Operator name
				{
					operator: {
						name: {
							contains: query.searchTerm,
							mode: "insensitive",
						},
					},
				},

				// Operator email
				{
					operator: {
						email: {
							contains: query.searchTerm,
							mode: "insensitive",
						},
					},
				},
			],
		});
	}

	const schedules = await prisma.schedule.findMany({
		where: {
			AND: andConditions,
		},

		take: limit,
		skip,
		orderBy: {
			// sortBy : sortOrder
			[sortBy]: sortOrder,
		},
	});

	const total = await prisma.schedule.count({ where: { AND: andConditions } });

	return {
		data: schedules,
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
};

const getScheduleById = async (scheduleId: string) => {
	const schedule = await prisma.schedule.findUnique({
		where: { id: scheduleId },
		include: {
			operator: {
				select: {
					id: true,
					name: true,
					email: true,
					userId: true,
				},
			},
			feeder: {
				include: {
					areas: {
						where: {
							isDeleted: false,
						},
					},
				},
			},
		},
	});

	if (
		!schedule ||
		schedule.isDeleted ||
		!schedule.feeder ||
		schedule.feeder.isDeleted
	) {
		throw new AppError(httpStatus.NOT_FOUND, "Schedule Not Found");
	}

	return schedule;
};

const getMyAppointedSchedules = async (query: IQuery, user: RequestUser) => {
	console.log("service reached--------------");
	const limit = query.limit ? Number(query.limit) : 10;
	const page = query.page ? Number(query.page) : 1;
	const skip = (page - 1) * limit;
	const sortBy = query.sortBy ? query.sortBy : "createdAt";
	const sortOrder = query.sortOrder ? query.sortOrder : "desc";

	const operator = await prisma.operator.findUnique({
		where: { userId: user.userId },
	});

	if (!operator || operator.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "Operator Profile Not Found");
	}

	const andConditions: ScheduleWhereInput[] = [
		{
			operatorId: operator.id,
		},
		{
			isDeleted: false,
		},
		{
			feeder: {
				isDeleted: false,
			},
		},
	];

	if (query.status) {
		andConditions.push({ status: query.status });
	}

	if (query.feederCode) {
		andConditions.push({ feeder: { code: query.feederCode } });
	}

	if (query.areaCode) {
		andConditions.push({
			feeder: { areas: { some: { code: query.areaCode } } },
		});
	}

	if (query.searchTerm) {
		andConditions.push({
			OR: [
				{
					feeder: {
						name: {
							contains: query.searchTerm,
							mode: "insensitive",
						},
					},
				},
				{
					feeder: {
						code: {
							contains: query.searchTerm,
							mode: "insensitive",
						},
					},
				},
				{
					feeder: {
						areas: {
							some: {
								name: {
									contains: query.searchTerm,
									mode: "insensitive",
								},
							},
						},
					},
				},
				{
					feeder: {
						areas: {
							some: {
								code: {
									contains: query.searchTerm,
									mode: "insensitive",
								},
							},
						},
					},
				},
			],
		});
	}

	const schedules = await prisma.schedule.findMany({
		where: {
			AND: andConditions,
		},

		take: limit,
		skip,
		orderBy: {
			[sortBy]: sortOrder,
		},
		include: {
			feeder: {
				include: {
					areas: true,
				},
			},
		},
	});

	const total = await prisma.schedule.count({ where: { AND: andConditions } });

	return {
		data: schedules,
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
};

const createSchedule = async (
	payload: ICreateSchedulePayload,
	user: RequestUser,
) => {
	const operator = await prisma.operator.findUnique({
		where: { userId: user.userId },
	});

	if (!operator || operator.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "Operator Profile Not Found");
	}

	const feeder = await prisma.feeder.findUnique({
		where: {
			id: payload.feederId,
		},
	});

	if (!feeder || feeder.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "Feeder Not Found!");
	}

	// 25 August => start Time  : 9:00 PM
	// 26 August => end Time : 3:00AM

	// if(!isSameDay(payload.startDateTime, payload.endDateTime)){
	//     throw new AppError(httpStatus.CONFLICT, "Start Date Time And End Date Time Must Be On The Same Day")
	// }

	if (payload.startDateTime < new Date()) {
		throw new AppError(
			httpStatus.CONFLICT,
			"Can not create a schedule in the past",
		);
	}

	if (!isBefore(payload.startDateTime, payload.endDateTime)) {
		throw new AppError(
			httpStatus.CONFLICT,
			"Start Date Time Must Be Before End Date Time",
		);
	}

	const existingScheduleOnThisDate = await prisma.schedule.findFirst({
		where: {
			feederId: payload.feederId,
			isDeleted: false,
			startDateTime: {
				lte: payload.startDateTime,
			},
			endDateTime: {
				gte: payload.endDateTime,
			},
			feeder: {
				isDeleted: false,
			},
			OR: [
				{ status: ScheduleStatus.PUBLISHED },
				{ status: ScheduleStatus.COMPLETED },
			],
		},
	});

	if (existingScheduleOnThisDate) {
		throw new AppError(
			httpStatus.CONFLICT,
			"An existing outage schedule already covers this date and time",
		);
	}

	// const durationInMinutes = differenceInMinutes(
	//     payload.endDateTime,
	//     payload.startDateTime
	// )

	// const MINUTES_ALLOCATED_PER_SLOT = 20

	// const totalSlots = Math.floor(durationInMinutes / MINUTES_ALLOCATED_PER_SLOT)

	// if (totalSlots < 1) {
	//     throw new AppError(
	//         httpStatus.CONFLICT,
	//         `Schedule Must Be At Least ${MINUTES_ALLOCATED_PER_SLOT} Minutes Long To Fit One Slot`,
	//     );
	// }

	const schedule = await prisma.schedule.create({
		data: {
			startDateTime: payload.startDateTime,
			endDateTime: payload.endDateTime,
			reason: payload.reason,
			feederId: payload.feederId,
			operatorId: operator.id,
		},
		include: {
			operator: {
				select: {
					name: true,
					email: true,
					contactNumber: true,
				},
			},
		},
	});

	return schedule;
};

const publishSchedule = async (scheduleId: string, user: RequestUser) => {
	const operator = await prisma.operator.findUnique({
		where: { userId: user.userId },
	});

	if (!operator || operator.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "Operator Profile Not Found");
	}

	const schedule = await prisma.schedule.findUnique({
		where: {
			id: scheduleId,
			operatorId: operator.id,
			feeder: {
				isDeleted: false,
			},
		},
	});

	if (!schedule || schedule.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "Schedule not found");
	}

	if (schedule.status === ScheduleStatus.PUBLISHED) {
		throw new AppError(httpStatus.CONFLICT, "Schedule is already published");
	}

	const existingScheduleOnThisDate = await prisma.schedule.findFirst({
		where: {
			feederId: schedule.feederId,
			isDeleted: false,
			startDateTime: {
				lte: schedule.startDateTime,
			},
			endDateTime: {
				gte: schedule.endDateTime,
			},
			feeder: {
				isDeleted: false,
			},
			OR: [
				{ status: ScheduleStatus.PUBLISHED },
				{ status: ScheduleStatus.COMPLETED },
			],
		},
	});

	if (existingScheduleOnThisDate) {
		throw new AppError(
			httpStatus.CONFLICT,
			"An existing outage schedule already covers this date and time. You may delete this schedule.",
		);
	}

	const publishedSchedule = await prisma.schedule.update({
		where: { id: schedule.id },
		data: { status: ScheduleStatus.PUBLISHED },
	});

	return publishedSchedule;
};

const updateSchedule = async (
	scheduleId: string,
	payload: IUpdateSchedulePayload,
	user: RequestUser,
) => {
	const operator = await prisma.operator.findUnique({
		where: { userId: user.userId },
	});

	if (!operator || operator.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "Operator Profile Not Found");
	}

	const schedule = await prisma.schedule.findUnique({
		where: { id: scheduleId, operatorId: operator.id },
	});

	if (!schedule || schedule.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "Schedule Not Found");
	}

	payload.startDateTime = payload.startDateTime || schedule.startDateTime;
	payload.endDateTime = payload.endDateTime || schedule.endDateTime;

	if (!isBefore(payload.startDateTime, payload.endDateTime)) {
		throw new AppError(
			httpStatus.CONFLICT,
			"Start Date Time Must Be Before End Date Time",
		);
	}

	const existingScheduleOnThisDate = await prisma.schedule.findFirst({
		where: {
			feederId: payload.feederId,
			isDeleted: false,
			startDateTime: {
				lte: payload.startDateTime,
			},
			endDateTime: {
				gte: payload.endDateTime,
			},
			feeder: {
				isDeleted: false,
			},
			OR: [
				{ status: ScheduleStatus.PUBLISHED },
				{ status: ScheduleStatus.COMPLETED },
			],
		},
	});

	if (existingScheduleOnThisDate) {
		throw new AppError(
			httpStatus.CONFLICT,
			"An existing outage schedule already covers this date and time",
		);
	}

	const updatedSchedule = await prisma.schedule.update({
		where: {
			id: schedule.id,
			feeder: {
				isDeleted: false,
			},
		},
		data: {
			startDateTime: payload.startDateTime,
			endDateTime: payload.endDateTime,
			reason: payload.reason,
			feederId: payload.feederId,
		},
		include: {
			operator: {
				select: {
					name: true,
					email: true,
					contactNumber: true,
				},
			},
			feeder: true,
		},
	});

	return updatedSchedule;
};

const deleteSchedule = async (scheduleId: string, user: RequestUser) => {
	const operator = await prisma.operator.findUnique({
		where: { userId: user.userId },
	});

	if (!operator || operator.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "Operator Profile Not Found");
	}

	const schedule = await prisma.schedule.findUnique({
		where: {
			id: scheduleId,
			feeder: {
				isDeleted: false,
			},
		},
	});

	if (!schedule || schedule.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "Schedule Not Found");
	}

	// if (schedule.operatorId !== operator.id && user.role !== Role.ADMIN) {
	// 	throw new AppError(
	// 		httpStatus.UNAUTHORIZED,
	// 		"You are not authorized to delete this outage schedule.",
	// 	);
	// }

	await prisma.schedule.update({
		where: { id: schedule.id },
		data: {
			isDeleted: true,
			deletedBy: user.userId,
			deletedAt: new Date(),
		},
	});

	return;
};

export const ScheduleService = {
	getAllSchedules,
	getTodaysSchedules,
	getScheduleById,
	getMyAppointedSchedules,
	createSchedule,
	publishSchedule,
	updateSchedule,
	deleteSchedule,
};
