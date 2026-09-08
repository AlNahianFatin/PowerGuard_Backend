import type { Request, Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../../utils/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { TechnicianService } from "./technician.service";
import { ApplyAsTechnicianValidationZodSchema } from "./technician.validation";

const applyAsTechnician = catchAsync(async (req: Request, res: Response) => {
	const files = req.files as { [fieldname: string]: Express.Multer.File[] };
	console.log({ files });
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

	const result = await TechnicianService.applyAsDoctor(
		payload,
		resume,
		additionalFiles,
	);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Applied As Doctor Successfuly",
		data: result,
	});
});

const verifyTechnicianEmail = catchAsync(
	async (req: Request, res: Response) => {
		const payload = req.body;

		const result = await TechnicianService.verifyDoctorEmail(payload);
		sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: "Doctor Email Verified Successfully",
			data: result,
		});
	},
);

const approveTechnician = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;
	const user = req.user!;

	const result = await TechnicianService.approveDoctor(payload, user);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Doctor Email Verified Successfully",
		data: result,
	});
});

const getAllTechnicians = catchAsync(async (req: Request, res: Response) => {
	const { data, meta } = await TechnicianService.getAllDoctors(req.query);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Doctors Retrieved Successfully",
		data: data,
		meta: meta,
	});
});

const updateTechnicianProfile = catchAsync(
	async (req: Request, res: Response) => {
		const payload = req.body;
		const user = req.user!;

		const result = await TechnicianService.updateDoctorProfile(payload, user);
		sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: "Doctor Profile Updated Successfully",
			data: result,
		});
	},
);

const getAvailableTechnicianByTodaysSchedule = catchAsync(
	async (req: Request, res: Response) => {
		const { data, meta } =
			await TechnicianService.getAvailableDoctorByTodaysSchedule(req.query);
		sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: "Today's Available Doctors Retrieved Successfully",
			data,
			meta,
		});
	},
);

// const getAllDoctorsListPublic = catchAsync(async (req: Request, res: Response) => {

// 	const { data, meta } = await DoctorServices.getAllDoctorsListPublic(
// 		req.query
// 	);
// 	sendResponse(res, {
// 		statusCode: httpStatus.OK,
// 		success: true,
// 		message: "Doctors Retrieved Successfully",
// 		data,
// 		meta,
// 	});
// });

// const getSingleDoctorPublicProfile = catchAsync(
// 	async (req: Request, res: Response) => {

// 		const doctorId = req.params.doctorId as string

// 		const result = await DoctorServices.getSingleDoctorPublicProfile(
// 			doctorId
// 		);
// 		sendResponse(res, {
// 			statusCode: httpStatus.OK,
// 			success: true,
// 			message: "Doctor Profile Retrieved Successfully",
// 			data: result,
// 		});
// 	},
// );

export const TechnicianController = {
	applyAsTechnician,
	verifyTechnicianEmail,
	approveTechnician,
	getAllTechnicians,
	updateTechnicianProfile,
	getAvailableTechnicianByTodaysSchedule,
	// getAllDoctorsListPublic,
	// getSingleDoctorPublicProfile,
};
