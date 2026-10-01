import z from "zod";

const CustomerRegistrationZodSchema = z.object({
	name: z
		.string("Not a string!!!!!")
		.trim()
		.min(3, "Name must be at least 3 characters long!!!")
		.max(15, "Name cannot be greater than 15 characters long!!!"),
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
	customer: z
		.object({
			contactNumber: z.string().optional(),
			address: z.string().optional(),
		})
		.optional(),
});
const CustomerEmailVerifyZodSchema = z.object({
	email: z.email("Not a valid email!").trim().toLowerCase(),
	otp: z.string().length(6),
});

const LoginZodSchema = z.object({
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
});

const ForgotPasswordZodSchema = z.object({
	email: z.email("Not a valid email!").trim().toLowerCase(),
});

const ResetPasswordZodSchema = z.object({
	email: z.email("Not a valid email!").trim().toLowerCase(),
	newPassword: z
		.string("Not a string!!!!!")
		.min(8, "Password must be minimum 8 characters Long.")
		.regex(/[a-z]/, "Password must contain at least 1 lowercase letter")
		.regex(/[A-Z]/, "Password must contain at least 1 uppercase letter")

		.regex(/[0-9]/, "Password must contain at least 1 number")
		.regex(
			/[^A-Za-z0-9]/,
			"Password must contain at least 1 special character",
		),
	otp: z.string().length(6),
});

export const UserValidation = {
	CustomerRegistrationZodSchema,
	CustomerEmailVerifyZodSchema,
	LoginZodSchema,
	ForgotPasswordZodSchema,
	ResetPasswordZodSchema,
};
