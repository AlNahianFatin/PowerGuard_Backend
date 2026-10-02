import {
	PaymentStatus,
	Role,
	ServiceRequestStatus,
	TechnicianStatus,
} from "../../../generated/prisma/enums";
import { AssignmentWhereInput } from "../../../generated/prisma/models";
import {
	IAssignTechnicianPayload,
	IUpdateAssignmentPayload,
	IUpdateAssignmentStatusPayload,
} from "./assignment.interface";
import { cloudinary } from "../../lib/cloudinary";
import config from "../../config";
import { IQuery } from "../../interfaces";
import { getBkashIdToken } from "../../lib/bkash";
import { transporter } from "../../lib/nodemailer";
import { prisma } from "../../lib/prisma";
import type { RequestUser } from "../../middleware/checkAuth";
import { AppError } from "../../utils/AppError";
import { UploadApiResponse } from "cloudinary";
import httpStatus from "http-status";
import PDFDocument from "pdfkit";

const getAllAssignments = async (query: IQuery, user: RequestUser) => {
	const limit = query.limit ? Number(query.limit) : 10;
	const page = query.page ? Number(query.page) : 1;
	const skip = (page - 1) * limit;
	const sortBy = query.sortBy ? query.sortBy : "createdAt";
	const sortOrder = query.sortOrder ? query.sortOrder : "desc";

	const andConditions: AssignmentWhereInput[] = [];

	if (user.role === Role.TECHNICIAN) {
		andConditions.push({
			isDeleted: false,
		});
	}

	if (user.role === Role.TECHNICIAN && Boolean(query.isDeleted) === true) {
		throw new AppError(
			httpStatus.UNAUTHORIZED,
			"You cannot view deleted assignments",
		);
	}

	if (user.role !== Role.TECHNICIAN && Boolean(query.isDeleted) === true) {
		andConditions.push({
			isDeleted: Boolean(query.isDeleted),
		});
	}

	if (user.role === Role.TECHNICIAN && query.deletedBy) {
		throw new AppError(
			httpStatus.UNAUTHORIZED,
			"You cannot view deleted assignments",
		);
	}

	if (query.deletedBy) {
		andConditions.push({ deletedBy: query.deletedBy });
	}

	if (query.assigneeId) {
		andConditions.push({ assigneeId: query.assigneeId });
	}

	if (query.technicianId) {
		andConditions.push({ technicianId: query.technicianId });
	}

	if (query.serviceRequestId) {
		andConditions.push({ serviceRequestId: query.serviceRequestId });
	}

	if (query.technicianReportId) {
		andConditions.push({ technicianReportId: query.technicianReportId });
	}

	if (query.searchTerm) {
		andConditions.push({
			OR: [
				{
					notes: {
						contains: query.searchTerm,
						mode: "insensitive",
					},
				},

				{
					deletedByUser: {
						name: {
							contains: query.searchTerm,
							mode: "insensitive",
						},
					},
				},
				{
					deletedByUser: {
						email: {
							contains: query.searchTerm,
							mode: "insensitive",
						},
					},
				},

				{
					assignedByUser: {
						name: {
							contains: query.searchTerm,
							mode: "insensitive",
						},
					},
				},
				{
					assignedByUser: {
						email: {
							contains: query.searchTerm,
							mode: "insensitive",
						},
					},
				},

				{
					technician: {
						name: {
							contains: query.searchTerm,
							mode: "insensitive",
						},
					},
				},
				{
					technician: {
						email: {
							contains: query.searchTerm,
							mode: "insensitive",
						},
					},
				},

				{
					serviceRequest: {
						title: {
							contains: query.searchTerm,
							mode: "insensitive",
						},
					},
				},
				{
					serviceRequest: {
						description: {
							contains: query.searchTerm,
							mode: "insensitive",
						},
					},
				},
				{
					serviceRequest: {
						failureNote: {
							contains: query.searchTerm,
							mode: "insensitive",
						},
					},
				},
				{
					serviceRequest: {
						rejectionReason: {
							contains: query.searchTerm,
							mode: "insensitive",
						},
					},
				},
				{
					serviceRequest: {
						customer: {
							name: {
								contains: query.searchTerm,
								mode: "insensitive",
							},
						},
					},
				},
				{
					serviceRequest: {
						customer: {
							email: {
								contains: query.searchTerm,
								mode: "insensitive",
							},
						},
					},
				},
				{
					serviceRequest: {
						area: {
							name: {
								contains: query.searchTerm,
								mode: "insensitive",
							},
						},
					},
				},
				{
					serviceRequest: {
						area: {
							code: {
								contains: query.searchTerm,
								mode: "insensitive",
							},
						},
					},
				},
				{
					serviceRequest: {
						area: {
							feeder: {
								name: {
									contains: query.searchTerm,
									mode: "insensitive",
								},
							},
						},
					},
				},
				{
					serviceRequest: {
						area: {
							feeder: {
								code: {
									contains: query.searchTerm,
									mode: "insensitive",
								},
							},
						},
					},
				},

				{
					technicianReport: {
						diagnosis: {
							contains: query.searchTerm,
							mode: "insensitive",
						},
					},
				},
			],
		});
	}

	const assignments = await prisma.assignment.findMany({
		where: { AND: andConditions },
		take: limit,
		skip,
		orderBy: { [sortBy]: sortOrder },
		include: {
			deletedByUser: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},

			assignedByUser: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},

			technician: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},

			serviceRequest: {
				include: {
					customer: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},
					area: {
						include: {
							feeder: true,
						},
					},
				},
			},

			technicianReport: true,
		},
	});

	const total = await prisma.assignment.count({
		where: { AND: andConditions },
	});

	return {
		data: assignments,
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
};

