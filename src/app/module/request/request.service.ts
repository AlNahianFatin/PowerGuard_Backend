import { addDays, startOfDay } from "date-fns";
import httpStatus from "http-status";
import {
	Role,
	ScheduleStatus,
	ServiceRequestStatus,
} from "../../../generated/prisma/enums";
import type { ServiceRequestWhereInput } from "../../../generated/prisma/models";
import type { IQuery } from "../../interfaces";
import { prisma } from "../../lib/prisma";
import type { RequestUser } from "../../middleware/checkAuth";
import { AppError } from "../../utils/AppError";
import type {
	IRejectRequestPayload,
	ISubmitRequestPayload,
	IUpdateRequestPayload,
} from "./request.interface";

const getAllRequests = async (query: IQuery, user: RequestUser) => {
	const limit = query.limit ? Number(query.limit) : 10;
	const page = query.page ? Number(query.page) : 1;
	const skip = (page - 1) * limit;
	const sortBy = query.sortBy ? query.sortBy : "createdAt";
	const sortOrder = query.sortOrder ? query.sortOrder : "desc";

	const andConditions: ServiceRequestWhereInput[] = [];

	if (
		user.role !== Role.ADMIN &&
		user.role !== Role.OPERATOR &&
		query.isDeleted
	) {
		throw new AppError(
			httpStatus.UNAUTHORIZED,
			"You cannot view deleted service requests",
		);
	}

	const isTrue = (value: unknown) => value === true || value === "true";

	const statusFilters = [
		{
			value: isTrue(query.isCancelled),
			status: ServiceRequestStatus.CANCELLED,
		},
		{
			value: isTrue(query.isRejected),
			status: ServiceRequestStatus.REJECTED,
		},
		{
			value: isTrue(query.isFailed),
			status: ServiceRequestStatus.FAILED,
		},
		{
			value: isTrue(query.isResolved),
			status: ServiceRequestStatus.RESOLVED,
		},
	];

	const selectedStatusFilters = statusFilters.filter((filter) => filter.value);

	let numOfFilters = selectedStatusFilters.length;

	if (query.status) {
		numOfFilters++;
	}

	if (isTrue(query.isDeleted)) {
		numOfFilters++;
	}

	if (numOfFilters > 1) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"You can only filter by one service request status at a time",
		);
	}

	if (selectedStatusFilters.length === 1) {
		andConditions.push({
			status: selectedStatusFilters[0].status,
		});
	}

	if (query.status) {
		andConditions.push({ status: query.status });
	}

	if (isTrue(query.isDeleted)) {
		andConditions.push({
			isDeleted: true,
		});
	}

	if (query.customerId) {
		andConditions.push({ customerId: query.customerId });
	}

	if (query.areaId) {
		andConditions.push({ areaId: query.areaId });
	}

	if (query.areaCode) {
		andConditions.push({
			area: {
				code: query.areaCode,
			},
		});
	}

	if (query.searchTerm) {
		andConditions.push({
			OR: [
				{
					title: {
						contains: query.searchTerm,
						mode: "insensitive",
					},
				},
				{
					description: {
						contains: query.searchTerm,
						mode: "insensitive",
					},
				},
				{
					failureNote: {
						contains: query.searchTerm,
						mode: "insensitive",
					},
				},
				{
					rejectionReason: {
						contains: query.searchTerm,
						mode: "insensitive",
					},
				},

				{
					customer: {
						name: {
							contains: query.searchTerm,
							mode: "insensitive",
						},
					},
				},
				{
					customer: {
						email: {
							contains: query.searchTerm,
							mode: "insensitive",
						},
					},
				},

				{
					area: {
						name: {
							contains: query.searchTerm,
							mode: "insensitive",
						},
					},
				},
				{
					area: {
						code: {
							contains: query.searchTerm,
							mode: "insensitive",
						},
					},
				},

				{
					area: {
						feeder: {
							name: {
								contains: query.searchTerm,
								mode: "insensitive",
							},
						},
					},
				},
				{
					area: {
						feeder: {
							code: {
								contains: query.searchTerm,
								mode: "insensitive",
							},
						},
					},
				},

				{
					assignment: {
						assignedByUser: {
							name: {
								contains: query.searchTerm,
								mode: "insensitive",
							},
						},
					},
				},
				{
					assignment: {
						assignedByUser: {
							email: {
								contains: query.searchTerm,
								mode: "insensitive",
							},
						},
					},
				},

				{
					assignment: {
						technician: {
							name: {
								contains: query.searchTerm,
								mode: "insensitive",
							},
						},
					},
				},
				{
					assignment: {
						technician: {
							email: {
								contains: query.searchTerm,
								mode: "insensitive",
							},
						},
					},
				},
			],
		});
	}

	const requests = await prisma.serviceRequest.findMany({
		where: { AND: andConditions },
		take: limit,
		skip,
		orderBy: { [sortBy]: sortOrder },
		include: {
			customer: { select: { id: true, name: true, email: true } },
			area: {
				include: {
					feeder: true,
				},
			},
			assignment: {
				include: {
					assignedByUser: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},
					technician: true,
					payment: true,
				},
			},
		},
	});

	const total = await prisma.serviceRequest.count({
		where: { AND: andConditions },
	});

	return {
		data: requests,
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
};

