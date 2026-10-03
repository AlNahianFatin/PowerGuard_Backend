import httpStatus from "http-status";
import {
	PaymentStatus,
	Role,
	ScheduleStatus,
	ServiceRequestStatus,
	TechnicianVerificationStatus,
} from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import type { RequestUser } from "../../middleware/checkAuth";
import { AppError } from "../../utils/AppError";

const getAdminAnalytics = async () => {
	const totalAdmins = await prisma.user.count({
		where: {
			role: Role.ADMIN,
			isDeleted: false,
		},
	});

	const totalOperators = await prisma.operator.count({
		where: {
			isDeleted: false,
		},
	});

	const totalTechnicians = await prisma.technician.count({
		where: {
			isDeleted: false,
		},
	});

	const totalPendingTechnicianApplications = await prisma.technician.count({
		where: {
			isDeleted: false,
			verificationStatus: TechnicianVerificationStatus.PENDING,
		},
	});

	const totalApprovedTechnicians = await prisma.technician.count({
		where: {
			isDeleted: false,
			verificationStatus: TechnicianVerificationStatus.APPROVED,
		},
	});

	const totalRejectedTechnicians = await prisma.technician.count({
		where: {
			isDeleted: false,
			verificationStatus: TechnicianVerificationStatus.REJECTED,
		},
	});

	const totalCustomers = await prisma.customer.count({
		where: { isDeleted: false },
	});

	const totalAssignments = await prisma.assignment.count({
		where: {
			isDeleted: false,
		},
	});

	const totalOngoingAssignments = await prisma.assignment.count({
		where: {
			isDeleted: false,
			serviceRequest: {
				status:
					ServiceRequestStatus.ASSIGNED ||
					ServiceRequestStatus.INSPECTING ||
					ServiceRequestStatus.PAYMENTPENDING ||
					ServiceRequestStatus.INPROGRESS,
			},
		},
	});

	const totalCancelledAssignments = await prisma.assignment.count({
		where: {
			isDeleted: false,
			serviceRequest: {
				status: ServiceRequestStatus.CANCELLED,
			},
		},
	});

	const totalRejectedAssignments = await prisma.assignment.count({
		where: {
			isDeleted: false,
			serviceRequest: {
				status: ServiceRequestStatus.REJECTED,
			},
		},
	});

	const totalResolvedAssignments = await prisma.assignment.count({
		where: {
			isDeleted: false,
			serviceRequest: {
				status: ServiceRequestStatus.RESOLVED,
			},
		},
	});

	const totalFailedAssignments = await prisma.assignment.count({
		where: {
			isDeleted: false,
			serviceRequest: {
				status: ServiceRequestStatus.FAILED,
			},
		},
	});

	const totalRefundResult = await prisma.payment.aggregate({
		where: {
			status: PaymentStatus.PAID,
		},
		_sum: {
			amount: true,
		},
	});

	const totalRefunded = totalRefundResult._sum.amount?.toNumber() || 0;

	const totalRevenueResult = await prisma.payment.aggregate({
		where: {
			status: PaymentStatus.PAID,
		},
		_sum: {
			amount: true,
		},
	});

	const totalRevenue =
		(totalRevenueResult._sum.amount?.toNumber() || 0) - totalRefunded;

	return {
		totalAdmins,
		totalOperators,
		totalTechnicians,
		totalPendingTechnicianApplications,
		totalApprovedTechnicians,
		totalRejectedTechnicians,
		totalCustomers,
		totalAssignments,
		totalOngoingAssignments,
		totalCancelledAssignments,
		totalRejectedAssignments,
		totalFailedAssignments,
		totalResolvedAssignments,
		totalRevenue,
		totalRefunded,
	};
};

const getOperatorAnalytics = async (user: RequestUser) => {
	const operator = await prisma.operator.findUnique({
		where: {
			userId: user.userId,
			isDeleted: false,
		},
	});

	if (!operator || operator.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "Operator profile not found");
	}

	const publishedSchedules = await prisma.schedule.count({
		where: {
			creatorId: operator.id,
			isDeleted: false,
			status: ScheduleStatus.PUBLISHED,
		},
	});

	const assignedAssignments = await prisma.assignment.count({
		where: {
			assigneeId: operator.id,
			isDeleted: false,
		},
	});

	const totalTechnicians = await prisma.technician.count({
		where: {
			isDeleted: false,
		},
	});

	const totalPendingTechnicianApplications = await prisma.technician.count({
		where: {
			isDeleted: false,
			verificationStatus: TechnicianVerificationStatus.PENDING,
		},
	});

	const totalApprovedTechnicians = await prisma.technician.count({
		where: {
			isDeleted: false,
			verificationStatus: TechnicianVerificationStatus.APPROVED,
		},
	});

	const totalRejectedTechnicians = await prisma.technician.count({
		where: {
			isDeleted: false,
			verificationStatus: TechnicianVerificationStatus.REJECTED,
		},
	});

	const totalCustomers = await prisma.customer.count({
		where: { isDeleted: false },
	});

	const totalAssignments = await prisma.assignment.count({
		where: {
			isDeleted: false,
		},
	});

	const totalOngoingAssignments = await prisma.assignment.count({
		where: {
			isDeleted: false,
			serviceRequest: {
				status:
					ServiceRequestStatus.ASSIGNED ||
					ServiceRequestStatus.INSPECTING ||
					ServiceRequestStatus.PAYMENTPENDING ||
					ServiceRequestStatus.INPROGRESS,
			},
		},
	});

	const totalCancelledAssignments = await prisma.assignment.count({
		where: {
			isDeleted: false,
			serviceRequest: {
				status: ServiceRequestStatus.CANCELLED,
			},
		},
	});

	const totalRejectedAssignments = await prisma.assignment.count({
		where: {
			isDeleted: false,
			serviceRequest: {
				status: ServiceRequestStatus.REJECTED,
			},
		},
	});

	const totalResolvedAssignments = await prisma.assignment.count({
		where: {
			isDeleted: false,
			serviceRequest: {
				status: ServiceRequestStatus.RESOLVED,
			},
		},
	});

	const totalFailedAssignments = await prisma.assignment.count({
		where: {
			isDeleted: false,
			serviceRequest: {
				status: ServiceRequestStatus.FAILED,
			},
		},
	});

	return {
		publishedSchedules,
		assignedAssignments,
		totalTechnicians,
		totalPendingTechnicianApplications,
		totalApprovedTechnicians,
		totalRejectedTechnicians,
		totalCustomers,
		totalAssignments,
		totalOngoingAssignments,
		totalCancelledAssignments,
		totalRejectedAssignments,
		totalFailedAssignments,
		totalResolvedAssignments,
	};
};

