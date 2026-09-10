import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { SubstationController } from "./substation.controller";
import {
	CreateSubstationValidationZodSchema,
	UpdateSubstationValidationZodSchema,
} from "./substation.validation";

const router = Router();

router.get(
	"/all-substations",
	auth(Role.ADMIN, Role.OPERATOR),
	SubstationController.getAllSubstations,
);

router.get(
	"/substation/:substationId",
	auth(Role.ADMIN, Role.OPERATOR),
	SubstationController.getSubstationById,
);

router.post(
	"/create-substation",
	auth(Role.ADMIN),
	validateRequest(CreateSubstationValidationZodSchema),
	SubstationController.createSubstation,
);

router.patch(
	"/update-substation/:substationId",
	auth(Role.ADMIN),
	validateRequest(UpdateSubstationValidationZodSchema),
	SubstationController.updateSubstation,
);

router.delete(
	"/delete-substation/:substationId",
	auth(Role.ADMIN),
	SubstationController.deleteSubstation,
);

export const SubstationRoutes = router;
