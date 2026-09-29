import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { upload } from "../../lib/multer";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { TechnicianController } from "./technician.controller";
import {
	UpdateTechnicianProfileValidationZodSchema,
	ChangeTechnicianPasswordValidationZodSchema,
} from "./technician.validation";

const router = Router();

router.post(
	"/apply-as-technician",
	// validateRequest(UserValidation.ResetPasswordZodSchema),
	upload.fields([
		{
			name: "resume",
			maxCount: 1,
		},

		{
			name: "additionalFiles",
			maxCount: 10,
		},
	]),
	TechnicianController.applyAsTechnician,
);

router.post(
	"/apply-as-technician/verify-email",
	TechnicianController.verifyTechnicianEmail,
);

router.post(
	"/approve-technician",
	auth(Role.ADMIN),
	TechnicianController.approveTechnician,
);

router.patch(
	"/change-password",
	validateRequest(ChangeTechnicianPasswordValidationZodSchema),
	TechnicianController.changePassword,
);

router.get(
	"/all-technicians",
	auth(Role.ADMIN, Role.OPERATOR),
	TechnicianController.getAllTechnicians,
);

router.patch(
	"/update-my-profile",
	auth(Role.TECHNICIAN),
	validateRequest(UpdateTechnicianProfileValidationZodSchema),
	TechnicianController.updateTechnicianProfile,
);

// Operator technician-discovery routes (no auth) — meant for operators browsing to assign to resolve outage.
router.get(
	"/available-today",
	auth(Role.ADMIN, Role.OPERATOR),
	TechnicianController.getAvailableTechnicianByTodaysSchedule,
);

// router.get("/public/all-technicians", TechnicianController.getAllTechniciansListPublic);

router.get(
	"/public/:technicianId",
	TechnicianController.getSingleTechnicianPublicProfile,
);

export const TechnicianRoutes = router;
