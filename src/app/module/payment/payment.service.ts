import httpStatus from "http-status";
import {
	PaymentStatus,
	Role,
	ServiceRequestStatus,
} from "../../../generated/prisma/enums";
import type { PaymentWhereInput } from "../../../generated/prisma/models";
import type { IQuery } from "../../interfaces";
import { prisma } from "../../lib/prisma";
import type { RequestUser } from "../../middleware/checkAuth";
import { AppError } from "../../utils/AppError";
import { getBkashIdToken } from "../../lib/bkash";
import config from "../../config";
import type { IPayRequestPayload } from "./payment.interface";

const getAllPayments = async (query: IQuery) => {
	const limit = query.limit ? Number(query.limit) : 10;
	const page = query.page ? Number(query.page) : 1;
	const skip = (page - 1) * limit;
	const sortBy = query.sortBy ? query.sortBy : "createdAt";
	const sortOrder = query.sortOrder ? query.sortOrder : "desc";

	const andConditions: PaymentWhereInput[] = [];

	if (query.status) {
		andConditions.push({
			status: query.status,
		});
	}

	if (query.merchantInvoiceNumber) {
		andConditions.push({
			merchantInvoiceNumber: query.merchantInvoiceNumber,
		});
	}

	if (query.bkashPaymentId) {
		andConditions.push({
			bkashPaymentId: query.bkashPaymentId,
		});
	}

	if (query.bkashTrxId) {
		andConditions.push({
			bkashTrxId: query.bkashTrxId,
		});
	}

	if (query.payerReference) {
		andConditions.push({
			payerReference: query.payerReference,
		});
	}

	if (query.refundTrxId) {
		andConditions.push({
			refundTrxId: query.refundTrxId,
		});
	}

	if (query.refundReason) {
		andConditions.push({
			refundReason: query.refundReason,
		});
	}

	if (query.assignmentId) {
		andConditions.push({
			assignmentId: query.assignmentId,
		});
	}

	if (query.assigneeId) {
		andConditions.push({
			assignment: {
				assigneeId: query.assigneeId,
			},
		});
	}

	if (query.assigneeName) {
		andConditions.push({
			assignment: {
				assignedByUser: {
					name: query.assigneeName,
				},
			},
		});
	}

	if (query.assigneeEmail) {
		andConditions.push({
			assignment: {
				assignedByUser: {
					email: query.assigneeEmail,
				},
			},
		});
	}

	if (query.technicianId) {
		andConditions.push({
			assignment: {
				technicianId: query.technicianId,
			},
		});
	}

	if (query.technicianName) {
		andConditions.push({
			assignment: {
				technician: {
					name: query.technicianName,
				},
			},
		});
	}

	if (query.technicianEmail) {
		andConditions.push({
			assignment: {
				technician: {
					email: query.technicianEmail,
				},
			},
		});
	}

	if (query.customerId) {
		andConditions.push({
			customer: {
				id: query.customerId,
			},
		});
	}

	if (query.customerName) {
		andConditions.push({
			customer: {
				name: query.customerName,
			},
		});
	}

	if (query.customerEmail) {
		andConditions.push({
			customer: {
				email: query.customerEmail,
			},
		});
	}

	if (query.searchTerm) {
		andConditions.push({
			OR: [
				{
					merchantInvoiceNumber: {
						contains: query.searchTerm,
						mode: "default",
					},
				},
				{
					bkashPaymentId: {
						contains: query.searchTerm,
						mode: "default",
					},
				},
				{
					bkashTrxId: {
						contains: query.searchTerm,
						mode: "default",
					},
				},
				{
					payerReference: {
						contains: query.searchTerm,
						mode: "default",
					},
				},
				{
					refundTrxId: {
						contains: query.searchTerm,
						mode: "default",
					},
				},
				{
					refundReason: {
						contains: query.searchTerm,
						mode: "default",
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

	const payments = await prisma.payment.findMany({
		where: { AND: andConditions },
		take: limit,
		skip,
		orderBy: { [sortBy]: sortOrder },
		include: {
			customer: {
				select: {
					id: true,
					name: true,
					email: true,
				}
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
					technician: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},
					serviceRequest: true,
					technicianReport: true,
				},
			},
		},
	});

	const total = await prisma.payment.count({
		where: { AND: andConditions },
	});

	return {
		data: payments,
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
};

const getMyPayments = async (query: IQuery, user: RequestUser) => {
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

	const andConditions: PaymentWhereInput[] = [
		{
			assignment: {
				isDeleted: false,
			},
		},

		{
			assignment: {
				serviceRequest: {
					isDeleted: false,
				},
			},
		},

		{
			...(requestedUser.role === Role.TECHNICIAN && {
				assignment: {
					technicianId: requestedUser.technician?.id,
				},
			}),
		},

		{
			...(requestedUser.role === Role.CUSTOMER && {
				assignment: {
					serviceRequest: {
						customerId: requestedUser.customer?.id,
					},
				},
			}),
		},
	];

	if (query.status) {
		andConditions.push({
			status: query.status,
		});
	}

	if (query.merchantInvoiceNumber) {
		andConditions.push({
			merchantInvoiceNumber: query.merchantInvoiceNumber,
		});
	}

	if (query.bkashPaymentId) {
		andConditions.push({
			bkashPaymentId: query.bkashPaymentId,
		});
	}

	if (query.bkashTrxId) {
		andConditions.push({
			bkashTrxId: query.bkashTrxId,
		});
	}

	if (query.payerReference) {
		andConditions.push({
			payerReference: query.payerReference,
		});
	}

	if (query.refundTrxId) {
		andConditions.push({
			refundTrxId: query.refundTrxId,
		});
	}

	if (query.refundReason) {
		andConditions.push({
			refundReason: query.refundReason,
		});
	}

	if (query.assignmentId) {
		andConditions.push({
			assignmentId: query.assignmentId,
		});
	}

	if (requestedUser.role === Role.TECHNICIAN) {
		if (query.assigneeId) {
			andConditions.push({
				assignment: {
					assigneeId: query.assigneeId,
				},
			});
		}

		if (query.assigneeName) {
			andConditions.push({
				assignment: {
					assignedByUser: {
						name: query.assigneeName,
					},
				},
			});
		}

		if (query.assigneeEmail) {
			andConditions.push({
				assignment: {
					assignedByUser: {
						email: query.assigneeEmail,
					},
				},
			});
		}

		if (query.customerId) {
			andConditions.push({
				customer: {
					id: query.customerId,
				},
			});
		}

		if (query.customerName) {
			andConditions.push({
				customer: {
					name: query.customerName,
				},
			});
		}

		if (query.customerEmail) {
			andConditions.push({
				customer: {
					email: query.customerEmail,
				},
			});
		}
	}

	if (requestedUser.role === Role.CUSTOMER) {
		if (query.technicianId) {
			andConditions.push({
				assignment: {
					technicianId: query.technicianId,
				},
			});
		}

		if (query.technicianName) {
			andConditions.push({
				assignment: {
					technician: {
						name: query.technicianName,
					},
				},
			});
		}

		if (query.technicianEmail) {
			andConditions.push({
				assignment: {
					technician: {
						email: query.technicianEmail,
					},
				},
			});
		}
	}

	if (query.searchTerm) {
		andConditions.push({
			OR: [
				{
					merchantInvoiceNumber: {
						contains: query.searchTerm,
						mode: "default",
					},
				},
				{
					bkashPaymentId: {
						contains: query.searchTerm,
						mode: "default",
					},
				},
				{
					bkashTrxId: {
						contains: query.searchTerm,
						mode: "default",
					},
				},
				{
					payerReference: {
						contains: query.searchTerm,
						mode: "default",
					},
				},
				{
					refundTrxId: {
						contains: query.searchTerm,
						mode: "default",
					},
				},
				{
					refundReason: {
						contains: query.searchTerm,
						mode: "default",
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
					...(requestedUser.role === Role.TECHNICIAN && {
						assignment: {
							assignedByUser: {
								name: {
									contains: query.searchTerm,
									mode: "insensitive",
								},
							},
						},
					}),
				},
				{
					...(requestedUser.role === Role.TECHNICIAN && {
						assignment: {
							assignedByUser: {
								email: {
									contains: query.searchTerm,
									mode: "insensitive",
								},
							},
						},
					}),
				},

				{
					...(requestedUser.role === Role.CUSTOMER && {
						assignment: {
							technician: {
								name: {
									contains: query.searchTerm,
									mode: "insensitive",
								},
							},
						},
					}),
				},
				{
					...(requestedUser.role === Role.CUSTOMER && {
						assignment: {
							technician: {
								email: {
									contains: query.searchTerm,
									mode: "insensitive",
								},
							},
						},
					}),
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
					...(requestedUser.role === Role.TECHNICIAN && {
						customer: {
							name: {
								contains: query.searchTerm,
								mode: "insensitive",
							},
						},
					}),
				},
				{
					...(requestedUser.role === Role.TECHNICIAN && {
						customer: {
							email: {
								contains: query.searchTerm,
								mode: "insensitive",
							},
						},
					}),
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

	const payments = await prisma.payment.findMany({
		where: { AND: andConditions },
		take: limit,
		skip,
		orderBy: { [sortBy]: sortOrder },
		include: {
			customer: {
				select: {
					id: true,
					name: true,
					email: true,
				}
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
					technician: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},
					serviceRequest: true,
					technicianReport: true,
				},
			},
		},
	});

	const total = await prisma.payment.count({
		where: { AND: andConditions },
	});

	return {
		data: payments,
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
};

const getSinglePayment = async (paymentId: string, user: RequestUser) => {
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

	const payment = await prisma.payment.findUnique({
		where: {
			id: paymentId,
		},
		include: {
			customer: {
				select: {
					id: true,
					name: true,
					email: true,
				}
			},
			assignment: {
				include: {
					...(requestedUser.role !== Role.CUSTOMER && {
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
					serviceRequest: true,
					technicianReport: true,
				},
			},
		},
	});

	if (!payment) {
		throw new AppError(httpStatus.NOT_FOUND, "Payment Not Found");
	}

	if (
		requestedUser.role === Role.CUSTOMER &&
		payment.customerId !== requestedUser.customer?.id
	) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You Are Not Allowed To View This Payment",
		);
	}

	return payment;
};

// const proceedToPay = async (requestId: string, user: RequestUser) => {
// 	const customer = await prisma.customer.findUnique({
// 		where: {
// 			userId: user.userId,
// 		},
// 	});

// 	if (!customer || customer.isDeleted) {
// 		throw new AppError(httpStatus.NOT_FOUND, "Customer profile not found");
// 	}

// 	const existingServiceRequest = await prisma.serviceRequest.findFirst({
// 		where: {
// 			id: requestId,
// 			customerId: customer.id,
// 		},
// 		include: {
// 			assignment: {
// 				include: {
// 					technicianReport: true,
// 					payment: true,
// 				},
// 			},
// 		},
// 	});

// 	if (!existingServiceRequest || existingServiceRequest.isDeleted) {
// 		throw new AppError(httpStatus.NOT_FOUND, "Service request not found");
// 	}

// 	if (existingServiceRequest.status !== ServiceRequestStatus.PAYMENTPENDING) {
// 		throw new AppError(
// 			httpStatus.BAD_REQUEST,
// 			"This service request is not waiting for payment",
// 		);
// 	}

// 	if (
// 		!existingServiceRequest.assignment ||
// 		existingServiceRequest.assignment.isDeleted ||
// 		existingServiceRequest.assignment.id
// 	) {
// 		throw new AppError(
// 			httpStatus.NOT_FOUND,
// 			"The technician assignment corresponding to this service request not found",
// 		);
// 	}

// 	const technicianReport = existingServiceRequest.assignment?.technicianReport;

// 	if (!technicianReport) {
// 		throw new AppError(
// 			httpStatus.BAD_REQUEST,
// 			"Technician report has not been submitted yet",
// 		);
// 	}

// 	const amount = technicianReport.charge.toString();

// 	const bkashIdToken = await getBkashIdToken();

// 	if (!bkashIdToken) {
// 		throw new AppError(httpStatus.BAD_GATEWAY, "No Bkash Access Token Found!");
// 	}

// 	const bkashCreatePaymentResponse = await fetch(
// 		`${config.bkash_base_url}/tokenized/checkout/create`,
// 		{
// 			method: "POST",
// 			headers: {
// 				"Content-Type": "application/json",
// 				Accept: "application/json",
// 				Authorization: bkashIdToken,
// 				"X-App-Key": config.bkash_app_key,
// 			},
// 			body: JSON.stringify({
// 				mode: "0011",

// 				payerReference: user.email,
// 				callbackURL: `${config.bkash_callback_url}/appointment/book-appointment/payment/callback`,
// 				amount: amount,
// 				currency: "BDT",
// 				intent: "sale",
// 				merchantInvoiceNumber: existingServiceRequest.id,
// 			}),
// 		},
// 	);

// 	const bkashCreatePaymentResult = await bkashCreatePaymentResponse.json();

// 	await prisma.payment.create({
// 		data: {
// 			amount,
// 			merchantInvoiceNumber: existingServiceRequest.id,
// 			// biome-ignore lint/style/noNonNullAssertion: <explanation>
// 			// biome-ignore lint/suspicious/noNonNullAssertedOptionalChain: <explanation>
// 			assignmentId: existingServiceRequest.assignment?.id!,
// 		},
// 	});

// 	return {
// 		paymentUrl: bkashCreatePaymentResult.bkashURL,
// 	};
// };

const payServiceRequest = async (
	payload: IPayRequestPayload,
	user: RequestUser,
) => {
	const customer = await prisma.customer.findUnique({
		where: {
			userId: user.userId,
		},
	});

	if (!customer || customer.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "Customer profile not found");
	}

	const { requestId } = payload;

	if (!requestId) {
		throw new AppError(httpStatus.BAD_REQUEST, "Request ID is missing")
	}

	const existingServiceRequest = await prisma.serviceRequest.findFirst({
		where: {
			id: requestId,
			customerId: customer.id,
		},
		include: {
			assignment: {
				include: {
					technicianReport: true,
					payment: true,
				},
			},
		},
	});

	if (!existingServiceRequest || existingServiceRequest.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "Service request not found");
	}

	if (existingServiceRequest.status !== ServiceRequestStatus.PAYMENTPENDING) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"This service request is not waiting for payment",
		);
	}

	if (
		!existingServiceRequest.assignment ||
		existingServiceRequest.assignment.isDeleted ||
		existingServiceRequest.assignment.id
	) {
		throw new AppError(
			httpStatus.NOT_FOUND,
			"The technician assignment corresponding to this service request not found",
		);
	}

	if (
		!existingServiceRequest.assignment.payment ||
		existingServiceRequest.assignment.payment.id
	) {
		throw new AppError(
			httpStatus.NOT_FOUND,
			"The payment request corresponding to this service request not found",
		);
	}

	if (
		existingServiceRequest.assignment?.payment?.status !== PaymentStatus.PENDING
	) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"This service request is not waiting for payment",
		);
	}

	const technicianReport = existingServiceRequest.assignment?.technicianReport;

	if (!technicianReport) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Technician report has not been submitted yet",
		);
	}

	const amount = technicianReport.charge.toString();

	try {
		const bkashIdToken = await getBkashIdToken();

		if (!bkashIdToken) {
			throw new AppError(
				httpStatus.BAD_GATEWAY,
				"No Bkash Access Token Found!",
			);
		}

		const bkashCreatePaymentResponse = await fetch(
			`${config.bkash_base_url}/tokenized/checkout/create`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
					Authorization: bkashIdToken,
					"X-App-Key": config.bkash_app_key,
				},
				body: JSON.stringify({
					mode: "0011",

					payerReference: user.email,
					callbackURL: `${config.bkash_callback_url}/payment/pay-service-request/callback`,
					amount: amount,
					currency: "BDT",
					intent: "sale",
					merchantInvoiceNumber: existingServiceRequest.id,
				}),
			},
		);

		const bkashCreatePaymentResult = await bkashCreatePaymentResponse.json();

		await prisma.payment.create({
			data: {
				amount,
				assignmentId: existingServiceRequest.assignment.id,
				merchantInvoiceNumber: bkashCreatePaymentResult.merchantInvoiceNumber,
				gatewayResponse: bkashCreatePaymentResult,
				bkashPaymentId: bkashCreatePaymentResult.paymentID,
			},
		});

		return {
			paymentUrl: bkashCreatePaymentResult.bkashURL,
		};
	} catch (error: any) {
		console.log(error);
		return error.message;
	}
};

