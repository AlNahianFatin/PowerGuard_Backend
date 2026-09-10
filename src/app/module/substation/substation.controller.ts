import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { SubstationService } from "./substation.service";

const getAllSubstations = catchAsync(async (req: Request, res: Response) => {
	const { data, meta } = await SubstationService.getAllSubstations(req.query);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Substations Retrieved Successfully",
		data,
		meta,
	});
});

const getSubstationById = catchAsync(async (req: Request, res: Response) => {
	const substationId = req.params.substationId as string;

	const result = await SubstationService.getSubstationById(substationId);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Substation Retrieved Successfully",
		data: result,
	});
});

const createSubstation = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;
	const user = req.user!;

	const result = await SubstationService.createSubstation(payload, user);
	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Substation Created Successfully",
		data: result,
	});
});

const updateSubstation = catchAsync(async (req: Request, res: Response) => {
	const substationId = req.params.substationId as string;
	const payload = req.body;
	const user = req.user!;

	const result = await SubstationService.updateSubstation(
		substationId,
		payload,
		user,
	);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Substation Updated Successfully",
		data: result,
	});
});

const deleteSubstation = catchAsync(async (req: Request, res: Response) => {
	const substationId = req.params.substationId as string;
	const user = req.user!;

	await SubstationService.deleteSubstation(substationId, user);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Substation Deleted Successfully",
		data: null,
	});
});

export const SubstationController = {
	getAllSubstations,
	getSubstationById,
	createSubstation,
	updateSubstation,
	deleteSubstation,
};
