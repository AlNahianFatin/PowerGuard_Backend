import httpStatus from "http-status";
import type { AreaWhereInput } from "../../../generated/prisma/models";
import type { IQuery } from "../../interfaces";
import { prisma } from "../../lib/prisma";
import type { RequestUser } from "../../middleware/checkAuth";
import { AppError } from "../../utils/AppError";
import type { ICreateAreaPayload, IUpdateAreaPayload } from "./area.interface";

const getAllAreas = async (query: IQuery) => {
	const limit = query.limit ? Number(query.limit) : 10;
	const page = query.page ? Number(query.page) : 1;
	const skip = (page - 1) * limit;
	const sortBy = query.sortBy ? query.sortBy : "createdAt";
	const sortOrder = query.sortOrder ? query.sortOrder : "desc";

	const andConditions: AreaWhereInput[] = [
		{
			isDeleted: false,
		},
		{
			feeder: {
				isDeleted: false,
			},
		},
	];

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
					code: {
						contains: query.searchTerm,
						mode: "insensitive",
					},
				},
			],
		});
	}

	const areas = await prisma.area.findMany({
		where: {
			AND: andConditions,
		},

		take: limit,
		skip,
		orderBy: {
			[sortBy]: sortOrder,
		},
		include: {
			feeder: true,
			areas: {
				where: {
					isDeleted: false,
				},
			},
		},
	});

	const total = await prisma.area.count({
		where: { AND: andConditions },
	});

	return {
		data: areas,
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
};

const getAreaById = async (areaId: string) => {
	const area = await prisma.area.findUnique({
		where: { id: areaId },
		include: {
			feeder: true,
		},
	});

	if (!area || area.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "Area Not Found");
	}

	return area;
};

const createArea = async (payload: ICreateAreaPayload, user: RequestUser) => {
	const admin = await prisma.user.findUnique({
		where: { id: user.userId },
	});

	if (!admin) {
		throw new AppError(httpStatus.NOT_FOUND, "Admin Profile Not Found");
	}

	const name = payload.name.trim().toUpperCase();
	const code = payload.code.trim().toUpperCase();
	const description = payload.description ?? "";
	const feederId = payload.feederId.trim().toUpperCase();

	const existingAreaName = await prisma.area.findFirst({
		where: {
			name,
			isDeleted: false,
		},
	});

	if (existingAreaName) {
		throw new AppError(
			httpStatus.CONFLICT,
			`An area named ${existingAreaName.name} already exists!`,
		);
	}

	const existingAreaCode = await prisma.area.findFirst({
		where: {
			code,
			isDeleted: false,
		},
	});

	if (existingAreaCode) {
		throw new AppError(
			httpStatus.CONFLICT,
			`An area named ${existingAreaCode.name} already exists for ${existingAreaCode.code}!`,
		);
	}

	const area = await prisma.area.create({
		data: {
			name,
			code,
			description,
			feederId,
		},
		include: {
			feeder: {
				select: {
					name: true,
					code: true,
					description: true,
				},
			},
		},
	});

	return area;
};

const updateArea = async (
	areaId: string,
	payload: IUpdateAreaPayload,
	user: RequestUser,
) => {
	const admin = await prisma.user.findUnique({
		where: { id: user.userId },
	});

	if (!admin) {
		throw new AppError(httpStatus.NOT_FOUND, "Admin Profile Not Found");
	}

	const area = await prisma.area.findUnique({
		where: { id: areaId },
	});

	if (!area || area.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "Area Not Found");
	}

	if (payload.name) {
		const existingAreaName = await prisma.area.findFirst({
			where: {
				name: payload.name.toUpperCase(),
				id: {
					not: areaId,
				},
				isDeleted: false,
			},
		});

		if (existingAreaName) {
			throw new AppError(
				httpStatus.CONFLICT,
				`An area named ${existingAreaName.name} already exists!`,
			);
		}
	}

	if (payload.code) {
		const existingAreaCode = await prisma.area.findFirst({
			where: {
				code: payload.code,
				id: {
					not: areaId,
				},
				isDeleted: false,
			},
		});

		if (existingAreaCode) {
			throw new AppError(
				httpStatus.CONFLICT,
				`An area named ${existingAreaCode.name} with code ${existingAreaCode.code} already exists!`,
			);
		}
	}

	if (payload.feederId?.length) {
		const feeder = await prisma.feeder.findUnique({
			where: { id: payload.feederId },
		});

		if (!feeder || feeder.isDeleted) {
			throw new AppError(httpStatus.NOT_FOUND, "Feeder not found");
		}
	}

	const updatedArea = await prisma.$transaction(async (tx) => {
		const updatedArea = await tx.area.update({
			where: {
				id: area.id,
			},
			data: {
				...(payload.name && {
					name: payload.name.toUpperCase(),
				}),

				...(payload.code && {
					code: payload.code,
				}),

				...(payload.description !== undefined && {
					description: payload.description,
				}),

				...(payload.feederId && {
					feederId: payload.feederId,
				}),
			},

			include: {
				feeder: true,
			},
		});

		return updatedArea;
	});

	return updatedArea;
};

const deleteArea = async (areaId: string, user: RequestUser) => {
	const admin = await prisma.user.findUnique({
		where: { id: user.userId },
	});

	if (!admin) {
		throw new AppError(httpStatus.NOT_FOUND, "Admin Profile Not Found");
	}

	const area = await prisma.area.findUnique({
		where: { id: areaId },
	});

	if (!area || area.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "Area Not Found");
	}

	const deletedArea = await prisma.area.update({
		where: { id: area.id },
		data: {
			isDeleted: true,
			deletedBy: admin.id,
			deletedAt: new Date(),
		},
	});

	return deletedArea;
};

export const AreaService = {
	getAllAreas,
	getAreaById,
	createArea,
	updateArea,
	deleteArea,
};
