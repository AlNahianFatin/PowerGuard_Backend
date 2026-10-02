import httpStatus from "http-status";
import type { TechnicianReportWhereInput } from "../../../generated/prisma/models";
import type { IQuery } from "../../interfaces";
import { prisma } from "../../lib/prisma";
import type { RequestUser } from "../../middleware/checkAuth";
import { AppError } from "../../utils/AppError";
import type {
	ISubmitReportPayload,
	IUpdateReportPayload,
} from "./report.interface";
import { Role, ServiceRequestStatus } from "../../../generated/prisma/enums";

const getAllReports = async (query: IQuery) => {
	const limit = query.limit ? Number(query.limit) : 10;
	const page = query.page ? Number(query.page) : 1;
	const skip = (page - 1) * limit;
	const sortBy = query.sortBy ? query.sortBy : "createdAt";
	const sortOrder = query.sortOrder ? query.sortOrder : "desc";

	const andConditions: TechnicianReportWhereInput[] = [];

	if (Boolean(query.isDeleted) === true) {
		andConditions.push({
			isDeleted: Boolean(query.isDeleted),
		});
	}

	if (query.deletedBy) {
		andConditions.push({
			deletedBy: query.deletedBy,
		});
	}

	if (query.technicianId) {
		andConditions.push({
			assignment: {
				technicianId: query.technicianId,
			},
		});
	}

	if (query.customerId) {
		andConditions.push({
			assignment: {
				serviceRequest: {
					customerId: query.customerId,
				},
			},
		});
	}

	if (query.searchTerm) {
		andConditions.push({
			OR: [
				{
					diagnosis: {
						contains: query.searchTerm,
						mode: "insensitive",
					},
				},

				{
					assignment: {
						notes: {
							contains: query.searchTerm,
							mode: "insensitive",
						},
					},
				},

				{
					assignment: {
						deletedByUser: {
							name: {
								contains: query.searchTerm,
								mode: "insensitive",
							},
						},
					},
				},
				{
					assignment: {
						deletedByUser: {
							email: {
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

				{
					assignment: {
						serviceRequest: {
							title: {
								contains: query.searchTerm,
								mode: "insensitive",
							},
						},
					},
				},
				{
					assignment: {
						serviceRequest: {
							description: {
								contains: query.searchTerm,
								mode: "insensitive",
							},
						},
					},
				},
				{
					assignment: {
						serviceRequest: {
							failureNote: {
								contains: query.searchTerm,
								mode: "insensitive",
							},
						},
					},
				},

				{
					assignment: {
						serviceRequest: {
							customer: {
								name: {
									contains: query.searchTerm,
									mode: "insensitive",
								},
							},
						},
					},
				},
				{
					assignment: {
						serviceRequest: {
							customer: {
								email: {
									contains: query.searchTerm,
									mode: "insensitive",
								},
							},
						},
					},
				},

				{
					assignment: {
						serviceRequest: {
							area: {
								name: {
									contains: query.searchTerm,
									mode: "insensitive",
								},
							},
						},
					},
				},
				{
					assignment: {
						serviceRequest: {
							area: {
								code: {
									contains: query.searchTerm,
									mode: "insensitive",
								},
							},
						},
					},
				},

				{
					assignment: {
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
				},
				{
					assignment: {
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
				},
			],
		});
	}

	const reports = await prisma.technicianReport.findMany({
		where: {
			AND: andConditions,
		},

		take: limit,
		skip,
		orderBy: {
			[sortBy]: sortOrder,
		},
		include: {
			assignment: {
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
							area: {
								include: {
									feeder: true,
								},
							},
						},
					},
				},
			},
		},
	});

	const total = await prisma.technicianReport.count({
		where: { AND: andConditions },
	});

	return {
		data: reports,
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
};

const getMyReports = async (query: IQuery, user: RequestUser) => {
	const requestedUser = await prisma.user.findUnique({
		where: {
			id: user.userId,
		},
		include: {
			technician: true,
			customer: true,
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

	if (requestedUser.role === Role.CUSTOMER) {
		if (!requestedUser.customer || requestedUser.customer.isDeleted) {
			throw new AppError(httpStatus.NOT_FOUND, "Customer profile not found");
		}
	}

	const limit = query.limit ? Number(query.limit) : 10;
	const page = query.page ? Number(query.page) : 1;
	const skip = (page - 1) * limit;
	const sortBy = query.sortBy ? query.sortBy : "createdAt";
	const sortOrder = query.sortOrder ? query.sortOrder : "desc";

	const andConditions: TechnicianReportWhereInput[] = [
		{
			isDeleted: false,
		},
		{
			assignment: {
				isDeleted: false,
				technician: {
					isDeleted: false,
				},
				serviceRequest: {
					isDeleted: false,
					customer: {
						isDeleted: false,
					},
					area: {
						isDeleted: false,
						feeder: {
							isDeleted: false,
						},
					},
					...(requestedUser.role === Role.TECHNICIAN && {
						rejectedByUser: {
							isDeleted: false,
						},
					}),
				},
			},
		},
	];

	if (query.technicianId) {
		andConditions.push({
			assignment: {
				technicianId: query.technicianId,
			},
		});
	}

	if (query.customerId) {
		andConditions.push({
			assignment: {
				serviceRequest: {
					customerId: query.customerId,
				},
			},
		});
	}

	if (query.searchTerm) {
		andConditions.push({
			OR: [
				{
					diagnosis: {
						contains: query.searchTerm,
						mode: "insensitive",
					},
				},

				{
					assignment: {
						notes: {
							contains: query.searchTerm,
							mode: "insensitive",
						},
					},
				},

				{
					assignment: {
						...(requestedUser.role === Role.TECHNICIAN && {
							assignedByUser: {
								name: {
									contains: query.searchTerm,
									mode: "insensitive",
								},
							},
						}),
					},
				},
				{
					assignment: {
						...(requestedUser.role === Role.TECHNICIAN && {
							assignedByUser: {
								email: {
									contains: query.searchTerm,
									mode: "insensitive",
								},
							},
						}),
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

				{
					assignment: {
						serviceRequest: {
							title: {
								contains: query.searchTerm,
								mode: "insensitive",
							},
						},
					},
				},
				{
					assignment: {
						serviceRequest: {
							description: {
								contains: query.searchTerm,
								mode: "insensitive",
							},
						},
					},
				},
				{
					assignment: {
						serviceRequest: {
							failureNote: {
								contains: query.searchTerm,
								mode: "insensitive",
							},
						},
					},
				},

				{
					assignment: {
						serviceRequest: {
							customer: {
								name: {
									contains: query.searchTerm,
									mode: "insensitive",
								},
							},
						},
					},
				},
				{
					assignment: {
						serviceRequest: {
							customer: {
								email: {
									contains: query.searchTerm,
									mode: "insensitive",
								},
							},
						},
					},
				},

				{
					assignment: {
						serviceRequest: {
							area: {
								name: {
									contains: query.searchTerm,
									mode: "insensitive",
								},
							},
						},
					},
				},
				{
					assignment: {
						serviceRequest: {
							area: {
								code: {
									contains: query.searchTerm,
									mode: "insensitive",
								},
							},
						},
					},
				},

				{
					assignment: {
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
				},
				{
					assignment: {
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
				},
			],
		});
	}

	const reports = await prisma.technicianReport.findMany({
		where: {
			AND: andConditions,
		},

		take: limit,
		skip,
		orderBy: {
			[sortBy]: sortOrder,
		},
		include: {
			assignment: {
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
							area: {
								include: {
									feeder: true,
								},
							},
						},
					},
				},
			},
		},
	});

	const total = await prisma.technicianReport.count({
		where: { AND: andConditions },
	});

	return {
		data: reports,
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
};

const getSingleReport = async (reportId: string) => {
	const report = await prisma.technicianReport.findUnique({
		where: { id: reportId },
		include: {
			assignment: {
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
							area: {
								include: {
									feeder: true,
								},
							},
						},
					},
				},
			},
		},
	});

	if (!report || report.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "Technician report not found");
	}

	return report;
};

const submitReport = async (
	assignmentId: string,
	payload: ISubmitReportPayload,
	user: RequestUser,
) => {
	const technician = await prisma.technician.findUnique({
		where: { userId: user.userId },
	});

	if (!technician || technician.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "Technician Profile Not Found");
	}

	const existingAssignment = await prisma.assignment.findUnique({
		where: {
			id: assignmentId,
		},
		include: {
			technicianReport: true,
			serviceRequest: true,
		},
	});

	if (!existingAssignment || existingAssignment.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "Assignment not found");
	}

	if (existingAssignment.technicianId !== technician.id) {
		throw new AppError(
			httpStatus.UNAUTHORIZED,
			"You are not authorized to submit report other than yours",
		);
	}

	if (existingAssignment.technicianReport) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"A report has already been published. You may update it.",
		);
	}

	if (
		existingAssignment.serviceRequest.status !== ServiceRequestStatus.INSPECTING
	) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"You can submit report only while inspecting the issue",
		);
	}

	const diagnosis = payload?.diagnosis?.trim();
	const charge = Number(payload?.charge);

	const report = await prisma.$transaction(async (tx) => {
		const report = await tx.technicianReport.create({
			data: {
				diagnosis,
				charge,
				assignmentId,
			},
			include: {
				assignment: {
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
								area: {
									include: {
										feeder: true,
									},
								},
							},
						},
					},
				},
			},
		});

		await tx.serviceRequest.update({
			where: {
				id: report.assignment?.serviceRequestId,
			},
			data: {
				status: ServiceRequestStatus.PAYMENTPENDING,
			},
		});

		return report;
	});

	return report;
};

