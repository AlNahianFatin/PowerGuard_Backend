import { z } from "zod";

export const CreateReportValidationZodSchema = z.object({
	diagnosis: z
		.string("Must include a valid report diagnosis")
		.min(1, "Report diagnosis is required")
		.max(255, "Report diagnosis must be within 255 characters"),

	charge: z.coerce
		.number("Charge must be a valid number")
		.min(0, "Charge cannot be negative")
		.max(99999999.99, "Charge cannot be more than 99999999.99"),
});

export const UpdateReportValidationZodSchema = z.object({
	diagnosis: z
		.string("Must include a valid report diagnosis")
		.min(1, "Report diagnosis is required")
		.max(255, "Report diagnosis must be within 255 characters")
		.optional(),

	charge: z.coerce
		.number("Charge must be a valid number")
		.min(0, "Charge cannot be negative")
		.max(99999999.99, "Charge cannot be more than 99999999.99")
		.optional(),
});
