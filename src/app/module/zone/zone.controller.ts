import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { ZoneService } from "./zone.service";

const getAllZones = catchAsync(async (req: Request, res: Response) => {
	const { data, meta } = await ZoneService.getAllZones(req.query);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Zones Retrieved Successfully",
		data,
		meta,
	});
});

const getZoneById = catchAsync(async (req: Request, res: Response) => {
	const zoneId = req.params.zoneId as string;

	const result = await ZoneService.getZoneById(zoneId);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Zone Retrieved Successfully",
		data: result,
	});
});

const createZone = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;
	const user = req.user!;

	const result = await ZoneService.createZone(payload, user);
	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Zone Created Successfully",
		data: result,
	});
});

const updateZone = catchAsync(async (req: Request, res: Response) => {
	const zoneId = req.params.zoneId as string;
	const payload = req.body;
	const user = req.user!;

	const result = await ZoneService.updateZone(zoneId, payload, user);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Zone Updated Successfully",
		data: result,
	});
});

const deleteZone = catchAsync(async (req: Request, res: Response) => {
	const zoneId = req.params.zoneId as string;
	const user = req.user!;

	const result = await ZoneService.deleteZone(zoneId, user);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Zone Deleted Successfully",
		data: result,
	});
});

export const ZoneController = {
	getAllZones,
	getZoneById,
	createZone,
	updateZone,
	deleteZone,
};
