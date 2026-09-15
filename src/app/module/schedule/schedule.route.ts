import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { ScheduleController } from "./schedule.controller";
import {
	CreateScheduleValidationZodSchema,
	UpdateScheduleValidationZodSchema,
} from "./schedule.validation";

const router = Router();

router.get(
	"/all-schedules",
	auth(Role.ADMIN, Role.OPERATOR),
	ScheduleController.getAllSchedules,
);

router.get("/todays-schedule", ScheduleController.getTodaysSchedules);

router.get("/:scheduleId", ScheduleController.getScheduleById);

router.get(
	"/my-appointed-schedules",
	auth(Role.OPERATOR),
	ScheduleController.getMyAppointedSchedules,
);

router.post(
	"/create-schedule",
	auth(Role.OPERATOR),
	validateRequest(CreateScheduleValidationZodSchema),
	ScheduleController.createSchedule,
);

router.patch(
	"/publish-schedule/:scheduleId",
	auth(Role.OPERATOR),
	ScheduleController.publishSchedule,
);

router.patch(
	"/update-schedule/:scheduleId",
	auth(Role.OPERATOR),
	validateRequest(UpdateScheduleValidationZodSchema),
	ScheduleController.updateSchedule,
);

router.delete(
	"/:scheduleId",
	auth(Role.ADMIN, Role.OPERATOR),
	ScheduleController.deleteSchedule,
);

export const ScheduleRoutes = router;
