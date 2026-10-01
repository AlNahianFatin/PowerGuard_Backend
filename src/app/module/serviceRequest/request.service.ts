import {
	addDays,
	addMinutes,
	isBefore,
	isSameDay,
	startOfDay,
	subHours,
} from "date-fns";
import PDFDocument from "pdfkit";
import httpStatus from "http-status";
import {
	Role,
	ScheduleStatus,
	ServiceRequestStatus,
	TechnicianStatus,
} from "../../../generated/prisma/enums";
import type { ServiceRequestWhereInput } from "../../../generated/prisma/models";
import type { IQuery } from "../../interfaces";
import { prisma } from "../../lib/prisma";
import type { RequestUser } from "../../middleware/checkAuth";
import { AppError } from "../../utils/AppError";
import type {
	IAssignTechnicianPayload,
	IRejectRequestPayload,
	ISubmitRequestPayload,
	IUpdateRequestPayload,
	IUpdateRequestStatusPayload,
} from "./request.interface";
import { UploadApiResponse } from "cloudinary";
import { cloudinary } from "../../lib/cloudinary";
import { transporter } from "../../lib/nodemailer";
import config from "../../config";

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

const getSingleRequest = async (requestId: string, user: RequestUser) => {
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

const assignRequest = async (
	payload: IAssignTechnicianPayload,
	requestId: string,
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

	const assignedByUserId = operator?.userId ?? admin?.id;

	if (!assignedByUserId) {
		throw new AppError(httpStatus.NOT_FOUND, "Your profile not found");
	}

	const { technicianId } = payload;

	const technician = await prisma.technician.findUnique({
		where: {
			id: technicianId,
		},
	});

	if (!technician || technician.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "Technician Profile Not Found");
	}

	if (technician.status !== TechnicianStatus.AVAILABLE) {
		throw new AppError(
			httpStatus.NOT_FOUND,
			`Technician ${technician.name} is not available right now`,
		);
	}

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
		},
	});

	if (!existingRequest || existingRequest.isDeleted) {
		throw new AppError(
			httpStatus.NOT_FOUND,
			"The service request does not exist",
		);
	}

	if (existingRequest.status !== ServiceRequestStatus.PENDING) {
		throw new AppError(
			httpStatus.NOT_FOUND,
			"The request is not in pending state and cannot be assigned now",
		);
	}
	const assignment = await prisma.$transaction(async (tx) => {
		await tx.technician.update({
			where: {
				id: technicianId,
			},
			data: {
				status: TechnicianStatus.ASSIGNED,
			},
		});

		await tx.serviceRequest.update({
			where: {
				id: requestId,
			},
			data: {
				status: ServiceRequestStatus.ASSIGNED,
				assignedAt: new Date(),
			},
		});

		const assignment = await tx.assignment.create({
			data: {
				notes: payload?.notes,
				assigneeId: assignedByUserId,
				technicianId: technician.id,
				serviceRequestId: requestId,
			},
			include: {
				technician: true,
			},
		});

		return assignment;
	});

	return assignment;
};

