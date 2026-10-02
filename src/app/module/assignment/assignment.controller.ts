import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { AssignmentService } from "./assignment.service";

const getAllAssignments = catchAsync(async (req: Request, res: Response) => {
	const user = req.user!;

	const { data, meta } = await AssignmentService.getAllAssignments(
		req.query,
		user,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Assignments retrieved successfully",
		data,
		meta,
	});
});

const getSingleAssignment = catchAsync(async (req: Request, res: Response) => {
	const assignmentId = req.params.assignmentId as string;
	const user = req.user!;

	const result = await AssignmentService.getSingleAssignment(
		assignmentId,
		user,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Assignment retrieved successfully",
		data: result,
	});
});

const getMyAssignments = catchAsync(async (req: Request, res: Response) => {
	const user = req.user!;

	const { data, meta } = await AssignmentService.getMyAssignments(
		req.query,
		user,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Assignments retrieved successfully",
		data,
		meta,
	});
});

const assignTechnician = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;
	const requestId = req.params.requestId as string;
	const user = req.user!;

	const result = await AssignmentService.assignTechnician(
		payload,
		requestId,
		user,
	);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: `Service request assigned to ${result.technician?.name} successfully`,
		data: result,
	});
});

const updateAssignment = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;
	const assignmentId = req.params.assignmentId as string;
	const user = req.user!;

	const result = await AssignmentService.updateAssignment(
		payload,
		assignmentId,
		user,
	);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Assignment updated successfully",
		data: result,
	});
});

const deleteAssignment = catchAsync(async (req: Request, res: Response) => {
	const assignmentId = req.params.assignmentId as string;
	const user = req.user!;

	await AssignmentService.deleteAssignment(assignmentId, user);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Assignment deleted successfully",
		data: null,
	});
});

const updateAssignmentStatusByTechnician = catchAsync(
	async (req: Request, res: Response) => {
		const assignmentId = req.params.requestId as string;
		const payload = req.body;
		const user = req.user!;

		const result = await AssignmentService.updateAssignmentStatusByTechnician(
			assignmentId,
			payload,
			user,
		);
		sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: "Service request status updated successfully",
			data: result,
		});
	},
);

export const AssignmentController = {
	getAllAssignments,
	getSingleAssignment,
	getMyAssignments,
	assignTechnician,
	updateAssignment,
	deleteAssignment,
	updateAssignmentStatusByTechnician,
};