const updateReport = async (
	reportId: string,
	payload: IUpdateReportPayload,
	user: RequestUser,
) => {
	const technician = await prisma.technician.findUnique({
		where: { userId: user.userId },
	});

	if (!technician || technician.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "Technician Profile Not Found");
	}

	const diagnosis = payload.diagnosis?.trim();
	const charge = Number(payload.charge);

	const existingReport = await prisma.technicianReport.findUnique({
		where: {
			id: reportId,
		},
		include: {
			assignment: {
				include: {
					serviceRequest: true,
				},
			},
		},
	});

	if (!existingReport || existingReport.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "Technician report not found");
	}

	if (technician.id !== existingReport.assignment?.technicianId) {
		throw new AppError(
			httpStatus.UNAUTHORIZED,
			"You are not authorized to update report other than yours",
		);
	}

	if (
		existingReport.assignment.serviceRequest.status ===
		ServiceRequestStatus.PENDING
	) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"The service request has not even been assigned yet!",
		);
	}

	if (
		existingReport.assignment.serviceRequest.status ===
		ServiceRequestStatus.CANCELLED
	) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"The customer has cancelled the service request",
		);
	}

	if (
		existingReport.assignment.serviceRequest.status ===
		ServiceRequestStatus.REJECTED
	) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"The service request has been rejected by authority",
		);
	}

	if (
		existingReport.assignment.serviceRequest.status ===
		ServiceRequestStatus.ASSIGNED
	) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			`Please update service request status to '${ServiceRequestStatus.INSPECTING}' first`,
		);
	}

	const updatedReport = await prisma.technicianReport.update({
		where: {
			id: existingReport.id,
		},
		data: {
			diagnosis,
			charge,
		},
		include: {
			assignment: {
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
							area: {
								include: {
									feeder: true,
								},
							},
						},
					},
				},
			},
		},
	});

	return updatedReport;
};

export const ReportService = {
	getAllReports,
	getMyReports,
	getSingleReport,
	submitReport,
	updateReport,
};
