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

	if (user.role !== Role.ADMIN && user.role !== Role.OPERATOR) {
		andConditions.push({ isDeleted: false });
	}

	if (query.status) {
		andConditions.push({ status: query.status });
	}

	if (query.isFailed) {
		andConditions.push({ status: ServiceRequestStatus.FAILED });
	}

	if (query.isRejected) {
		andConditions.push({ status: ServiceRequestStatus.REJECTED });
	}

	if (query.isResolved) {
		andConditions.push({ status: ServiceRequestStatus.RESOLVED });
	}

	if (
		(user.role === Role.ADMIN || user.role === Role.OPERATOR) &&
		query.isDeleted
	) {
		andConditions.push({ isDeleted: Boolean(query.isDeleted) });
	}

	if (
		(user.role === Role.TECHNICIAN || user.role === Role.CUSTOMER) &&
		query.deletedBy
	) {
		throw new AppError(
			httpStatus.CONFLICT,
			"You cannot view deleted outage requests",
		);
	}

	if (
		(user.role === Role.ADMIN || user.role === Role.OPERATOR) &&
		query.deletedBy
	) {
		andConditions.push({ deletedBy: query.deletedBy });
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
					user: {
						name: {
							contains: query.searchTerm,
							mode: "insensitive",
						},
						email: {
							contains: query.searchTerm,
							mode: "insensitive",
						},
					},
				},
				{
					customer: {
						name: {
							contains: query.searchTerm,
							mode: "insensitive",
						},
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
							code: {
								contains: query.searchTerm,
								mode: "insensitive",
							},
						},
					},
				},
				{
					assignment: {
						operator: {
							name: {
								contains: query.searchTerm,
								mode: "insensitive",
							},
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
			user: { select: { id: true, name: true, email: true } },
			area: {
				include: {
					feeder: true,
				},
			},
			assignment: {
				include: {
					operator: true,
					customer: true,
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
			user: { select: { id: true, name: true, email: true } },
			area: {
				include: {
					feeder: true,
				},
			},
			assignment: {
				include: {
					operator: true,
					customer: true,
					payment: true,
				},
			},
		},
	});

	if (!request || request.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "Outage request Not Found");
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
			customerId: user.userId,
		},
		{
			isDeleted: false,
		},
	];

	if (query.status) {
		andConditions.push({ status: query.status });
	}

	if (query.isFailed) {
		andConditions.push({ status: ServiceRequestStatus.FAILED });
	}

	if (query.isRejected) {
		andConditions.push({ status: ServiceRequestStatus.REJECTED });
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
			user: { select: { id: true, name: true, email: true } },
			area: {
				include: {
					feeder: true,
				},
			},
			assignment: {
				include: {
					operator: true,
					customer: true,
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
		include: {
			feeder: true,
		},
	});

	if (!area || area.feeder.isDeleted) {
		throw new AppError(
			httpStatus.NOT_FOUND,
			"Area or feeder for that area not found",
		);
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
			customerId: user.userId,
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
			customerId: user.userId,
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
			schedule: true,
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

	if (
		existingRequest.status !== ServiceRequestStatus.PENDING &&
		existingRequest.status !== ServiceRequestStatus.ASSIGNED
	) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Your request is already being processed",
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
			schedule: true,
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

	if (!operator || operator.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "Operator Profile Not Found");
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
			schedule: true,
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
			httpStatus.NOT_FOUND,
			`The request has already been assigned to ${existingRequest.assignment?.technician?.name}`,
		);
	}

	if (existingRequest.status === ServiceRequestStatus.RESOLVED) {
		throw new AppError(
			httpStatus.NOT_FOUND,
			"The request has already been resolved",
		);
	}

	if (existingRequest.status === ServiceRequestStatus.FAILED) {
		throw new AppError(
			httpStatus.NOT_FOUND,
			`${existingRequest.assignment?.technician?.name} has already stated that the service has been failed`,
		);
	}

	if (existingRequest.status === ServiceRequestStatus.REJECTED) {
		throw new AppError(
			httpStatus.NOT_FOUND,
			"The request has already been rejected",
		);
	}

	if (existingRequest.status === ServiceRequestStatus.CANCELLED) {
		throw new AppError(
			httpStatus.NOT_FOUND,
			"Customer has already cancelled their service request",
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

	if (!operator || operator.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "Operator Profile Not Found");
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
			schedule: true,
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
				operatorId: operator.id,
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
			serviceRequest: true,
			payment: true,
		},
	});

	if (!existingAssignment || existingAssignment.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "The assignment does not exist");
	}

	if (
		status === ServiceRequestStatus.INSPECTING &&
		existingAssignment.serviceRequest.status !== ServiceRequestStatus.ASSIGNED
	) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			`Invalid status update attempt! Cannot update status from ${existingAssignment.serviceRequest.status} to ${status}`,
		);
	}

	if (
		(status === ServiceRequestStatus.RESOLVED ||
			status === ServiceRequestStatus.FAILED) &&
		existingAssignment.serviceRequest.status !== ServiceRequestStatus.INPROGRESS
	) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			`Invalid status update attempt! Cannot update status from ${existingAssignment.serviceRequest.status} to ${status}`,
		);
	}

	const updatedAssignment: any = await prisma.$transaction(async (tx) => {
		const request = await tx.serviceRequest.update({
			where: {
				id: existingAssignment.serviceRequestId,
			},
			data: {
				status,
			},
			include: {
				customer: true,
				assignment: {
					include: {
						technicianReport: true,
					},
				},
			},
		});

		if (status === ServiceRequestStatus.INSPECTING) {
			await tx.serviceRequest.update({
				where: {
					id: existingAssignment.serviceRequestId,
				},
				data: {
					inspectedAt: new Date(),
				},
			});
		}

		if (status === ServiceRequestStatus.RESOLVED) {
			await tx.serviceRequest.update({
				where: {
					id: existingAssignment.serviceRequestId,
				},
				data: {
					resolvedAt: new Date(),
				},
			});
		}

		if (status === ServiceRequestStatus.FAILED) {
			await tx.serviceRequest.update({
				where: {
					id: existingAssignment.serviceRequestId,
				},
				data: {
					failureNote: payload?.failureNote,
				},
			});
		}

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

			//pdf contents
			pdfDocument.fontSize(20).text("Power Guard", { align: "center" });
			pdfDocument.fontSize(14).text("Technician Report", { align: "center" });
			pdfDocument.moveDown(2);

			pdfDocument.fontSize(12).text(`Customer Name: ${request.customer.name}`);
			pdfDocument.text(`Technician Name: ${technician.name}`);
			pdfDocument.text(`Service Request ID: ${request.id}`);
			pdfDocument.text(`Date: ${new Date().toLocaleDateString()}`);
			pdfDocument.moveDown();

			if (status === ServiceRequestStatus.RESOLVED) {
				pdfDocument
					.fontSize(14)
					.fillColor("green")
					.text("Issue solved!", { align: "center" });
				pdfDocument.moveDown();
			}

			if (status === ServiceRequestStatus.FAILED) {
				//refund from bkash

				pdfDocument
					.fontSize(14)
					.fillColor("red")
					.text("Issue could not be solved!", { align: "center" });
				pdfDocument.moveDown();
			}

			pdfDocument.fontSize(14).text("Diagnosis");
			pdfDocument
				.fontSize(12)
				.text(`${request.assignment?.technicianReport?.diagnosis}`);
			pdfDocument.moveDown();

			pdfDocument.fontSize(14).text("Charge");
			pdfDocument
				.fontSize(12)
				.text(`${request.assignment?.technicianReport?.charge}`);
			pdfDocument.moveDown();

			if (status === ServiceRequestStatus.FAILED) {
				pdfDocument
					.fontSize(12)
					.fillColor("red")
					.text(`${request.failureNote}`);
				pdfDocument.moveDown();

				pdfDocument
					.fontSize(12)
					.fillColor("red")
					.text("Your account has been refunded successfully");
				pdfDocument.moveDown();
			}

			pdfDocument.end();

			const pdfBuffer = await pdfReadyPromise;

			const uploadResult = await new Promise<UploadApiResponse>(
				(resolve, reject) => {
					cloudinary.uploader
						.upload_stream(
							{ resource_type: "raw", format: "pdf" },
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
				},
			);

			await tx.assignment.update({
				where: {
					id: request?.assignment?.id,
				},
				data: {
					reportPublicId: uploadResult.public_id,
					reportUrl: uploadResult.secure_url,
				},
			});

			await transporter.sendMail({
				from: config.email_sender,
				to: request.customer.email,
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

		const updatedAssignment = await tx.assignment.findUnique({
			where: {
				id: request?.assignment?.id,
			},
		});

		return updatedAssignment;
	});

	return updatedAssignment;
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
