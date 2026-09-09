import { z } from "zod";

export const CreateSubstationValidationZodSchema = z.object({
	name: z
		.string("Must include a valid substation name")
		.min(1, "Substation name is required")
		.max(255, "Substation name must be within 255 characters"),

	code: z
		.string("Must include a valid substation code")
		.min(1, "Substation code is required")
		.max(100, "Substation code must be within 100 characters"),

	description: z
		.string("Must include a valid description")
		.max(1000, "Description must be within 1000 characters")
		.optional(),

	zoneId: z
		.string("Distribution zone ID must be a valid string")
		.min(1, "At least one feeder is required"),
});

export const UpdateSubstationValidationZodSchema = z.object({
	name: z
		.string("Must include a valid substation name")
		.min(1, "Substation name is required")
		.max(255, "Substation name must be within 255 characters")
		.optional(),

	code: z
		.string("Must include a valid substation code")
		.min(1, "Substation code is required")
		.max(100, "Substation code must be within 100 characters")
		.optional(),

	description: z
		.string("Must include a valid description")
		.max(1000, "Description must be within 1000 characters")
		.optional(),

	zoneId: z
		.string("Distribution zone ID must be a valid string")
		.min(1, "At least one feeder is required")
		.optional(),

	substationIds: z
		.array(
			z.string("Each feeder ID must be a valid string"),
			"Feeder IDs must be an array",
		)
		.min(1, "At least one feeder is required")
		.optional(),
});
