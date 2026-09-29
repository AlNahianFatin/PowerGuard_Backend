import { z } from "zod";

export const CreateAreaValidationZodSchema = z.object({
	name: z
		.string("Must include a valid area name")
		.min(1, "Area name is required")
		.max(255, "Area name must be within 255 characters"),

	code: z
		.string("Must include a valid area code")
		.min(1, "Area code is required")
		.max(100, "Area code must be within 100 characters"),

	description: z
		.string("Must include a valid description")
		.max(1000, "Description must be within 1000 characters")
		.optional(),

	feederId: z.string("Feeder ID must be a valid string"),
});

export const UpdateAreaValidationZodSchema = z.object({
	name: z
		.string("Must include a valid area name")
		.min(1, "Area name is required")
		.max(255, "Area name must be within 255 characters")
		.optional(),

	code: z
		.string("Must include a valid area code")
		.min(1, "Area code is required")
		.max(100, "Area code must be within 100 characters")
		.optional(),

	description: z
		.string("Must include a valid description")
		.max(1000, "Description must be within 1000 characters")
		.optional(),

	feederId: z.string("Feeder ID must be a valid string").optional(),
});
