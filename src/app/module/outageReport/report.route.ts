import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { ReportController } from "./report.controller";
import {
	SubmitReportValidationZodSchema,
	UpdateReportValidationZodSchema,
	UpdateReportStatusValidationZodSchema,
} from "./report.validation";

const router = Router();

router.post(
	"/submit-report",
	auth(Role.CUSTOMER),
	validateRequest(SubmitReportValidationZodSchema),
	ReportController.submitReport,
);

router.patch(
	"/update-report/:reportId",
	auth(Role.CUSTOMER),
	validateRequest(UpdateReportValidationZodSchema),
	ReportController.updateReport,
);

router.patch(
	"/update-report-status-operator/:reportId",
	auth(Role.OPERATOR),
	validateRequest(UpdateReportStatusValidationZodSchema),
	ReportController.updateReportStatusByOperator,
);

router.patch(
	"/update-report-status-technician/:reportId",
	auth(Role.TECHNICIAN),
	validateRequest(UpdateReportStatusValidationZodSchema),
	ReportController.updateReportStatusByTechnician,
);

// router.patch(
// 	"/assign-report/:reportId",
// 	auth(Role.OPERATOR),
// 	ReportController.assignReport,
// );

// router.post(
// 	"/pay-appointment",
// 	auth(Role.PATIENT),
// 	ReportController.payAppointment,
// );

// router.post(
// 	"/cancel-appointment",
// 	auth(Role.PATIENT, Role.ADMIN, Role.SUPER_ADMIN),
// 	ReportController.cancelAppointment,
// );

// //book appointment callback url
// router.get(
// 	"/book-appointment/payment/callback",
// 	ReportController.bookAppointmentCallback,
// );

router.get(
	"/all-reports",
	auth(Role.ADMIN, Role.OPERATOR, Role.TECHNICIAN),
	ReportController.getAllReports,
);

router.get("/my-reports", auth(Role.CUSTOMER), ReportController.getMyReports);

// router.get(
// 	"/doctor-appointments",
// 	auth(Role.DOCTOR),
// 	ReportController.getDoctorAppointments,
// );

router.get(
	"/:reportId",
	auth(Role.ADMIN, Role.OPERATOR, Role.TECHNICIAN, Role.CUSTOMER),
	ReportController.getSingleReport,
);

export const ReportRoutes = router;
