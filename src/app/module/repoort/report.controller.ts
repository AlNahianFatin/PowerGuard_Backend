import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { ReportService } from "./report.service";

const getAllReports = catchAsync(async (req: Request, res: Response) => {
	const { data, meta } = await ReportService.getAllReports(req.query);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Technician reports retrieved successfully",
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
		message: "Technician reports retrieved successfully",
		data,
		meta,
	});
});

const getSingleReport = catchAsync(async (req: Request, res: Response) => {
	const reportId = req.params.reportId as string;

	const result = await ReportService.getSingleReport(reportId);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Technician report retrieved successfully",
		data: result,
	});
});

const submitReport = catchAsync(async (req: Request, res: Response) => {
	const assignmentId = req.params.assignmentId as string;
	const payload = req.body;
	const user = req.user!;

	const result = await ReportService.submitReport(assignmentId, payload, user);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Technician report submitted successfully",
		data: result,
	});
});

const updateReport = catchAsync(async (req: Request, res: Response) => {
	const reportId = req.params.reportId as string;
	const payload = req.body;
	const user = req.user!;

	const result = await ReportService.updateReport(reportId, payload, user);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Technician report updated successfully",
		data: result,
	});
});

const deleteReport = catchAsync(async (req: Request, res: Response) => {
	const reportId = req.params.reportId as string;
	const user = req.user!;

	await ReportService.deleteReport(reportId, user);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Technician report deleted successfully",
		data: null,
	});
});

export const ReportController = {
	getAllReports,
	getMyReports,
	getSingleReport,
	submitReport,
	updateReport,
	deleteReport,
};