const getTechnicianAnalytics = async (user: RequestUser) => {
	const technician = await prisma.technician.findUnique({
		where: {
			userId: user.userId,
		},
	});

	if (!technician || technician.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "Technician Profile Not Found");
	}

	const totalAssignments = await prisma.assignment.count({
		where: {
			technicianId: technician.id,
			isDeleted: false,
		},
	});

	const totalCancelledAssignments = await prisma.assignment.count({
		where: {
			technicianId: technician.id,
			isDeleted: false,
			serviceRequest: {
				status: ServiceRequestStatus.CANCELLED,
			},
		},
	});

	const totalRejectedAssignments = await prisma.assignment.count({
		where: {
			technicianId: technician.id,
			isDeleted: false,
			serviceRequest: {
				status: ServiceRequestStatus.REJECTED,
			},
		},
	});

	const totalResolvedAssignments = await prisma.assignment.count({
		where: {
			technicianId: technician.id,
			isDeleted: false,
			serviceRequest: {
				status: ServiceRequestStatus.RESOLVED,
			},
		},
	});

	const totalFailedAssignments = await prisma.assignment.count({
		where: {
			technicianId: technician.id,
			isDeleted: false,
			serviceRequest: {
				status: ServiceRequestStatus.FAILED,
			},
		},
	});

	const totalTechnicianRefundedResult = await prisma.payment.aggregate({
		where: {
			assignment: {
				technicianId: technician.id,
				serviceRequest: {
					status: ServiceRequestStatus.FAILED,
				},
			},
		},
		_sum: {
			amount: true,
		},
	});

	const totalTechnicianRefunded =
		totalTechnicianRefundedResult._sum.amount?.toNumber() || 0;

	const totalTechnicianEarningsResult = await prisma.payment.aggregate({
		where: {
			assignment: {
				technicianId: technician.id,
			},
			status: PaymentStatus.PAID,
		},
		_sum: {
			amount: true,
		},
	});

	const totalTechnicianEarnings =
		(totalTechnicianEarningsResult._sum.amount?.toNumber() || 0) -
		totalTechnicianRefunded;

	return {
		totalAssignments,
		totalCancelledAssignments,
		totalRejectedAssignments,
		totalResolvedAssignments,
		totalFailedAssignments,
		totalTechnicianRefunded,
		totalTechnicianEarnings,
	};
};

const getCustomerAnalytics = async (user: RequestUser) => {
	const customer = await prisma.customer.findUnique({
		where: {
			userId: user.userId,
		},
	});

	if (!customer) {
		throw new AppError(httpStatus.NOT_FOUND, "Customer Profile Not Found");
	}

	const totalServiceRequests = await prisma.serviceRequest.count({
		where: {
			customerId: customer.id,
			isDeleted: false,
		},
	});

	const cancelledServiceRequests = await prisma.serviceRequest.count({
		where: {
			customerId: customer.id,
			isDeleted: false,
			status: ServiceRequestStatus.CANCELLED,
		},
	});

	const rejectedServiceRequests = await prisma.serviceRequest.count({
		where: {
			customerId: customer.id,
			isDeleted: false,
			status: ServiceRequestStatus.REJECTED,
		},
	});

	const failedServiceRequests = await prisma.serviceRequest.count({
		where: {
			customerId: customer.id,
			isDeleted: false,
			status: ServiceRequestStatus.FAILED,
		},
	});

	const resolvedServiceRequests = await prisma.serviceRequest.count({
		where: {
			customerId: customer.id,
			isDeleted: false,
			status: ServiceRequestStatus.RESOLVED,
		},
	});

	const totalAmountSpentResult = await prisma.payment.aggregate({
		where: {
			customerId: customer.id,
			status: PaymentStatus.PAID,
		},
		_sum: {
			amount: true,
		},
	});

	const totalAmountSpent = totalAmountSpentResult._sum.amount?.toNumber() || 0;

	const totalRefundedResult = await prisma.payment.aggregate({
		where: {
			customerId: customer.id,
			status: PaymentStatus.REFUNDED,
		},
		_sum: {
			amount: true,
		},
	});

	const totalRefunded = totalRefundedResult._sum.amount?.toNumber() || 0;

	return {
		totalServiceRequests,
		cancelledServiceRequests,
		rejectedServiceRequests,
		failedServiceRequests,
		resolvedServiceRequests,
		totalAmountSpent,
		totalRefunded,
	};
};

export const AnalyticsService = {
	getAdminAnalytics,
	getOperatorAnalytics,
	getTechnicianAnalytics,
	getCustomerAnalytics,
};