const getSingleRequest = async (requestId: string) => {
	const request = await prisma.serviceRequest.findUnique({
		where: { id: requestId },
		include: {
			customer: { select: { id: true, name: true, email: true } },
			area: {
				include: {
					feeder: true,
				},
			},
			assignment: {
				include: {
					assignedByUser: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},
					technician: true,
					payment: true,
				},
			},
		},
	});

	if (!request || request.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "Service request Not Found");
	}

	return request;
};

const getMyRequests = async (query: IQuery, user: RequestUser) => {
	const limit = query.limit ? Number(query.limit) : 10;
	const page = query.page ? Number(query.page) : 1;
	const skip = (page - 1) * limit;
	const sortBy = query.sortBy ? query.sortBy : "createdAt";
	const sortOrder = query.sortOrder ? query.sortOrder : "desc";

	const customer = await prisma.customer.findUnique({
		where: { userId: user.userId },
	});

	if (!customer || customer.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "Customer Profile Not Found");
	}

	const andConditions: ServiceRequestWhereInput[] = [
		{
			customerId: customer.id,
		},
		{
			isDeleted: false,
		},
	];

	const isTrue = (value: unknown) => value === true || value === "true";

	const statusFilters = [
		{
			value: isTrue(query.isCancelled),
			status: ServiceRequestStatus.CANCELLED,
		},
		{
			value: isTrue(query.isRejected),
			status: ServiceRequestStatus.REJECTED,
		},
		{
			value: isTrue(query.isFailed),
			status: ServiceRequestStatus.FAILED,
		},
		{
			value: isTrue(query.isResolved),
			status: ServiceRequestStatus.RESOLVED,
		},
	];

	const selectedStatusFilters = statusFilters.filter((filter) => filter.value);

	let numOfFilters = selectedStatusFilters.length;

	if (query.status) {
		numOfFilters++;
	}

	if (numOfFilters > 1) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"You can only filter by one service request status at a time",
		);
	}

	if (selectedStatusFilters.length === 1) {
		andConditions.push({
			status: selectedStatusFilters[0].status,
		});
	}

	if (query.status) {
		andConditions.push({ status: query.status });
	}

	if (query.areaId) {
		andConditions.push({ areaId: query.areaId });
	}

	if (query.areaCode) {
		andConditions.push({
			area: {
				code: query.areaCode,
			},
		});
	}

	if (query.searchTerm) {
		andConditions.push({
			OR: [
				{
					title: {
						contains: query.searchTerm,
						mode: "insensitive",
					},
				},
				{
					description: {
						contains: query.searchTerm,
						mode: "insensitive",
					},
				},
				{
					failureNote: {
						contains: query.searchTerm,
						mode: "insensitive",
					},
				},
				{
					rejectionReason: {
						contains: query.searchTerm,
						mode: "insensitive",
					},
				},
				{
					area: {
						name: {
							contains: query.searchTerm,
							mode: "insensitive",
						},
					},
				},
				{
					area: {
						code: {
							contains: query.searchTerm,
							mode: "insensitive",
						},
					},
				},
				{
					area: {
						feeder: {
							name: {
								contains: query.searchTerm,
								mode: "insensitive",
							},
						},
					},
				},
				{
					area: {
						feeder: {
							code: {
								contains: query.searchTerm,
								mode: "insensitive",
							},
						},
					},
				},
				{
					assignment: {
						technician: {
							name: {
								contains: query.searchTerm,
								mode: "insensitive",
							},
						},
					},
				},
				{
					assignment: {
						technician: {
							email: {
								contains: query.searchTerm,
								mode: "insensitive",
							},
						},
					},
				},
			],
		});
	}

	const requests = await prisma.serviceRequest.findMany({
		where: { AND: andConditions },
		take: limit,
		skip,
		orderBy: { [sortBy]: sortOrder },
		include: {
			customer: { select: { id: true, name: true, email: true } },
			area: {
				include: {
					feeder: true,
				},
			},
			assignment: {
				include: {
					assignedByUser: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},
					technician: true,
					payment: true,
				},
			},
		},
	});

	const total = await prisma.serviceRequest.count({
		where: { AND: andConditions },
	});

	return {
		data: requests,
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
};

