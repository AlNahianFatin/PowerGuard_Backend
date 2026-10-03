import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { AnalyticsController } from "./analytics.controller";

const router = Router();

router.get(
    "/admin-analytics",
    auth(Role.ADMIN),
    AnalyticsController.getAdminAnalytics,
);

router.get(
    "/operator-analytics",
    auth(Role.OPERATOR),
    AnalyticsController.getOperatorAnalytics,
);

router.get(
    "/technician-analytics",
    auth(Role.TECHNICIAN),
    AnalyticsController.getTechnicianAnalytics,
);

router.get(
    "/customer-analytics",
    auth(Role.CUSTOMER),
    AnalyticsController.getCustomerAnalytics,
);

export const AnalyticsRoutes = router;