const getSingleAssignment = async (assignmentId: string, user: RequestUser) => {
	const assignment = await prisma.assignment.findUnique({
		where: { id: assignmentId },
		include: {
			deletedByUser: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},

			...(user.role !== Role.CUSTOMER && {
				assignedByUser: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
			}),

			technician: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},

			serviceRequest: {
				include: {
					customer: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},
					area: {
						include: {
							feeder: true,
						},
					},
				},
			},

			payment: true,

			technicianReport: true,
		},
	});

	if (!assignment) {
		throw new AppError(httpStatus.NOT_FOUND, "Assignment not found");
	}

	if (
		(user.role === Role.TECHNICIAN || user.role === Role.CUSTOMER) &&
		assignment.isDeleted
	) {
		throw new AppError(httpStatus.NOT_FOUND, "Assignment not found");
	}

	return assignment;
};

const getMyAssignments = async (query: IQuery, user: RequestUser) => {
	const requestedUser = await prisma.user.findUnique({
		where: {
			id: user.userId,
		},
		include: {
			technician: true,
		},
	});

	if (!requestedUser || requestedUser.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "Your profile not found");
	}

	if (requestedUser.role === Role.TECHNICIAN) {
		if (!requestedUser.technician || requestedUser.technician.isDeleted) {
			throw new AppError(httpStatus.NOT_FOUND, "Technician profile not found");
		}
	}

	const limit = query.limit ? Number(query.limit) : 10;
	const page = query.page ? Number(query.page) : 1;
	const skip = (page - 1) * limit;
	const sortBy = query.sortBy ? query.sortBy : "createdAt";
	const sortOrder = query.sortOrder ? query.sortOrder : "desc";

	const andConditions: AssignmentWhereInput[] = [];

	if (
		requestedUser.role === Role.ADMIN ||
		requestedUser.role === Role.OPERATOR
	) {
		andConditions.push({
			OR: [
				{
					deletedBy: requestedUser.id,
				},
				{
					assigneeId: requestedUser.id,
				},
			],
		});
	}

	if (requestedUser.role === Role.TECHNICIAN) {
		if (!requestedUser.technician || requestedUser.technician.isDeleted) {
			throw new AppError(httpStatus.NOT_FOUND, "Technician profile not found");
		}

		andConditions.push({
			technicianId: requestedUser.technician.id,
			isDeleted: false,
		});
	}

	if (query.searchTerm) {
		const searchConditions: AssignmentWhereInput[] = [
			{
				notes: {
					contains: query.searchTerm,
					mode: "insensitive",
				},
			},

			{
				assignedByUser: {
					name: {
						contains: query.searchTerm,
						mode: "insensitive",
					},
				},
			},
			{
				assignedByUser: {
					email: {
						contains: query.searchTerm,
						mode: "insensitive",
					},
				},
			},

			{
				technician: {
					name: {
						contains: query.searchTerm,
						mode: "insensitive",
					},
				},
			},
			{
				technician: {
					email: {
						contains: query.searchTerm,
						mode: "insensitive",
					},
				},
			},

			{
				serviceRequest: {
					title: {
						contains: query.searchTerm,
						mode: "insensitive",
					},
				},
			},
			{
				serviceRequest: {
					description: {
						contains: query.searchTerm,
						mode: "insensitive",
					},
				},
			},
			{
				serviceRequest: {
					failureNote: {
						contains: query.searchTerm,
						mode: "insensitive",
					},
				},
			},
			{
				serviceRequest: {
					rejectionReason: {
						contains: query.searchTerm,
						mode: "insensitive",
					},
				},
			},
			{
				serviceRequest: {
					customer: {
						name: {
							contains: query.searchTerm,
							mode: "insensitive",
						},
					},
				},
			},
			{
				serviceRequest: {
					customer: {
						email: {
							contains: query.searchTerm,
							mode: "insensitive",
						},
					},
				},
			},
			{
				serviceRequest: {
					area: {
						name: {
							contains: query.searchTerm,
							mode: "insensitive",
						},
					},
				},
			},
			{
				serviceRequest: {
					area: {
						code: {
							contains: query.searchTerm,
							mode: "insensitive",
						},
					},
				},
			},
			{
				serviceRequest: {
					area: {
						feeder: {
							name: {
								contains: query.searchTerm,
								mode: "insensitive",
							},
						},
					},
				},
			},
			{
				serviceRequest: {
					area: {
						feeder: {
							code: {
								contains: query.searchTerm,
								mode: "insensitive",
							},
						},
					},
				},
			},

			{
				technicianReport: {
					diagnosis: {
						contains: query.searchTerm,
						mode: "insensitive",
					},
				},
			},
		];

		if (
			requestedUser.role === Role.ADMIN ||
			requestedUser.role === Role.OPERATOR
		) {
			searchConditions.push(
				{
					deletedByUser: {
						name: {
							contains: query.searchTerm,
							mode: "insensitive",
						},
					},
				},
				{
					deletedByUser: {
						email: {
							contains: query.searchTerm,
							mode: "insensitive",
						},
					},
				},
			);
		}

		andConditions.push({
			OR: searchConditions,
		});
	}

	const assignments = await prisma.assignment.findMany({
		where: { AND: andConditions },
		take: limit,
		skip,
		orderBy: { [sortBy]: sortOrder },
		include: {
			assignedByUser: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},

			technician: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},

			serviceRequest: {
				include: {
					customer: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},
					area: {
						include: {
							feeder: true,
						},
					},
				},
			},

			technicianReport: true,
		},
	});

	const total = await prisma.assignment.count({
		where: { AND: andConditions },
	});

	return {
		data: assignments,
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
};

