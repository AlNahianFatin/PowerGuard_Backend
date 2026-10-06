import type { Request, Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../../utils/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { TechnicianService } from "./technician.service";
import { ApplyAsTechnicianValidationZodSchema } from "./technician.validation";
import { TechnicianVerificationStatus } from "../../../generated/prisma/enums";

const applyAsTechnician = catchAsync(async (req: Request, res: Response) => {
	const files = req.files as { [fieldname: string]: Express.Multer.File[] };
	const resume = files?.["resume"] ? files["resume"][0] : null;
	const additionalFiles = files?.["additionalFiles"] || [];

	const zodValidationResult = ApplyAsTechnicianValidationZodSchema.safeParse(
		JSON.parse(req.body.data),
	);

	if (!zodValidationResult.success) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			zodValidationResult.error.issues[0].message,
		);
	}

	const payload = zodValidationResult.data;

	const result = await TechnicianService.applyAsTechnician(
		payload,
		resume,
		additionalFiles,
	);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Applied As Technician Successfully",
		data: result,
	});
});

const verifyTechnicianEmail = catchAsync(
	async (req: Request, res: Response) => {
		const payload = req.body;

		const result = await TechnicianService.verifyTechnicianEmail(payload);
		sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: "Technician Email Verified Successfully",
			data: result,
		});
	},
);

const approveTechnician = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;
	const user = req.user!;

	const result = await TechnicianService.approveTechnician(payload, user);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message:
			payload.reason === TechnicianVerificationStatus.APPROVED
				? "Technician approved successfully"
				: payload.reason === TechnicianVerificationStatus.REJECTED
					? "Technician rejected successfully"
					: "Request managed",
		data: result,
	});
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;

	const result = await TechnicianService.changePassword(payload);
	const { accessToken, refreshToken } = result;

	res.cookie("accessToken", accessToken, {
		httpOnly: true,
		secure: false,
		sameSite: "none",
		maxAge: 1000 * 60 * 60 * 24, // 24 hour or 1 day
	});
	res.cookie("refreshToken", refreshToken, {
		httpOnly: true,
		secure: false,
		sameSite: "none",
		maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
	});

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Technician Password Updated and Logged in Successfully",
		data: {
			accessToken,
			refreshToken,
		},
	});
});

const getAllTechnicians = catchAsync(async (req: Request, res: Response) => {
	const { data, meta } = await TechnicianService.getAllTechnicians(req.query);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Technicians Retrieved Successfully",
		data: data,
		meta: meta,
	});
});

const updateTechnicianProfile = catchAsync(
	async (req: Request, res: Response) => {
		const payload = req.body;
		const user = req.user!;

		const result = await TechnicianService.updateTechnicianProfile(
			payload,
			user,
		);
		sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: "Technician Profile Updated Successfully",
			data: result,
		});
	},
);

const getAvailableTechnicianByTodaysSchedule = catchAsync(
	async (req: Request, res: Response) => {
		const { data, meta } =
			await TechnicianService.getAvailableTechnicianByTodaysSchedule(req.query);
		sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: "Today's Available Technicians Retrieved Successfully",
			data,
			meta,
		});
	},
);

const getSingleTechnicianPublicProfile = catchAsync(
	async (req: Request, res: Response) => {
		const technicianId = req.params.technicianId as string;

		const result =
			await TechnicianService.getSingleTechnicianPublicProfile(technicianId);
		sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: "Technician Profile Retrieved Successfully",
			data: result,
		});
	},
);

export const TechnicianController = {
	applyAsTechnician,
	verifyTechnicianEmail,
	approveTechnician,
	changePassword,
	getAllTechnicians,
	updateTechnicianProfile,
	getAvailableTechnicianByTodaysSchedule,
	getSingleTechnicianPublicProfile,
};
