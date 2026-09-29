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

export const RejectRequestValidationZodSchema = z.object({
	rejectionReason: z
		.string("Must include a valid rejection reason")
		.min(1, "Rejection reason is required")
		.max(255, "Rejection reason must be within 255 characters"),
});

export const AssignTechnicianValidationZodSchema = z.object({
	technicianId: z.string("Must include the technician ID"),
	notes: z
		.string("Must include a valid note for the technician or customer")
		.min(1, "Note is required")
		.max(255, "Note must be within 255 characters")
		.optional(),
});

export const UpdateRequestStatusValidationZodSchema = z.object({
	status: z.enum(
		[
			ServiceRequestStatus.INSPECTING,
			ServiceRequestStatus.RESOLVED,
			ServiceRequestStatus.FAILED,
		],
		"Please enter a valid status!",
	),
	failureNote: z
		.string("Must include a valid failure note for the customer")
		.min(1, "Note is required")
		.max(255, "Note must be within 255 characters")
		.optional(),
});
