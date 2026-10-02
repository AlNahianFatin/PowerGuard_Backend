import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { ReportController } from "./report.controller";
import {
	SubmitReportValidationZodSchema,
	UpdateReportValidationZodSchema,
} from "./report.validation";

const router = Router();

router.get(
	"/all-reports",
	auth(Role.ADMIN, Role.OPERATOR),
	ReportController.getAllReports,
);

router.get(
	"/my-reports",
	auth(Role.TECHNICIAN, Role.CUSTOMER),
	ReportController.getMyReports,
);

router.get(
	"/:reportId",
	auth(Role.ADMIN, Role.OPERATOR, Role.TECHNICIAN, Role.CUSTOMER),
	ReportController.getSingleReport,
);

router.post(
	"/submit-report/:assignmentId",
	auth(Role.TECHNICIAN),
	validateRequest(SubmitReportValidationZodSchema),
	ReportController.submitReport,
);

router.patch(
	"/update-report/:reportId",
	auth(Role.TECHNICIAN),
	validateRequest(UpdateReportValidationZodSchema),
	ReportController.updateReport,
);

export const ReportRoutes = router;