const payServiceRequestCallback = async (query: Record<string, any>) => {
	const paymentId = query.paymentID;

	if (!paymentId) {
		throw new AppError(httpStatus.BAD_REQUEST, "Payment Id Missing");
	}

	const status = query.status;

	if (!status) {
		throw new AppError(httpStatus.BAD_REQUEST, "Payment Status is Missing");
	}

	const bkashIdToken = await getBkashIdToken();

	if (!bkashIdToken) {
		throw new AppError(httpStatus.BAD_GATEWAY, "No Bkash Access Token Found!");
	}

	const executedPaymentResponse = await fetch(
		`${config.bkash_base_url}/tokenized/checkout/execute`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
				Authorization: bkashIdToken,
				"X-App-Key": config.bkash_app_key,
			},

			body: JSON.stringify({
				paymentID: paymentId,
			}),
		},
	);

	const executedPaymentResult = await executedPaymentResponse.json();

	const transactionResult = await prisma.$transaction(async (tx) => {
		if (status === "success") {
			const request = await tx.serviceRequest.findUnique({
				where: {
					id: executedPaymentResult.merchantInvoiceNumber,
				},
				include: {
					customer: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},
					assignment: {
						include: {
							technician: {
								select: {
									id: true,
									name: true,
									email: true,
								},
							},
							technicianReport: true,
						},
					},
					area: {
						include: {
							feeder: true,
						},
					},
				},
			});

			if (!request) {
				throw new AppError(httpStatus.NOT_FOUND, "Service request not found!");
			}

			await tx.payment.update({
				where: {
					bkashPaymentId: paymentId,
				},
				data: {
					status: PaymentStatus.PAID,
					bkashTrxId: executedPaymentResult.trxID,
					paidAt: executedPaymentResult.paymentExecuteTime,
					gatewayResponse: executedPaymentResult,
				},
			});

			await tx.serviceRequest.update({
				where: {
					id: request.id,
				},
				data: {
					status: ServiceRequestStatus.INPROGRESS,
				},
			});

			return {
				redirectUrl: `${config.frontend_url}/dashboard/my-appointments?status=success`,
			};
		} else if (status === "failure") {
			await tx.payment.update({
				where: {
					bkashPaymentId: paymentId,
				},
				data: {
					status: PaymentStatus.FAILED,
					gatewayResponse: executedPaymentResult,
				},
			});
			return {
				redirectUrl: `${config.frontend_url}/dashboard/my-appointments?status=failure`,
			};
		} else if (status === "cancel") {
			await tx.payment.update({
				where: {
					bkashPaymentId: paymentId,
				},
				data: {
					status: PaymentStatus.FAILED,
					gatewayResponse: executedPaymentResult,
				},
			});
			return {
				executedPaymentResult,
				redirectUrl: `${config.frontend_url}/dashboard/my-appointments?status=cancel`,
			};
		} else {
			return {
				executedPaymentResult,
				redirectUrl: `${config.frontend_url}/dashboard/my-appointments?error=payment-failed`,
			};
		}
	});

	return transactionResult;
};

export const PaymentService = {
	getAllPayments,
	getMyPayments,
	getSinglePayment,
	// proceedToPay,
	payServiceRequest,
	payServiceRequestCallback,
};
