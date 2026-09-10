import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { FeederController } from "./feeder.controller";
import {
	CreateFeederValidationZodSchema,
	UpdateFeederValidationZodSchema,
} from "./feeder.validation";

const router = Router();

router.get(
	"/all-feeders",
	auth(Role.ADMIN, Role.OPERATOR),
	FeederController.getAllFeeders,
);

router.get(
	"/feeder/:feederId",
	auth(Role.ADMIN, Role.OPERATOR),
	FeederController.getFeederById,
);

router.post(
	"/create-feeder",
	auth(Role.ADMIN),
	validateRequest(CreateFeederValidationZodSchema),
	FeederController.createFeeder,
);

router.patch(
	"/update-feeder/:feederId",
	auth(Role.ADMIN),
	validateRequest(UpdateFeederValidationZodSchema),
	FeederController.updateFeeder,
);

router.delete(
	"/delete-feeder/:feederId",
	auth(Role.ADMIN),
	FeederController.deleteFeeder,
);

export const FeederRoutes = router;