const updateRequestStatusByTechnician = async (
	assignmentId: string,
	payload: IUpdateRequestStatusPayload,
	user: RequestUser,
) => {
	const technician = await prisma.technician.findUnique({
		where: { userId: user.userId },
	});

	if (!technician || technician.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "Technician Profile Not Found");
	}

	const { status } = payload;

	if (status === ServiceRequestStatus.FAILED && !payload.failureNote) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"For a failed service, you must provide a failure note",
		);
	}

	const existingAssignment = await prisma.assignment.findUnique({
		where: {
			id: assignmentId,
		},
		include: {
			serviceRequest: {
				include: {
					customer: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},
				},
			},
			technicianReport: true,
			payment: true,
			technician: {
				select: {
					id: true,
					name: true,
					email: true,
					status: true,
				},
			},
		},
	});

	if (!existingAssignment || existingAssignment.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "The assignment does not exist");
	}

	if (
		existingAssignment.serviceRequest.status !==
			ServiceRequestStatus.ASSIGNED &&
		status === ServiceRequestStatus.INSPECTING
	) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			`Invalid status update attempt! Cannot update status from ${existingAssignment.serviceRequest.status} to ${status}`,
		);
	}

	if (
		existingAssignment.serviceRequest.status !==
			ServiceRequestStatus.INPROGRESS &&
		(status === ServiceRequestStatus.RESOLVED ||
			status === ServiceRequestStatus.FAILED)
	) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			`Invalid status update attempt! Cannot update status from ${existingAssignment.serviceRequest.status} to ${status}`,
		);
	}

	let uploadedPublicId: string | undefined;
	let uploadResult: UploadApiResponse | undefined;
	let pdfBuffer: Buffer | undefined;
	let transactionCompleted = false;

	try {
		// ------------------- 1. Generate PDF --------------------------
		if (
			status === ServiceRequestStatus.RESOLVED ||
			status === ServiceRequestStatus.FAILED
		) {
			const pdfDocument = new PDFDocument({ margin: 50 });

			const pdfChunks: Buffer[] = [];

			pdfDocument.on("data", (chunk: Buffer) => {
				pdfChunks.push(chunk);
			});

			const pdfReadyPromise = new Promise<Buffer>((resolve) => {
				pdfDocument.on("end", () => {
					resolve(Buffer.concat(pdfChunks));
				});
			});

			pdfDocument.fontSize(20).text("Power Guard", {
				align: "center",
			});

			pdfDocument.fontSize(14).text("Technician Report", {
				align: "center",
			});

			pdfDocument.moveDown(2);

			pdfDocument.text(
				`Service Request ID: ${existingAssignment.serviceRequestId}`,
			);
			pdfDocument
				.fontSize(12)
				.text(
					`Customer Name: ${existingAssignment.serviceRequest.customer.name}`,
				);
			pdfDocument.text(`Technician Name: ${technician.name}`);
			pdfDocument.text(
				`Date: ${new Date().toLocaleTimeString()}, ${new Date().toLocaleDateString()}`,
			);
			pdfDocument.moveDown();

			if (status === ServiceRequestStatus.RESOLVED) {
				pdfDocument.fontSize(14).fillColor("green").text("Issue solved!", {
					align: "center",
				});

				pdfDocument.moveDown();
			}

			if (status === ServiceRequestStatus.FAILED) {
				pdfDocument
					.fontSize(14)
					.fillColor("red")
					.text("Issue could not be solved!", {
						align: "center",
					});

				pdfDocument.moveDown();
			}

			pdfDocument.fillColor("black").fontSize(14).text("Process: ");
			pdfDocument
				.fontSize(12)
				.text(
					`Service Request submitted -> Request approved & assigned technician (to: ${existingAssignment.technician.name}) -> Technician inspected -> ${existingAssignment.technician.name} noted issue & charged -> You paid -> ${existingAssignment.technician.name} started fixing -> ${status === ServiceRequestStatus.RESOLVED ? "Issue fixed!" : `${existingAssignment.technician.name} reported unfixable for him!`}`,
				);
			pdfDocument.moveDown();

			if (existingAssignment?.technicianReport?.diagnosis) {
				pdfDocument.fillColor("black").fontSize(14).text("Diagnosis: ");
				pdfDocument
					.fontSize(12)
					.text(`${existingAssignment?.technicianReport?.diagnosis ?? ""}`);
				pdfDocument.moveDown();
			}

			if (existingAssignment?.technicianReport?.charge) {
				pdfDocument.fontSize(14).text("Charge: ");
				pdfDocument
					.fontSize(12)
					.text(`${existingAssignment?.technicianReport?.charge ?? ""} Tk.`);
				pdfDocument.moveDown();
			}

			if (status === ServiceRequestStatus.FAILED) {
				if (existingAssignment.serviceRequest.failureNote) {
					pdfDocument.fontSize(14).text("Failure Note: ");
					pdfDocument
						.fontSize(12)
						.fillColor("red")
						.text(`${existingAssignment.serviceRequest.failureNote ?? ""}`);
					pdfDocument.moveDown();
				}

				pdfDocument
					.fontSize(14)
					.fillColor("green")
					.text("Your account has been refunded successfully", {
						align: "center",
					});
				pdfDocument.moveDown();
			}

			pdfDocument.end();

			pdfBuffer = await pdfReadyPromise;

			// ------------------- 2. Upload to Cloudinary -----------------------
			uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
				cloudinary.uploader
					.upload_stream(
						{
							resource_type: "raw",
							format: "pdf",
						},
						(error, result) => {
							if (error) {
								return reject(error);
							}

							if (!result) {
								return reject(
									new AppError(
										httpStatus.INTERNAL_SERVER_ERROR,
										"No Result Returned From Cloudinary",
									),
								);
							}

							resolve(result);
						},
					)
					.end(pdfBuffer);
			});

			uploadedPublicId = uploadResult.public_id;
		}

		// ------------------- 3. Database transaction ---------------------
		const updatedData = await prisma.$transaction(async (tx) => {
			const updatedRequest = await tx.serviceRequest.update({
				where: {
					id: existingAssignment.serviceRequestId,
				},
				data: {
					status,

					...(status === ServiceRequestStatus.INSPECTING && {
						inspectedAt: new Date(),
					}),

					...(status === ServiceRequestStatus.RESOLVED && {
						resolvedAt: new Date(),
					}),

					...(status === ServiceRequestStatus.FAILED && {
						failureNote: payload.failureNote,
					}),
				},
			});

			if (
				status === ServiceRequestStatus.RESOLVED ||
				status === ServiceRequestStatus.FAILED
			) {
				await tx.technician.update({
					where: {
						id: technician.id,
					},
					data: {
						status: TechnicianStatus.AVAILABLE,
					},
				});

				if (!uploadResult) {
					throw new AppError(
						httpStatus.INTERNAL_SERVER_ERROR,
						"Technician report upload was not completed",
					);
				}

				const updatedAssignment = await tx.assignment.update({
					where: {
						id: assignmentId,
					},
					data: {
						reportPublicId: uploadResult.public_id,
						reportUrl: uploadResult.secure_url,
					},
				});

				return updatedAssignment;
			}

			return updatedRequest;
		});

		transactionCompleted = true;

		// -------------------- 4. Send email ----------------------
		if (
			(status === ServiceRequestStatus.RESOLVED ||
				status === ServiceRequestStatus.FAILED) &&
			pdfBuffer
		) {
			await transporter.sendMail({
				from: config.email_sender,
				to: existingAssignment.serviceRequest.customer.email,
				subject: "Your Service Report - Power Guard",
				text: "Please find your report attached.",
				attachments: [
					{
						filename: "report.pdf",
						content: pdfBuffer,
					},
				],
			});
		}

		return updatedData;
	} catch (error) {
		// ------------------------ 1. Clear cloudinary -----------------------
		if (uploadedPublicId) {
			try {
				await cloudinary.uploader.destroy(uploadedPublicId, {
					resource_type: "raw",
				});
			} catch (cleanupError) {
				console.error("Failed to cleanup Cloudinary file:", cleanupError);
			}
		}

		// ------------------------ 2. Rollback db ------------------------
		if (transactionCompleted) {
			try {
				await prisma.$transaction(async (tx) => {
					await tx.serviceRequest.update({
						where: {
							id: existingAssignment.serviceRequestId,
						},
						data: {
							status: existingAssignment.serviceRequest.status,

							...(status === ServiceRequestStatus.INSPECTING && {
								inspectedAt: existingAssignment.serviceRequest.inspectedAt,
							}),

							...(status === ServiceRequestStatus.RESOLVED && {
								resolvedAt: existingAssignment.serviceRequest.resolvedAt,
							}),

							...(status === ServiceRequestStatus.FAILED && {
								failureNote: existingAssignment.serviceRequest.failureNote,
							}),
						},
					});

					if (
						status === ServiceRequestStatus.RESOLVED ||
						status === ServiceRequestStatus.FAILED
					) {
						await tx.technician.update({
							where: {
								id: technician.id,
							},
							data: {
								status: existingAssignment.technician.status,
							},
						});
					}

					await tx.assignment.update({
						where: {
							id: assignmentId,
						},
						data: {
							reportPublicId: existingAssignment.reportPublicId,
							reportUrl: existingAssignment.reportUrl,
						},
					});
				});
			} catch (rollbackError) {
				console.error("Failed to compensate database changes:", rollbackError);
			}
		}

		throw error;
	}
};

export const RequestService = {
	getAllRequests,
	getSingleRequest,
	getMyRequests,
	submitRequest,
	updateRequest,
	cancelRequest,
	rejectRequest,
	assignRequest,
	updateRequestStatusByTechnician,
};
