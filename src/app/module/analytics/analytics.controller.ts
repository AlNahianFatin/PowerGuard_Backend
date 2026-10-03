import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { AnalyticsService } from "./analytics.service";

const getAdminAnalytics = catchAsync(async (req: Request, res: Response) => {
	const result = await AnalyticsService.getAdminAnalytics();

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Admin Analytics Retrieved Successfully",
		data: result,
	});
});

const getOperatorAnalytics = catchAsync(async (req: Request, res: Response) => {
	const user = req.user!;

	const result = await AnalyticsService.getOperatorAnalytics(user);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Operator Analytics Retrieved Successfully",
		data: result,
	});
});

const getTechnicianAnalytics = catchAsync(
	async (req: Request, res: Response) => {
		const user = req.user!;

		const result = await AnalyticsService.getTechnicianAnalytics(user);

		sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: "Technician Analytics Retrieved Successfully",
			data: result,
		});
	},
);

const getCustomerAnalytics = catchAsync(async (req: Request, res: Response) => {
	const user = req.user!;

	const result = await AnalyticsService.getCustomerAnalytics(user);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Customer Analytics Retrieved Successfully",
		data: result,
	});
});

export const AnalyticsController = {
	getAdminAnalytics,
	getOperatorAnalytics,
	getTechnicianAnalytics,
	getCustomerAnalytics,
};
