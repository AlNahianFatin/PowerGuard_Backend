import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { AssignmentController } from "./assignment.controller";
import {
	AssignTechnicianValidationZodSchema,
	UpdateAssignmentStatusValidationZodSchema,
	UpdateAssignmentValidationZodSchema,
} from "./assignment.validation";

const router = Router();

router.get(
	"/all-assignments",
	auth(Role.ADMIN, Role.OPERATOR),
	AssignmentController.getAllAssignments,
);

router.get(
	"/my-assignments",
	auth(Role.ADMIN, Role.OPERATOR, Role.TECHNICIAN),
	AssignmentController.getMyAssignments,
);

router.get(
	"/:assignmentId",
	auth(Role.ADMIN, Role.OPERATOR, Role.TECHNICIAN, Role.CUSTOMER),
	AssignmentController.getSingleAssignment,
);

router.post(
	"/assign-technician/:requestId",
	auth(Role.ADMIN, Role.OPERATOR),
	validateRequest(AssignTechnicianValidationZodSchema),
	AssignmentController.assignTechnician,
);

router.patch(
	"/update-assignment/:assignmentId",
	auth(Role.ADMIN, Role.OPERATOR),
	validateRequest(UpdateAssignmentValidationZodSchema),
	AssignmentController.updateAssignment,
);

router.delete(
	"/delete-assignment/:assignmentId",
	auth(Role.ADMIN, Role.OPERATOR),
	AssignmentController.deleteAssignment,
);

router.patch(
	"/update-assignment-status-technician/:assignmentId",
	auth(Role.TECHNICIAN),
	validateRequest(UpdateAssignmentStatusValidationZodSchema),
	AssignmentController.updateAssignmentStatusByTechnician,
);

export const AssignmentRoutes = router;
