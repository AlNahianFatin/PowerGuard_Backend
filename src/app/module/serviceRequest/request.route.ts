import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { RequestController } from "./request.controller";
import {
	RejectRequestValidationZodSchema,
	SubmitRequestValidationZodSchema,
	UpdateRequestStatusValidationZodSchema,
	UpdateRequestValidationZodSchema,
} from "./request.validation";

const router = Router();

router.get(
	"/all-requests",
	auth(Role.ADMIN, Role.OPERATOR, Role.TECHNICIAN),
	RequestController.getAllRequests,
);

router.get(
	"/my-requests",
	auth(Role.CUSTOMER),
	RequestController.getMyRequests,
);

router.post(
	"/submit-request",
	auth(Role.CUSTOMER),
	validateRequest(SubmitRequestValidationZodSchema),
	RequestController.submitRequest,
);

router.get(
	"/:requestId",
	auth(Role.ADMIN, Role.OPERATOR, Role.TECHNICIAN, Role.CUSTOMER),
	RequestController.getSingleRequest,
);

router.patch(
	"/update-request/:requestId",
	auth(Role.CUSTOMER),
	validateRequest(UpdateRequestValidationZodSchema),
	RequestController.updateRequest,
);

router.patch(
	"/cancel-request/:requestId",
	auth(Role.CUSTOMER),
	RequestController.cancelRequest,
);

router.patch(
	"/reject-request/:requestId",
	auth(Role.ADMIN, Role.OPERATOR),
	validateRequest(RejectRequestValidationZodSchema),
	RequestController.rejectRequest,
);

router.post(
	"/assign-request/:requestId",
	auth(Role.ADMIN, Role.OPERATOR),
	RequestController.assignRequest,
);

router.patch(
	"/update-request-status-technician/:requestId",
	auth(Role.TECHNICIAN),
	validateRequest(UpdateRequestStatusValidationZodSchema),
	RequestController.updateRequestStatusByTechnician,
);

// router.post(
// 	"/pay-appointment",
// 	auth(Role.CUSTOMER),
// 	ReportController.payAppointment,
// );

// router.post(
// 	"/cancel-appointment",
// 	auth(Role.CUSTOMER, Role.ADMIN, Role.SUPER_ADMIN),
// 	ReportController.cancelAppointment,
// );

// //outage report callback url
// router.get(
// 	"/book-appointment/payment/callback",
// 	ReportController.bookAppointmentCallback,
// );

// router.get(
// 	"/doctor-appointments",
// 	auth(Role.DOCTOR),
// 	ReportController.getDoctorAppointments,
// );

export const RequestRoutes = router;
