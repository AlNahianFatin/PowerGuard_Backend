import type { UploadApiResponse } from "cloudinary";
import httpStatus from "http-status";
import { cloudinary } from "../../lib/cloudinary";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import type { UserWhereInput } from "../../../generated/prisma/models";
import type { IQuery } from "../../interfaces";
import type { RequestUser } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";

const getAllUsers = async (query: IQuery, user: RequestUser) => {
	const requestedUser = await prisma.user.findUnique({
		where: {
			id: user.userId,
		},
	});

	if (!requestedUser || requestedUser.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "Your profile not found");
	}

	const limit = query.limit ? Number(query.limit) : 10;
	const page = query.page ? Number(query.page) : 1;
	const skip = (page - 1) * limit;
	const sortBy = query.sortBy ? query.sortBy : "createdAt";
	const sortOrder = query.sortOrder ? query.sortOrder : "desc";

	const andConditions: UserWhereInput[] = [];

	if (query.name) {
		andConditions.push({
			name: query.name,
		});
	}

	if (query.email) {
		andConditions.push({
			email: query.email,
		});
	}

	if (user.role !== Role.ADMIN) {
		if (query.role === Role.ADMIN) {
			throw new AppError(httpStatus.UNAUTHORIZED, "You cannot view admins!");
		}

		andConditions.push({
			role: {
				not: Role.ADMIN,
			},
		});

		if (query.role) {
			andConditions.push({
				role: query.role,
			});
		}
	}

	if (user.role === Role.ADMIN && query.role) {
		andConditions.push({
			role: query.role,
		});
	}

	if (query.status) {
		andConditions.push({
			status: query.status,
		});
	}

	if (query.authProvider) {
		andConditions.push({
			authProvider: query.authProvider,
		});
	}

	if (Boolean(query.emailVerified) === true) {
		andConditions.push({
			emailVerified: Boolean(query.emailVerified),
		});
	}

	if (query.searchTerm) {
		andConditions.push({
			OR: [
				{
					name: {
						contains: query.searchTerm,
						mode: "insensitive",
					},
				},
				{
					email: {
						contains: query.searchTerm,
						mode: "insensitive",
					},
				},
			],
		});
	}

	const users = await prisma.user.findMany({
		where: { AND: andConditions },
		take: limit,
		skip,
		orderBy: { [sortBy]: sortOrder },
	});

	const total = await prisma.user.count({
		where: { AND: andConditions },
	});

	return {
		data: users,
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
};

const getSingleUser = async (userId: string, user: RequestUser) => {
	const requestedUser = await prisma.user.findUnique({
		where: {
			id: user.userId,
		},
	});

	if (!requestedUser || requestedUser.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "Your profile not found");
	}

	const searchedUser = await prisma.user.findUnique({
		where: { id: userId },
		include: {
			operator: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},
			technician: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},
			customer: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},
		},
	});

	if (!searchedUser) {
		throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
	}

	if (requestedUser.role !== Role.ADMIN) {
		if (searchedUser.role === Role.ADMIN) {
			throw new AppError(
				httpStatus.UNAUTHORIZED,
				"You are not authorized to view this profile",
			);
		}

		if (requestedUser.role !== Role.OPERATOR && searchedUser.isDeleted) {
			throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
		}
	}

	return searchedUser;
};

const uploadProfileImage = async (buffer: Buffer, userId: string) => {
	const currentUser = await prisma.user.findUnique({
		where: {
			id: userId,
		},
		select: {
			isDeleted: true,
			imagePublicId: true,
			imageUrl: true,
		},
	});

	if (!currentUser || currentUser.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "User profile not found");
	}

	const cloudinaryResult = await new Promise<UploadApiResponse>(
		(resolve, reject) => {
			cloudinary.uploader
				.upload_stream(
					{
						resource_type: "auto",
					},

					async (error, result) => {
						if (error) {
							return reject(error);
						}

						if (!result) {
							return reject(new Error("No result returned from Cloudinary"));
						}

						resolve(result);
					},
				)
				.end(buffer);
		},
	);

	const updatedUser = await prisma.user.update({
		where: {
			id: userId,
		},

		data: {
			imageUrl: cloudinaryResult.secure_url,
			imagePublicId: cloudinaryResult.public_id,
		},

		omit: {
			password: true,
		},
	});

	if (currentUser?.imagePublicId && currentUser.imageUrl) {
		await cloudinary.uploader.destroy(currentUser.imagePublicId);
	}

	return updatedUser;
};

export const UserService = {
	getAllUsers,
	getSingleUser,
	uploadProfileImage,
};
