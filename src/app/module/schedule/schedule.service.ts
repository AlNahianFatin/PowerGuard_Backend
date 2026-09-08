import {
	addDays,
	differenceInMinutes,
	isAfter,
	isSameDay,
	startOfDay,
} from "date-fns";
import httpStatus from "http-status";
import { ScheduleStatus } from "../../../generated/prisma/enums";
import { ScheduleWhereInput } from "../../../generated/prisma/models";
import { IQuery } from "../../interfaces";
import { prisma } from "../../lib/prisma";
import { RequestUser } from "../../middleware/checkAuth";
import { AppError } from "../../utils/AppError";
import {
	ICreateSchedulePayload,
	IUpdateSchedulePayload,
} from "./schedule.interface";

const createSchedule = async (
	payload: ICreateSchedulePayload,
	user: RequestUser,
) => {
	const operator = await prisma.operator.findUnique({
		where: { userId: user.userId },
	});

	if (!operator) {
		throw new AppError(httpStatus.NOT_FOUND, "Operator Profile Not Found");
	}

	// 25 August => start Time  : 9:00 PM
	// 26 August => end Time : 3:00AM

	// if(!isSameDay(payload.startDateTime, payload.endDateTime)){
	//     throw new AppError(httpStatus.CONFLICT, "Start Date Time And End Date Time Must Be On The Same Day")
	// }
	if (isAfter(payload.startDateTime, payload.endDateTime)) {
		// 25 August =>  3:00 PM - 9:00 PM

		throw new AppError(
			httpStatus.CONFLICT,
			"Start Date Time Cannot Be After End Date Time",
		);
	}

	//startDateTime = 2026-08-25T13:30:00.436Z => 1:30 PM
	const startOfTheDay = startOfDay(payload.startDateTime); // 25 August => 12:00 AM => 2026-08-25T00:00:00.436Z
	const startOfNextDay = addDays(startOfTheDay, 1); // 26 August => 12:00 AM => 2026-08-26T00:00:00.436Z

	const existingScheduleOnThisDate = await prisma.schedule.findFirst({
		where: {
			feederId: payload.feederId,
			isDeleted: false,
			startDateTime: {
				gte: startOfTheDay,
				lt: startOfNextDay,
			},
		},
	});

	if (existingScheduleOnThisDate) {
		throw new AppError(
			httpStatus.CONFLICT,
			"A schedule for this date and time has already been published",
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

const getMyAppointedSchedules = async (query: IQuery, user: RequestUser) => {
	const limit = query.limit ? Number(query.limit) : 10;
	const page = query.page ? Number(query.page) : 1;
	const skip = (page - 1) * limit;
	const sortBy = query.sortBy ? query.sortBy : "createdAt";
	const sortOrder = query.sortOrder ? query.sortOrder : "desc";

	const operator = await prisma.operator.findUnique({
		where: { userId: user.userId },
	});

	if (!operator) {
		throw new AppError(httpStatus.NOT_FOUND, "Operator Profile Not Found");
	}

	const andConditions: ScheduleWhereInput[] = [
		{
			operatorId: operator.id,
		},
		{
			isDeleted: false,
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

const getAllSchedules = async (query: IQuery) => {
	const limit = query.limit ? Number(query.limit) : 10;
	const page = query.page ? Number(query.page) : 1;
	const skip = (page - 1) * limit;
	const sortBy = query.sortBy ? query.sortBy : "createdAt";
	const sortOrder = query.sortOrder ? query.sortOrder : "desc";

	const andConditions: ScheduleWhereInput[] = [];

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
					areas: true,
				},
			},
		},
	});

	if (!schedule || schedule.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "Schedule Not Found");
	}

	return schedule;
};

