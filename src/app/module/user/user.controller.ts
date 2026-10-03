import type { Request, Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../../utils/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { UserService } from "./user.service";

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
	const user = req.user!;

	const { data, meta } = await UserService.getAllUsers(req.query, user);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Users Retrieved Successfully",
		data,
		meta,
	});
});

const getSingleUser = catchAsync(async (req: Request, res: Response) => {
	const userId = req.params.userId as string;
	const user = req.user!;

	const result = await UserService.getSingleUser(userId, user);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "User Retrieved Successfully",
		data: result,
	});
});

const uploadProfileImage = catchAsync(async (req: Request, res: Response) => {
	if (!req.file) {
		throw new AppError(httpStatus.BAD_REQUEST, "No File Provided.");
	}

	const userId = req.user?.userId;

	const result = await UserService.uploadProfileImage(
		req.file?.buffer,
		userId!,
	);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Profile image updated successfully",
		data: result,
	});
});

export const UserController = {
	getAllUsers,
	getSingleUser,
	uploadProfileImage,
};
