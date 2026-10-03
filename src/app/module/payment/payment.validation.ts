import z from "zod";

export const PayRequestValidationZodSchema = z.object({
	requestId: z.string("Must include a valid service request ID"),
});
