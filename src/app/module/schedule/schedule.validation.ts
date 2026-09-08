import { z } from "zod";

export const CreateScheduleValidationZodSchema = z.object({
	startDateTime: z.coerce.date("Invalid Start Date Time"),
	endDateTime: z.coerce.date("Invalid End Date Time"),
	reason: z
		.string("Must include a valid reason")
		.max(1000, "Reason must be within 1000 characters!!!"),
	feederId: z.string("Must include a valid feeder"),
});

export const UpdateScheduleValidationZodSchema = z.object({
	startDateTime: z.coerce.date("Invalid Start Date Time").optional(),
	endDateTime: z.coerce.date("Invalid End Date Time").optional(),
	reason: z
		.string("Must include a valid reason")
		.max(1000, "Reason must be within 1000 characters!!!")
		.optional(),
	feederId: z.string("Must include a valid feeder").optional()
});
