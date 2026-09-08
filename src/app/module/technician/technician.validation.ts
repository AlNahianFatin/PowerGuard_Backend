import { z } from "zod";

export const ApplyAsTechnicianValidationZodSchema = z.object({
	user: z.object({
		name: z
		.string("Not a string!!!!!")
		.trim()
		.min(3, "Name must be at least 3 characters long!!!")
		.max(15, "Name cannot be greater than 15 characters long!!!"),

		email: z.email("Not a valid email!").trim().toLowerCase(),
	}),

	technician: z.object({
		address: z
			.string("Not a string!!!!!")
			.trim()
			.min(5, "Address must be at least 5 characters long")
			.optional(),

		// Handles converting incoming FormData strings like "12" into an integer number
		experienceYears: z
			.number()
			.int("Experience years must be an integer")
			.min(0, "Experience years cannot be negative"),

		bio: z
			.string("Not a string!!!!!")
			.trim()
			.max(1000, "Bio cannot exceed 1000 characters")
			.optional(),

		contactNumber: z
			.string("Not a string!!!!!")
			.trim()
			.min(5, "Contact number is invalid")
			.optional(),
	}),
});

export const UpdateTechnicianProfileValidationZodSchema = z.object({
	address: z
		.string("Not a string!!!!!")
		.trim()
		.min(5, "Address must be at least 5 characters long")
		.optional(),

	bio: z
		.string("Not a string!!!!!")
		.trim()
		.max(1000, "Bio cannot exceed 1000 characters")
		.optional(),

	contactNumber: z
		.string()
		.trim()
		.min(5, "Contact number is invalid")
		.optional(),
});