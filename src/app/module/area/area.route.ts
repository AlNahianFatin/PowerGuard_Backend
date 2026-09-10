import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { AreaController } from "./area.controller";
import {
	CreateAreaValidationZodSchema,
	UpdateAreaValidationZodSchema,
} from "./area.validation";

const router = Router();

router.get(
	"/all-areas",
	auth(Role.ADMIN, Role.OPERATOR),
	AreaController.getAllAreas,
);

router.get(
	"/area/:areaId",
	auth(Role.ADMIN, Role.OPERATOR),
	AreaController.getAreaById,
);

router.post(
	"/create-area",
	auth(Role.ADMIN),
	validateRequest(CreateAreaValidationZodSchema),
	AreaController.createArea,
);

router.patch(
	"/update-area/:areaId",
	auth(Role.ADMIN),
	validateRequest(UpdateAreaValidationZodSchema),
	AreaController.updateArea,
);

router.delete(
	"/delete-area/:areaId",
	auth(Role.ADMIN),
	AreaController.deleteArea,
);

export const AreaRoutes = router;
