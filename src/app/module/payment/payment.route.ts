import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { PaymentController } from "./payment.controller";

const router = Router();

router.get(
	"/all-payments",
	auth(Role.ADMIN, Role.OPERATOR),
	PaymentController.getAllPayments,
);

router.get(
	"/my-payments",
	auth(Role.TECHNICIAN, Role.CUSTOMER),
	PaymentController.getMyPayments,
);

router.get(
	"/:paymentId",
	auth(Role.ADMIN, Role.OPERATOR, Role.TECHNICIAN, Role.CUSTOMER),
	PaymentController.getSinglePayment,
);

router.post(
	"/pay-service-request",
	auth(Role.CUSTOMER),
	PaymentController.payServiceRequest,
);

//pay service request callback url
router.get(
	"/pay-service-request/callback",
	PaymentController.payServiceRequestCallback,
);

export const PaymentRoutes = router;
