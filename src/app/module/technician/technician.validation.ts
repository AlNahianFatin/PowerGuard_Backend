import { z } from "zod";

export const MAX_FILE_SIZE = 5;

export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE * 1024 * 1024;

export const MAX_ADDITIONAL_FILES = 5;

export const MAX_BIO_LENGTH = 1000;

export const ACCEPTED_FILE_TYPES = [
	"application/pdf",
	"application/msword",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	"image/png",
	"image/jpg",
	"image/jpeg",
];

export function isAcceptedFileSize(fileSize: number) {
	return fileSize <= MAX_FILE_SIZE_BYTES;
}

export function isAcceptedFileType(fileType: string) {
	return ACCEPTED_FILE_TYPES.includes(fileType);
}

export const getCustomFileSchema = <T>(message: string) =>
	z.custom<T>(
		(value) =>
			value === null ||
			value === undefined ||
			(typeof value === "object" &&
				value !== null &&
				"size" in value &&
				"mimetype" in value &&
				isAcceptedFileSize(Number(value.size)) &&
				isAcceptedFileType(String(value.mimetype))),
		{
			message,
		},
	);

export const ApplyAsTechnicianValidationZodSchema = z.object({
	resume: getCustomFileSchema<File | null>(
		`Resume must be a PDF, DOC, DOCX or an image file under ${MAX_FILE_SIZE}MB`,
	)
		.refine((value) => typeof value === "object" &&
			value !== null &&
			"mimetype" in value, {
			message: "A resume or CV is required",
		}),

	additionalFiles: z
		.array(z.custom<File>((value) => value instanceof File))
		.max(
			MAX_ADDITIONAL_FILES,
			`You can attach at most ${MAX_ADDITIONAL_FILES} supporting documents`,
		)
		.refine(
			(files) =>
				files.every(
					(file) =>
						isAcceptedFileSize(file.size) && isAcceptedFileType(file.type),
				),
			{
				message: `Each file must be a PDF, DOC, DOCX or an image file under ${MAX_FILE_SIZE}MB`,
			},
		),

	data: z.object({
		user: z.object({
			name: z
				.string("Not a string!")
				.trim()
				.min(3, "Name must be at least 3 characters long!")
				.max(15, "Name cannot be greater than 15 characters long!"),

			email: z.email("Not a valid email!").trim().toLowerCase(),
		}),

		technician: z.object({
			address: z
				.string("Not a string!")
				.trim()
				.max(100, "Address cannot be greater than 100 characters long")
				.optional(),

			experienceYears: z
				.coerce
				.number()
				.int("Years of experience must be whole value")
				.refine((value) => Number(value) >= 0 && Number(value) <= 60, {
					message: "Years of experience must be between 0 and 60",
				}),

			bio: z
				.string("Not a string!")
				.trim()
				.max(MAX_BIO_LENGTH, `Bio cannot exceed ${MAX_BIO_LENGTH} characters`)
				.optional(),

			contactNumber: z
				.string("Not a string!")
				.refine((val) => val === "" || /^(?:\+?880|0)1[3-9]\d{8}$/.test(val), {
					message: "Please provide valid Bangladeshi number",
				})
				.optional(),
		}),
	})
});

export const UpdateTechnicianProfileValidationZodSchema = z.object({
	name: z
		.string("Not a string!")
		.trim()
		.min(3, "Name must be at least 3 characters long!")
		.max(15, "Name cannot be greater than 15 characters long!")
		.optional(),

	address: z
		.string("Not a string!")
		.trim()
		.max(100, "Address cannot be greater than 100 characters long")
		.optional(),

	bio: z
		.string("Not a string!")
		.trim()
		.max(MAX_BIO_LENGTH, `Bio cannot exceed ${MAX_BIO_LENGTH} characters`),

	contactNumber: z
		.string("Not a string!")
		.refine((val) => val === "" || /^(?:\+?880|0)1[3-9]\d{8}$/.test(val), {
			message: "Please provide valid Bangladeshi number",
		})
		.optional(),
});

export const SetTechnicianPasswordValidationZodSchema = z.object({
	email: z.email("Not a valid email!").trim().toLowerCase(),

	password: z
		.string("Not a string!!!!!")
		.min(8, "Password must be minimum 8 characters Long.")
		.regex(/[a-z]/, "Password must contain at least 1 lowercase letter")
		.regex(/[A-Z]/, "Password must contain at least 1 uppercase letter")

		.regex(/[0-9]/, "Password must contain at least 1 number")
		.regex(
			/[^A-Za-z0-9]/,
			"Password must contain at least 1 special character",
		),

	confirmPassword: z.string("Not a string!").min(1, "Please confirm your password"),
})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match!",
		path: ["confirmPassword"],
	});