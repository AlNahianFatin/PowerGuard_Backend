import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { ReportService } from "./report.service";

const submitReport = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;
	const user = req.user!;

	const result = await ReportService.submitReport(payload, user);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Outage report submitted successfully",
		data: result,
	});
});

// const payAppointment = catchAsync(async (req: Request, res: Response) => {
// 	const payload = req.body;
// 	const user = req.user!;

// 	const result = await AppointmentServices.payAppointment(payload, user);
// 	sendResponse(res, {
// 		statusCode: httpStatus.OK,
// 		success: true,
// 		message: "Appointment Payment Initiated Successfully",
// 		data: result,
// 	});
// });

// const bookAppointmentCallback = catchAsync(
// 	async (req: Request, res: Response) => {
// 		const { redirectUrl } = await AppointmentServices.bookAppointmentCallback(
// 			req.query,
// 		);

// 		res.redirect(redirectUrl);
// 		// sendResponse(res, {
// 		//     statusCode: httpStatus.OK,
// 		//     success: true,
// 		//     message: "User profile fetched successfully",
// 		//     data: result,
// 		// });
// 	},
// );

const updateReport = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;
	const reportId = req.params.reportId as string;
	const user = req.user!;

	const result = await ReportService.updateReport(payload, reportId, user);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Outage report updated successfully",
		data: result,
	});
});

const updateReportStatusByOperator = catchAsync(
	async (req: Request, res: Response) => {
		const reportId = req.params.reportId as string;
		const payload = req.body;
		const user = req.user!;

		const result = await ReportService.updateReportStatusByOperator(
			reportId,
			payload,
			user,
		);
		sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: "Outage report status updated successfully",
			data: result,
		});
	},
);

const updateReportStatusByTechnician = catchAsync(
	async (req: Request, res: Response) => {
		const reportId = req.params.reportId as string;
		const payload = req.body;
		const user = req.user!;

		const result = await ReportService.updateReportStatusByTechnician(
			reportId,
			payload,
			user,
		);
		sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: "Outage report status updated successfully",
			data: result,
		});
	},
);

const getAllReports = catchAsync(async (req: Request, res: Response) => {
	const { data, meta } = await ReportService.getAllReports(req.query);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Outage reports retrieved successfully",
		data,
		meta,
	});
});

const getMyReports = catchAsync(async (req: Request, res: Response) => {
	const user = req.user!;

	const { data, meta } = await ReportService.getMyReports(req.query, user);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Outage reports retrieved successfully",
		data,
		meta,
	});
});

// const assignReport = catchAsync(async (req: Request, res: Response) => {
// 	const user = req.user!;

// 	const result = await ReportService.assignReport(user);
// 	sendResponse(res, {
// 		statusCode: httpStatus.OK,
// 		success: true,
// 		message: `Outage report assigned to ${result.name} successfully`,
// 		data: result,
// 	});
// });

const getSingleReport = catchAsync(async (req: Request, res: Response) => {
	const reportId = req.params.reportId as string;
	const user = req.user!;

	const result = await ReportService.getSingleReport(reportId, user);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Outage report retrieved successfully",
		data: result,
	});
});

export const ReportController = {
	submitReport,
	updateReport,
	updateReportStatusByOperator,
	updateReportStatusByTechnician,
	// assignReport,
	getAllReports,
	getMyReports,
	getSingleReport,
};