const assignTechnician = async (
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
			httpStatus.BAD_REQUEST,
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

const updateAssignment = async (
	payload: IUpdateAssignmentPayload,
	assignmentId: string,
	user: RequestUser,
) => {
	const requestedUser = await prisma.user.findUnique({
		where: { id: user.userId },
	});

	if (!requestedUser || requestedUser.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "Your profile not found");
	}

	const assignedByUserId = requestedUser.id;

	if (payload.technicianId) {
		const technician = await prisma.technician.findUnique({
			where: {
				id: payload.technicianId,
			},
		});

		if (!technician || technician.isDeleted) {
			throw new AppError(httpStatus.NOT_FOUND, "Technician not found");
		}

		if (technician.status !== TechnicianStatus.AVAILABLE) {
			throw new AppError(
				httpStatus.BAD_REQUEST,
				`Technician ${technician.name} is not available right now`,
			);
		}
	}

	const existingAssignment = await prisma.assignment.findUnique({
		where: {
			id: assignmentId,
		},
		include: {
			serviceRequest: {
				include: {
					rejectedByUser: {
						select: {
							id: true,
							name: true,
						},
					},
					customer: {
						select: {
							id: true,
							name: true,
						},
					},
				},
			},
		},
	});

	if (!existingAssignment || existingAssignment.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "The assignment does not exist");
	}

	if (
		existingAssignment.serviceRequest.status === ServiceRequestStatus.CANCELLED
	) {
		throw new AppError(
			httpStatus.CONFLICT,
			`The service request has already been cancelled by ${existingAssignment.serviceRequest.customer.name}`,
		);
	}

	if (
		existingAssignment.serviceRequest.status === ServiceRequestStatus.REJECTED
	) {
		throw new AppError(
			httpStatus.CONFLICT,
			`The service request has already been rejected by ${existingAssignment.serviceRequest?.rejectedByUser?.name}. Rejection reason: ${existingAssignment.serviceRequest?.rejectionReason}`,
		);
	}

	if (
		existingAssignment.serviceRequest.status === ServiceRequestStatus.FAILED
	) {
		throw new AppError(
			httpStatus.CONFLICT,
			`The service request was failed. Failure note: ${existingAssignment.serviceRequest?.failureNote}`,
		);
	}

	if (
		existingAssignment.serviceRequest.status === ServiceRequestStatus.RESOLVED
	) {
		throw new AppError(
			httpStatus.CONFLICT,
			"The service request has already been resolved",
		);
	}

	if (
		payload.technicianId &&
		existingAssignment.serviceRequest.status !== ServiceRequestStatus.PENDING &&
		existingAssignment.serviceRequest.status !== ServiceRequestStatus.ASSIGNED
	) {
		throw new AppError(
			httpStatus.CONFLICT,
			"Can not change technician for ongoing service",
		);
	}

	const updatedAssignment = await prisma.$transaction(async (tx) => {
		const updatedAssignment = await tx.assignment.update({
			where: {
				id: existingAssignment.id,
			},
			data: {
				...(payload.notes !== undefined && {
					notes: payload.notes,
				}),

				...(payload?.technicianId && {
					technicianId: payload.technicianId,
					assigneeId: assignedByUserId,
				}),
			},
		});

		await tx.technician.update({
			where: {
				id: payload.technicianId,
			},
			data: {
				status: TechnicianStatus.ASSIGNED,
			},
		});

		return updatedAssignment;
	});

	return updatedAssignment;
};

