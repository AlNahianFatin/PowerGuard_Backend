import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { RequestService } from "./request.service";

const getAllRequests = catchAsync(async (req: Request, res: Response) => {
	const user = req.user!;

	const { data, meta } = await RequestService.getAllRequests(req.query, user);
	
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Service requests retrieved successfully",
		data,
		meta,
	});
});

const getSingleRequest = catchAsync(async (req: Request, res: Response) => {
	const requestId = req.params.requestId as string;

	const result = await RequestService.getSingleRequest(requestId);
	
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Service request retrieved successfully",
		data: result,
	});
});

const getMyRequests = catchAsync(async (req: Request, res: Response) => {
	const user = req.user!;

	const { data, meta } = await RequestService.getMyRequests(req.query, user);
	
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Service requests retrieved successfully",
		data,
		meta,
	});
});

const submitRequest = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;
	const user = req.user!;

	const result = await RequestService.submitRequest(payload, user);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Service request submitted successfully",
		data: result,
	});
});

const updateRequest = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;
	const requestId = req.params.requestId as string;
	const user = req.user!;

	const result = await RequestService.updateRequest(payload, requestId, user);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Service request updated successfully",
		data: result,
	});
});

const cancelRequest = catchAsync(async (req: Request, res: Response) => {
	const requestId = req.params.requestId as string;
	const user = req.user!;

	const result = await RequestService.cancelRequest(requestId, user);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Service request cancelled successfully",
		data: result,
	});
});

const rejectRequest = catchAsync(async (req: Request, res: Response) => {
	const requestId = req.params.requestId as string;
	const payload = req.body;
	const user = req.user!;

	const result = await RequestService.rejectRequest(requestId, payload, user);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Service request rejected successfully",
		data: result,
	});
});

export const RequestController = {
	getAllRequests,
	getSingleRequest,
	getMyRequests,
	submitRequest,
	updateRequest,
	cancelRequest,
	rejectRequest,
};