const submitRequest = async (
	payload: ISubmitRequestPayload,
	user: RequestUser,
) => {
	const customer = await prisma.customer.findUnique({
		where: { userId: user.userId },
	});

	if (!customer || customer.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "Customer Profile Not Found");
	}

	const now = new Date();
	const startOfToday = startOfDay(now);
	const startOfTomorrow = addDays(startOfToday, 1);

	const area = await prisma.area.findUnique({
		where: {
			id: payload.areaId,
		},
	});

	if (!area || area.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "Area not found");
	}

	const schedule = await prisma.schedule.findFirst({
		where: {
			startDateTime: {
				lte: now,
			},
			endDateTime: {
				lt: startOfTomorrow,
			},
			feederId: area.feederId,
		},
	});

	if (!schedule?.isDeleted && schedule?.status === ScheduleStatus.PUBLISHED) {
		throw new AppError(
			httpStatus.CONFLICT,
			`Currently a scheduled outage is going on your area. Please have patience till ${schedule.endDateTime}`,
		);
	}

	const existingRequest = await prisma.serviceRequest.findFirst({
		where: {
			customerId: customer.id,
			areaId: payload.areaId,
			status: {
				notIn: [
					ServiceRequestStatus.CANCELLED,
					ServiceRequestStatus.REJECTED,
					ServiceRequestStatus.FAILED,
					ServiceRequestStatus.RESOLVED,
				],
			},
		},
	});

	if (existingRequest) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"You have already requested for a service",
		);
	}

	const request = await prisma.serviceRequest.create({
		data: {
			...payload,
			customerId: customer.id,
		},
	});

	return request;
};

const updateRequest = async (
	payload: IUpdateRequestPayload,
	requestId: string,
	user: RequestUser,
) => {
	const customer = await prisma.customer.findUnique({
		where: { userId: user.userId },
	});

	if (!customer || customer.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "Customer Profile Not Found");
	}

	if (payload.areaId) {
		const area = await prisma.area.findUnique({
			where: {
				id: payload.areaId,
			},
		});

		if (!area || area.isDeleted) {
			throw new AppError(httpStatus.NOT_FOUND, "Area not found");
		}
	}

	const existingRequest = await prisma.serviceRequest.findUnique({
		where: {
			id: requestId,
		},
		include: {
			assignment: {
				include: {
					payment: true,
				},
			},
		},
	});

	if (!existingRequest || existingRequest.isDeleted) {
		throw new AppError(
			httpStatus.NOT_FOUND,
			"Your service request does not exist",
		);
	}

	if (existingRequest.customerId !== customer.id) {
		throw new AppError(
			httpStatus.UNAUTHORIZED,
			"You are not authorized to update this request",
		);
	}

	if (existingRequest.status === ServiceRequestStatus.CANCELLED) {
		throw new AppError(
			httpStatus.CONFLICT,
			"You have already cancelled this service request",
		);
	}

	if (existingRequest.status === ServiceRequestStatus.REJECTED) {
		throw new AppError(
			httpStatus.CONFLICT,
			`Your request has been rejected by an operator and cannot be updated. Rejection reason: ${existingRequest?.rejectionReason}`,
		);
	}

	if (existingRequest.status === ServiceRequestStatus.FAILED) {
		throw new AppError(
			httpStatus.CONFLICT,
			`Your service was failed. Failure note: ${existingRequest?.failureNote}`,
		);
	}

	if (existingRequest.status === ServiceRequestStatus.RESOLVED) {
		throw new AppError(
			httpStatus.CONFLICT,
			"Your service request has already been resolved",
		);
	}

	if (existingRequest.status !== ServiceRequestStatus.PENDING) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Your request is already being processed and cannot be updated",
		);
	}

	const updatedRequest = await prisma.serviceRequest.update({
		where: {
			id: existingRequest.id,
		},
		data: {
			...payload,
		},
	});

	return updatedRequest;
};