const deleteAssignment = async (assignmentId: string, user: RequestUser) => {
	const requestedUser = await prisma.user.findUnique({
		where: { id: user.userId },
	});

	if (!requestedUser || requestedUser.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "Your profile not found");
	}

	const existingAssignment = await prisma.assignment.findUnique({
		where: {
			id: assignmentId,
		},
		include: {
			serviceRequest: true,
		},
	});

	if (!existingAssignment || existingAssignment.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "The assignment does not exist");
	}

	if (
		existingAssignment.serviceRequest.status !==
			ServiceRequestStatus.RESOLVED &&
		existingAssignment.serviceRequest.status !== ServiceRequestStatus.FAILED &&
		existingAssignment.serviceRequest.status !==
			ServiceRequestStatus.REJECTED &&
		existingAssignment.serviceRequest.status !== ServiceRequestStatus.CANCELLED
	) {
		throw new AppError(
			httpStatus.CONFLICT,
			"Can not delete assignment for a completed service",
		);
	}

	await prisma.assignment.update({
		where: {
			id: existingAssignment.id,
		},
		data: {
			isDeleted: true,
			deletedBy: requestedUser.id,
		},
	});

	return null;
};

const updateAssignmentStatusByTechnician = async (
	assignmentId: string,
	payload: IUpdateAssignmentStatusPayload,
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

export const AssignmentService = {
	getAllAssignments,
	getSingleAssignment,
	getMyAssignments,
	assignTechnician,
	updateAssignment,
	deleteAssignment,
	updateAssignmentStatusByTechnician,
};
