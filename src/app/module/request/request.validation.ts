import z from "zod";
import { ServiceRequestStatus } from "../../../generated/prisma/enums";

export const SubmitRequestValidationZodSchema = z.object({
	title: z
		.string("Must include a valid service request title")
		.min(1, "Service request title is required")
		.max(255, "Service request title must be within 255 characters"),
	description: z
		.string("Must include a valid service request description")
		.max(255, "Service request description must be within 255 characters")
		.optional(),
	areaId: z.string("Must include an area ID"),
});

export const UpdateRequestValidationZodSchema = z.object({
	title: z
		.string("Must include a valid service request title")
		.min(1, "Service request title is required")
		.max(255, "Service request title must be within 255 characters")
		.optional(),
	description: z
		.string("Must include a valid service request description")
		.max(255, "Service request description must be within 255 characters")
		.optional(),
	areaId: z.string("Must include an area ID").optional(),
});

export const CancelRequestValidationZodSchema = z.object({
	requestId: z.string("Must include a valid service request ID"),
});

export const RejectRequestValidationZodSchema = z.object({
	rejectionReason: z
		.string("Must include a valid rejection reason")
		.min(1, "Rejection reason is required")
		.max(255, "Rejection reason must be within 255 characters"),
});
