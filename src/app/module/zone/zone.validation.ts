import { z } from "zod";

export const CreateDistributionZoneValidationZodSchema = z.object({
	name: z
		.string("Must include a valid distribution zone name")
		.min(1, "Distribution zone name is required")
		.max(255, "Distribution zone name must be within 255 characters"),

	code: z
		.string("Must include a valid distribution zone code")
		.min(1, "Distribution zone code is required")
		.max(100, "Distribution zone code must be within 100 characters"),

	description: z
		.string("Must include a valid description")
		.max(1000, "Description must be within 1000 characters")
		.optional(),
});

export const UpdateDistributionZoneValidationZodSchema = z.object({
	name: z
		.string("Must include a valid distribution zone name")
		.min(1, "Distribution zone name is required")
		.max(255, "Distribution zone name must be within 255 characters")
		.optional(),

	code: z
		.string("Must include a valid distribution zone code")
		.min(1, "Distribution zone code is required")
		.max(100, "Distribution zone code must be within 100 characters")
		.optional(),

	description: z
		.string("Must include a valid description")
		.max(1000, "Description must be within 1000 characters")
		.optional(),

	substationIds: z
		.array(
			z.string("Each substation ID must be a valid string"),
			"Substation IDs must be an array",
		)
		.min(1, "At least one substation is required")
		.optional(),
});
