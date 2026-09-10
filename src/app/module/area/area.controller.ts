import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { AreaService } from "./area.service";

const getAllAreas = catchAsync(async (req: Request, res: Response) => {
	const { data, meta } = await AreaService.getAllAreas(req.query);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Areas Retrieved Successfully",
		data,
		meta,
	});
});

const getAreaById = catchAsync(async (req: Request, res: Response) => {
	const areaId = req.params.areaId as string;

	const result = await AreaService.getAreaById(areaId);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Area Retrieved Successfully",
		data: result,
	});
});

const createArea = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;
	const user = req.user!;

	const result = await AreaService.createArea(payload, user);
	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Area Created Successfully",
		data: result,
	});
});

const updateArea = catchAsync(async (req: Request, res: Response) => {
	const areaId = req.params.areaId as string;
	const payload = req.body;
	const user = req.user!;

	const result = await AreaService.updateArea(areaId, payload, user);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Area Updated Successfully",
		data: result,
	});
});

const deleteArea = catchAsync(async (req: Request, res: Response) => {
	const areaId = req.params.areaId as string;
	const user = req.user!;

	await AreaService.deleteArea(areaId, user);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Area Deleted Successfully",
		data: null,
	});
});

export const AreaController = {
	getAllAreas,
	getAreaById,
	createArea,
	updateArea,
	deleteArea,
};
