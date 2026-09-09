import httpStatus from "http-status";
import { FeederWhereInput } from "../../../generated/prisma/models";
import { IQuery } from "../../interfaces";
import { prisma } from "../../lib/prisma";
import { RequestUser } from "../../middleware/checkAuth";
import { AppError } from "../../utils/AppError";
import { ICreateFeederPayload, IUpdateFeederPayload } from "./feeder.interface";

const getAllFeeders = async (query: IQuery) => {
	const limit = query.limit ? Number(query.limit) : 10;
	const page = query.page ? Number(query.page) : 1;
	const skip = (page - 1) * limit;
	const sortBy = query.sortBy ? query.sortBy : "createdAt";
	const sortOrder = query.sortOrder ? query.sortOrder : "desc";

	const andConditions: FeederWhereInput[] = [
		{
			isDeleted: false,
		},
		{
			substation: {
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

	const feeders = await prisma.feeder.findMany({
		where: {
			AND: andConditions,
		},

		take: limit,
		skip,
		orderBy: {
			[sortBy]: sortOrder,
		},
		include: {
			substation: true,
			areas: {
				where: {
					isDeleted: false,
				},
			},
		},
	});

	const total = await prisma.feeder.count({
		where: { AND: andConditions },
	});

	return {
		data: feeders,
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
};

const getFeederById = async (feederId: string) => {
	const feeder = await prisma.feeder.findUnique({
		where: { id: feederId },
		include: {
			substation: true,
			areas: {
				where: {
					isDeleted: false,
				},
			},
		},
	});

	if (!feeder || feeder.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "Feeder Not Found");
	}

	return feeder;
};

const createFeeder = async (
	payload: ICreateFeederPayload,
	user: RequestUser,
) => {
	const admin = await prisma.user.findUnique({
		where: { id: user.userId },
	});

	if (!admin) {
		throw new AppError(httpStatus.NOT_FOUND, "Admin Profile Not Found");
	}

	const name = payload.name.trim().toUpperCase();
	const code = payload.code.trim().toUpperCase();
	const description = payload.description ?? "";
	const repairingCost = Number(payload.repairingCost);
	const substationId = payload.substationId.trim().toUpperCase();

	const existingFeederName = await prisma.feeder.findFirst({
		where: {
			name,
			isDeleted: false,
		},
	});

	if (existingFeederName) {
		throw new AppError(
			httpStatus.CONFLICT,
			`A feeder named ${existingFeederName.name} already exists!`,
		);
	}

	const existingFeederCode = await prisma.feeder.findFirst({
		where: {
			code,
			isDeleted: false,
		},
	});

	if (existingFeederCode) {
		throw new AppError(
			httpStatus.CONFLICT,
			`A feeder named ${existingFeederCode.name} already exists for ${existingFeederCode.code}!`,
		);
	}

	const feeder = await prisma.feeder.create({
		data: {
			name,
			code,
			description,
			repairingCost,
			substationId,
		},
		include: {
			substation: {
				select: {
					name: true,
					code: true,
					description: true,
				},
			},
			areas: {
				where: {
					isDeleted: false,
				},
				select: {
					name: true,
					code: true,
					description: true,
				},
			},
		},
	});

	return feeder;
};

const updateFeeder = async (
	feederId: string,
	payload: IUpdateFeederPayload,
	user: RequestUser,
) => {
	const admin = await prisma.user.findUnique({
		where: { id: user.userId },
	});

	if (!admin) {
		throw new AppError(httpStatus.NOT_FOUND, "Admin Profile Not Found");
	}

	const feeder = await prisma.feeder.findUnique({
		where: { id: feederId },
	});

	if (!feeder || feeder.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "Feeder Not Found");
	}

	if (payload.name) {
		const existingFeederName = await prisma.feeder.findFirst({
			where: {
				name: payload.name.toUpperCase(),
				id: {
					not: feederId,
				},
				isDeleted: false,
			},
		});

		if (existingFeederName) {
			throw new AppError(
				httpStatus.CONFLICT,
				`A feeder named ${existingFeederName.name} already exists!`,
			);
		}
	}

	if (payload.code) {
		const existingFeederCode = await prisma.feeder.findFirst({
			where: {
				code: payload.code,
				id: {
					not: feederId,
				},
				isDeleted: false,
			},
		});

		if (existingFeederCode) {
			throw new AppError(
				httpStatus.CONFLICT,
				`A feeder named ${existingFeederCode.name} with code ${existingFeederCode.code} already exists!`,
			);
		}
	}

	if (payload.substationId?.length) {
		const substation = await prisma.substation.findUnique({
			where: { id: payload.substationId },
		});

		if (!substation || substation.isDeleted) {
			throw new AppError(httpStatus.NOT_FOUND, "Substation not found");
		}
	}

	if (payload.areaIds?.length) {
		const areas = await prisma.area.findMany({
			where: {
				id: {
					in: payload.areaIds,
				},
				isDeleted: false,
			},
			select: {
				id: true,
			},
		});

		if (areas.length !== payload.areaIds.length) {
			throw new AppError(
				httpStatus.NOT_FOUND,
				"One or more area IDs are invalid",
			);
		}
	}

	const updatedFeeder = await prisma.$transaction(async (tx) => {
		const updatedFeeder = await tx.feeder.update({
			where: {
				id: feeder.id,
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

				...(payload.repairingCost && {
					repairingCost: payload.repairingCost,
				}),

				...(payload.substationId && {
					substationId: payload.substationId,
				}),
			},

			include: {
				substation: true,
				areas: {
					where: { isDeleted: false },
					select: {
						name: true,
						code: true,
					},
				},
			},
		});

		await tx.area.updateMany({
			where: {
				id: {
					in: payload.areaIds,
				},
			},
			data: {
				feederId,
			},
		});

		return updatedFeeder;
	});

	return updatedFeeder;
};

const deleteFeeder = async (feederId: string, user: RequestUser) => {
	const admin = await prisma.user.findUnique({
		where: { id: user.userId },
	});

	if (!admin) {
		throw new AppError(httpStatus.NOT_FOUND, "Admin Profile Not Found");
	}

	const feeder = await prisma.feeder.findUnique({
		where: { id: feederId },
	});

	if (!feeder || feeder.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "Feeder Not Found");
	}

	const deletedFeeder = await prisma.feeder.update({
		where: { id: feeder.id },
		data: {
			isDeleted: true,
			deletedBy: admin.id,
			deletedAt: new Date(),
		},
	});

	return deletedFeeder;
};

export const FeederService = {
	getAllFeeders,
	getFeederById,
	createFeeder,
	updateFeeder,
	deleteFeeder,
};
