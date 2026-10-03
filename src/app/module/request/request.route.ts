import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { RequestController } from "./request.controller";
import {
	RejectRequestValidationZodSchema,
	SubmitRequestValidationZodSchema,
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

router.post(
	"/cancel-request",
	auth(Role.CUSTOMER),
	RequestController.cancelRequest,
);

router.patch(
	"/reject-request/:requestId",
	auth(Role.ADMIN, Role.OPERATOR),
	validateRequest(RejectRequestValidationZodSchema),
	RequestController.rejectRequest,
);

export const RequestRoutes = router;
