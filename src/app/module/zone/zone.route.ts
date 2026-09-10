import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { ZoneController } from "./zone.controller";
import {
	CreateDistributionZoneValidationZodSchema,
	UpdateDistributionZoneValidationZodSchema,
} from "./zone.validation";

const router = Router();

router.get(
	"/all-distribution-zones",
	auth(Role.ADMIN, Role.OPERATOR),
	ZoneController.getAllZones,
);

router.get(
	"/distribution-zone/:zoneId",
	auth(Role.ADMIN, Role.OPERATOR),
	ZoneController.getZoneById,
);

router.post(
	"/create-distribution-zone",
	auth(Role.ADMIN),
	validateRequest(CreateDistributionZoneValidationZodSchema),
	ZoneController.createZone,
);

router.patch(
	"/update-distribution-zone/:zoneId",
	auth(Role.ADMIN),
	validateRequest(UpdateDistributionZoneValidationZodSchema),
	ZoneController.updateZone,
);

router.delete(
	"/delete-distribution-zone/:zoneId",
	auth(Role.ADMIN),
	ZoneController.deleteZone,
);

export const ZoneRoutes = router;
