import z from "zod";

export const SubmitReportValidationZodSchema = z.object({
	title: z
		.string("Must include a valid outage report title")
		.min(1, "Outage report title is required")
		.max(255, "Outage report title must be within 255 characters"),
	areaId: z.string("Must include an area ID"),
	description: z
		.string("Must include a valid outage report description")
		.max(255, "Outage report description must be within 255 characters")
		.optional(),
});

export const UpdateReportValidationZodSchema = z.object({
	scheduleId: z.string().min(1, "Schedule Id Is Required"),
});

export const UpdateReportStatusValidationZodSchema = z.object({
	status: z.enum(
		["ONGOING", "COMPLETED"],
		"Status Must Be Either ONGOING Or COMPLETED",
	),
});
