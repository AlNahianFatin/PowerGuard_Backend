import { z } from "zod";

export const CreateScheduleValidationZodSchema = z.object({
	startDateTime: z
		.iso
		.datetime({
			error: "Please select a valid start date and time",
		}),
	endDateTime: z
		.iso
		.datetime({
			error: "Please select a valid end date and time",
		}),
	reason: z
		.string("Must include a valid reason")
		.min(1, "Must declare a reason")
		.max(1000, "Reason must be within 1000 characters!"),
	feederId: z
		.string("Must include a valid feeder")
		.min(1, "Must select a feeder on which the outage will be scheduled on"),
})
	.refine(
		(data) =>
			new Date(data.endDateTime) > new Date(data.startDateTime),
		{
			message: "End date and time must be after the start date and time",
			path: ["endDateTime"],
		},
	);

export const UpdateScheduleValidationZodSchema = z.object({
	startDateTime: z
		.iso
		.datetime({
			error: "Please select a valid start date and time",
		})
		.optional(),

	endDateTime: z
		.iso
		.datetime({
			error: "Please select a valid end date and time",
		})
		.optional(),

	reason: z
		.string("Must include a valid reason")
		.max(1000, "Reason must be within 1000 characters!")
		.optional(),

	feederId: z
		.string("Must include a valid feeder")
		.optional(),
});
