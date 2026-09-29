import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { FeederService } from "./feeder.service";

const getAllFeeders = catchAsync(async (req: Request, res: Response) => {
	const { data, meta } = await FeederService.getAllFeeders(req.query);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Feeders Retrieved Successfully",
		data,
		meta,
	});
});

const getFeederById = catchAsync(async (req: Request, res: Response) => {
	const feederId = req.params.feederId as string;

	const result = await FeederService.getFeederById(feederId);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Feeder Retrieved Successfully",
		data: result,
	});
});

const createFeeder = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;
	const user = req.user!;

	const result = await FeederService.createFeeder(payload, user);
	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Feeder Created Successfully",
		data: result,
	});
});

const updateFeeder = catchAsync(async (req: Request, res: Response) => {
	const feederId = req.params.feederId as string;
	const payload = req.body;
	const user = req.user!;

	const result = await FeederService.updateFeeder(feederId, payload, user);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Feeder Updated Successfully",
		data: result,
	});
});

const deleteFeeder = catchAsync(async (req: Request, res: Response) => {
	const feederId = req.params.feederId as string;
	const user = req.user!;

	await FeederService.deleteFeeder(feederId, user);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Feeder Deleted Successfully",
		data: null,
	});
});

export const FeederController = {
	getAllFeeders,
	getFeederById,
	createFeeder,
	updateFeeder,
	deleteFeeder,
};