const updateSchedule = async (
	scheduleId: string,
	payload: IUpdateSchedulePayload,
	user: RequestUser,
) => {
	const operator = await prisma.operator.findUnique({
		where: { userId: user.userId },
	});

	if (!operator) {
		throw new AppError(httpStatus.NOT_FOUND, "Operator Profile Not Found");
	}

	const schedule = await prisma.schedule.findUnique({
		where: { id: scheduleId, operatorId: operator.id },
	});

	if (!schedule || schedule.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "Schedule Not Found");
	}

	// if (schedule.status === ScheduleStatus.PUBLISHED) {
	// 	throw new AppError(
	// 		httpStatus.CONFLICT,
	// 		"Schedule Once Published And Appointment Booked Cannot Be Updated",
	// 	);
	// }

	// if (schedule.doctorId !== doctor.id) {
	//     throw new AppError(
	//         httpStatus.FORBIDDEN,
	//         "You Are Not Allowed To Update This Schedule",
	//     );
	// }

	// const updateData : IUpdateSchedulePayload = {};

	// if(payload.meetingLink){
	//     updateData.meetingLink = payload.meetingLink || schedule.meetingLink
	// }

	// payload.meetingLink = payload.meetingLink || schedule.meetingLink;
	payload.startDateTime = payload.startDateTime || schedule.startDateTime;
	payload.endDateTime = payload.endDateTime || schedule.endDateTime;

	// 25 August => start Time  : 9:00 PM
	// 26 August => end Time : 3:00AM

	// if (!isSameDay(payload.startDateTime, payload.endDateTime)) {
	// 	throw new AppError(
	// 		httpStatus.CONFLICT,
	// 		"Start Date Time And End Date Time Must Be On The Same Day",
	// 	);
	// }

	if (isAfter(payload.startDateTime, payload.endDateTime)) {
		// 25 August =>  3:00 PM - 9:00 PM

		throw new AppError(
			httpStatus.CONFLICT,
			"Start Date Time Cannot Be After End Date Time",
		);
	}

	//startDateTime = 2026-08-25T13:30:00.436Z => 1:30 PM
	const startOfTheDay = startOfDay(payload.startDateTime); // 25 August => 12:00 AM => 2026-08-25T00:00:00.436Z
	const startOfNextDay = addDays(startOfTheDay, 1); // 26 August => 12:00 AM => 2026-08-26T00:00:00.436Z

	const existingScheduleOnThisDate = await prisma.schedule.findFirst({
		where: {
			feederId: payload.feederId,
			isDeleted: false,
			startDateTime: {
				gte: startOfTheDay,
				lt: startOfNextDay,
			},
		},
	});

	if (existingScheduleOnThisDate) {
		throw new AppError(
			httpStatus.CONFLICT,
			"A schedule for this date and time has already been published",
		);
	}

	// const durationInMinutes = differenceInMinutes(
	// 	payload.endDateTime,
	// 	payload.startDateTime,
	// );

	// const MINUTES_ALLOCATED_PER_SLOT = 20;

	// const totalSlots = Math.floor(durationInMinutes / MINUTES_ALLOCATED_PER_SLOT);

	// if (totalSlots < 1) {
	// 	throw new AppError(
	// 		httpStatus.CONFLICT,
	// 		`Schedule Must Be At Least ${MINUTES_ALLOCATED_PER_SLOT} Minutes Long To Fit One Slot`,
	// 	);
	// }

	const updatedSchedule = await prisma.schedule.update({
		where: {
			id: schedule.id,
		},
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

	return updatedSchedule;
};

const publishSchedule = async (scheduleId: string, user: RequestUser) => {
	const operator = await prisma.operator.findUnique({
		where: { userId: user.userId },
	});

	if (!operator) {
		throw new AppError(httpStatus.NOT_FOUND, "Operator Profile Not Found");
	}

	const schedule = await prisma.schedule.findUnique({
		where: { id: scheduleId, operatorId: operator.id },
	});

	if (!schedule || schedule.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "Schedule Not Found");
	}

	if (schedule.status === ScheduleStatus.PUBLISHED) {
		throw new AppError(httpStatus.CONFLICT, "Schedule Is Already Published");
	}

	const publishedSchedule = await prisma.schedule.update({
		where: { id: schedule.id },
		data: { status: ScheduleStatus.PUBLISHED },
	});

	return publishedSchedule;
};

const deleteSchedule = async (scheduleId: string, user: RequestUser) => {
	const operator = await prisma.operator.findUnique({
		where: { userId: user.userId },
	});

	if (!operator) {
		throw new AppError(httpStatus.NOT_FOUND, "Doctor Profile Not Found");
	}

	const schedule = await prisma.schedule.findUnique({
		where: { id: scheduleId },
	});

	if (!schedule || schedule.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "Schedule Not Found");
	}

	// if (
	// 	schedule.status === ScheduleStatus.PUBLISHED &&
	// 	schedule.totalSlots !== schedule.availableSlots
	// ) {
	// 	throw new AppError(
	// 		httpStatus.CONFLICT,
	// 		"Schedule Once Published And Appoinement Booked Cannot Be Deleted",
	// 	);
	// }

	const deletedSchedule = await prisma.schedule.update({
		where: { id: schedule.id },
		data: { isDeleted: true, deletedAt: new Date() },
	});

	return deletedSchedule;
};

const getTodaysSchedules = async (query: IQuery) => {
	// if (!query.operatorId) {
	// 	throw new AppError(
	// 		httpStatus.NOT_FOUND,
	// 		"Operator Id Must Be Provided In Query",
	// 	);
	// }

	// const operator = await prisma.operator.findUnique({
	// 	where: { id: query.operatorId },
	// });

	// if (!operator) {
	// 	throw new AppError(httpStatus.NOT_FOUND, "Operator Profile Not Found");
	// }

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
				lt: startOfTomorrow,
				gt: now,
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

export const ScheduleServices = {
	createSchedule,
	getMyAppointedSchedules,
	getAllSchedules,
	getScheduleById,
	updateSchedule,
	publishSchedule,
	deleteSchedule,
	getTodaysSchedules,
};