const cancelRequest = async (requestId: string, user: RequestUser) => {
	const customer = await prisma.customer.findUnique({
		where: { userId: user.userId },
	});

	if (!customer || customer.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "Customer Profile Not Found");
	}

	const existingRequest = await prisma.serviceRequest.findUnique({
		where: {
			id: requestId,
		},
		include: {
			assignment: {
				include: {
					payment: true,
				},
			},
		},
	});

	if (!existingRequest || existingRequest.isDeleted) {
		throw new AppError(
			httpStatus.NOT_FOUND,
			"Your service request does not exist",
		);
	}

	if (existingRequest.customerId !== customer.id) {
		throw new AppError(
			httpStatus.UNAUTHORIZED,
			"You are not authorized to cancel this request",
		);
	}

	if (existingRequest.status === ServiceRequestStatus.CANCELLED) {
		throw new AppError(
			httpStatus.CONFLICT,
			"You have already cancelled this service request",
		);
	}

	if (existingRequest.status === ServiceRequestStatus.REJECTED) {
		throw new AppError(
			httpStatus.CONFLICT,
			`Your request has been rejected by an operator and cannot be cancelled. Rejection reason: ${existingRequest?.rejectionReason}`,
		);
	}

	if (existingRequest.status === ServiceRequestStatus.FAILED) {
		throw new AppError(
			httpStatus.CONFLICT,
			`Your service was failed. Failure note: ${existingRequest?.failureNote}`,
		);
	}

	if (existingRequest.status === ServiceRequestStatus.RESOLVED) {
		throw new AppError(
			httpStatus.CONFLICT,
			"Your service request has already been resolved",
		);
	}

	if (
		existingRequest.status !== ServiceRequestStatus.PENDING &&
		existingRequest.status !== ServiceRequestStatus.ASSIGNED
	) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"You cannot cancel an ongoing service",
		);
	}

	const cancelledRequest = await prisma.serviceRequest.update({
		where: {
			id: existingRequest.id,
		},
		data: {
			status: ServiceRequestStatus.CANCELLED,
		},
	});

	return cancelledRequest;
};

const rejectRequest = async (
	requestId: string,
	payload: IRejectRequestPayload,
	user: RequestUser,
) => {
	const operator = await prisma.operator.findUnique({
		where: { userId: user.userId },
	});

	const admin = await prisma.user.findUnique({
		where: {
			id: user.userId,
			role: Role.ADMIN,
		},
	});

	if ((!operator || operator.isDeleted) && (!admin || admin.isDeleted)) {
		throw new AppError(httpStatus.NOT_FOUND, "Your profile not found");
	}

	const rejectedByUserId = operator?.userId ?? admin?.id;

	const existingRequest = await prisma.serviceRequest.findUnique({
		where: {
			id: requestId,
		},
		include: {
			assignment: {
				include: {
					technician: true,
					payment: true,
				},
			},
			rejectedByUser: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},
		},
	});

	if (!existingRequest || existingRequest.isDeleted) {
		throw new AppError(
			httpStatus.NOT_FOUND,
			"The service request does not exist",
		);
	}

	if (existingRequest.status === ServiceRequestStatus.ASSIGNED) {
		throw new AppError(
			httpStatus.CONFLICT,
			`The service request has already been assigned to ${existingRequest.assignment?.technician?.name}`,
		);
	}

	if (existingRequest.status === ServiceRequestStatus.RESOLVED) {
		throw new AppError(
			httpStatus.NOT_FOUND,
			"The service request has already been resolved",
		);
	}

	if (existingRequest.status === ServiceRequestStatus.FAILED) {
		throw new AppError(
			httpStatus.NOT_FOUND,
			`${existingRequest.assignment?.technician?.name} has already stated that the service was failed. Failure note: ${existingRequest?.failureNote}`,
		);
	}

	if (existingRequest.status === ServiceRequestStatus.REJECTED) {
		throw new AppError(
			httpStatus.NOT_FOUND,
			`The request has already been rejected by ${existingRequest?.rejectedByUser?.name}. Rejection reason: ${existingRequest?.rejectionReason}`,
		);
	}

	if (existingRequest.status === ServiceRequestStatus.CANCELLED) {
		throw new AppError(
			httpStatus.NOT_FOUND,
			"The customer has already cancelled their service request",
		);
	}

	if (existingRequest.status !== ServiceRequestStatus.PENDING) {
		throw new AppError(
			httpStatus.UNAUTHORIZED,
			"You can not reject an ongoing service",
		);
	}

	const rejectedRequest = await prisma.serviceRequest.update({
		where: {
			id: existingRequest.id,
		},
		data: {
			status: ServiceRequestStatus.REJECTED,
			rejectionReason: payload.rejectionReason,
			rejectedBy: rejectedByUserId,
		},
	});

	return rejectedRequest;
};

export const RequestService = {
	getAllRequests,
	getSingleRequest,
	getMyRequests,
	submitRequest,
	updateRequest,
	cancelRequest,
	rejectRequest,
};
