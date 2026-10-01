import { z } from "zod";

export const CreateFeederValidationZodSchema = z.object({
	name: z
		.string("Must include a valid feeder name")
		.min(1, "Feeder name is required")
		.max(255, "Feeder name must be within 255 characters"),

	code: z
		.string("Must include a valid feeder code")
		.min(1, "Feeder code is required")
		.max(100, "Feeder code must be within 100 characters"),

	description: z
		.string("Must include a valid description")
		.max(1000, "Description must be within 1000 characters")
		.optional(),

	// repairingCost: z.coerce
	// 	.number("Repairing cost must be a valid number")
	// 	.min(0, "Repairing cost cannot be negative"),

	substationId: z.string("Substation ID must be a valid string"),
});

export const UpdateFeederValidationZodSchema = z.object({
	name: z
		.string("Must include a valid feeder name")
		.min(1, "Feeder name is required")
		.max(255, "Feeder name must be within 255 characters")
		.optional(),

	code: z
		.string("Must include a valid feeder code")
		.min(1, "Feeder code is required")
		.max(100, "Feeder code must be within 100 characters")
		.optional(),

	description: z
		.string("Must include a valid description")
		.max(1000, "Description must be within 1000 characters")
		.optional(),

	// repairingCost: z.coerce
	// 	.number("Repairing cost must be a valid number")
	// 	.min(0, "Repairing cost cannot be negative")
	// 	.optional(),

	substationId: z.string("Substation ID must be a valid string").optional(),

	areaIds: z
		.array(
			z.string("Each area ID must be a valid string"),
			"Area IDs must be an array",
		)
		.min(1, "At least one area is required")
		.optional(),
});
