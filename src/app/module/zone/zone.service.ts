import httpStatus from "http-status";
import type { DistributionZoneWhereInput } from "../../../generated/prisma/models";
import type { IQuery } from "../../interfaces";
import { prisma } from "../../lib/prisma";
import type { RequestUser } from "../../middleware/checkAuth";
import { AppError } from "../../utils/AppError";
import type { ICreateZonePayload, IUpdateZonePayload } from "./zone.interface";

const getAllZones = async (query: IQuery) => {
	const limit = query.limit ? Number(query.limit) : 10;
	const page = query.page ? Number(query.page) : 1;
	const skip = (page - 1) * limit;
	const sortBy = query.sortBy ? query.sortBy : "createdAt";
	const sortOrder = query.sortOrder ? query.sortOrder : "desc";

	const andConditions: DistributionZoneWhereInput[] = [
		{
			isDeleted: false,
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

	const zones = await prisma.distributionZone.findMany({
		where: {
			AND: andConditions,
		},

		take: limit,
		skip,
		orderBy: {
			[sortBy]: sortOrder,
		},
		include: {
			substations: {
				where: {
					isDeleted: false,
				},
				include: {
					feeders: {
						where: {
							isDeleted: false,
						},
						include: {
							areas: {
								where: {
									isDeleted: false,
								},
							},
						},
					},
				},
			},
		},
	});

	const total = await prisma.distributionZone.count({
		where: { AND: andConditions },
	});

	return {
		data: zones,
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
};

const getZoneById = async (zoneId: string) => {
	const zone = await prisma.distributionZone.findUnique({
		where: { id: zoneId },
		include: {
			substations: {
				where: {
					isDeleted: false,
				},
				include: {
					feeders: {
						where: {
							isDeleted: false,
						},
						include: {
							areas: {
								where: {
									isDeleted: false,
								},
							},
						},
					},
				},
			},
		},
	});

	if (!zone || zone.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "Zone Not Found");
	}

	return zone;
};

const createZone = async (payload: ICreateZonePayload, user: RequestUser) => {
	const admin = await prisma.user.findUnique({
		where: { id: user.userId },
	});

	if (!admin) {
		throw new AppError(httpStatus.NOT_FOUND, "Admin Profile Not Found");
	}

	const name = payload.name.trim().toUpperCase();
	const code = payload.code.trim().toUpperCase();
	const description = payload.description ?? "";

	const existingZoneName = await prisma.distributionZone.findFirst({
		where: {
			name,
			isDeleted: false,
		},
	});

	if (existingZoneName) {
		throw new AppError(
			httpStatus.CONFLICT,
			`A distribution zone named ${existingZoneName.name} already exists!`,
		);
	}

	const existingZoneCode = await prisma.distributionZone.findFirst({
		where: {
			code,
			isDeleted: false,
		},
	});

	if (existingZoneCode) {
		throw new AppError(
			httpStatus.CONFLICT,
			`A distribution zone named ${existingZoneCode.name} already exists for ${existingZoneCode.code}!`,
		);
	}

	const zone = await prisma.distributionZone.create({
		data: {
			name,
			code,
			description,
		},
		include: {
			substations: {
				select: {
					name: true,
					code: true,
					description: true,
				},
			},
		},
	});

	return zone;
};

const updateZone = async (
	zoneId: string,
	payload: IUpdateZonePayload,
	user: RequestUser,
) => {
	const admin = await prisma.user.findUnique({
		where: { id: user.userId },
	});

	if (!admin) {
		throw new AppError(httpStatus.NOT_FOUND, "Admin Profile Not Found");
	}

	const zone = await prisma.distributionZone.findUnique({
		where: { id: zoneId },
	});

	if (!zone || zone.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "Zone Not Found");
	}

	if (payload.name) {
		const existingZoneName = await prisma.distributionZone.findFirst({
			where: {
				name: payload.name.toUpperCase(),
				id: {
					not: zoneId,
				},
				isDeleted: false,
			},
		});

		if (existingZoneName) {
			throw new AppError(
				httpStatus.CONFLICT,
				`A distribution zone named ${existingZoneName.name} already exists!`,
			);
		}
	}

	if (payload.code) {
		const existingZoneCode = await prisma.distributionZone.findFirst({
			where: {
				code: payload.code,
				id: {
					not: zoneId,
				},
				isDeleted: false,
			},
		});

		if (existingZoneCode) {
			throw new AppError(
				httpStatus.CONFLICT,
				`A distribution zone named ${existingZoneCode.name} with code ${existingZoneCode.code} already exists!`,
			);
		}
	}

	if (payload.substationIds?.length) {
		const substations = await prisma.substation.findMany({
			where: {
				id: {
					in: payload.substationIds,
				},
				isDeleted: false,
			},
			select: {
				id: true,
			},
		});

		if (substations.length !== payload.substationIds.length) {
			throw new AppError(
				httpStatus.NOT_FOUND,
				"One or more substation IDs are invalid",
			);
		}
	}

	const updatedZone = await prisma.$transaction(async (tx) => {
		const updatedZone = await tx.distributionZone.update({
			where: {
				id: zone.id,
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
			},
			include: {
				substations: {
					where: { isDeleted: false },
					select: {
						name: true,
						code: true,
						feeders: {
							where: { isDeleted: false },
							select: {
								name: true,
								code: true,
								areas: {
									where: { isDeleted: true },
									select: {
										name: true,
										code: true,
									},
								},
							},
						},
					},
				},
			},
		});

		await tx.substation.updateMany({
			where: {
				id: {
					in: payload.substationIds,
				},
			},
			data: {
				zoneId,
			},
		});

		return updatedZone;
	});

	return updatedZone;
};

const deleteZone = async (zoneId: string, user: RequestUser) => {
	const admin = await prisma.user.findUnique({
		where: { id: user.userId },
	});

	if (!admin) {
		throw new AppError(httpStatus.NOT_FOUND, "Admin Profile Not Found");
	}

	const zone = await prisma.distributionZone.findUnique({
		where: { id: zoneId },
	});

	if (!zone || zone.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "Zone Not Found");
	}

	const deletedZone = await prisma.distributionZone.update({
		where: { id: zone.id },
		data: {
			isDeleted: true,
			deletedBy: admin.id,
			deletedAt: new Date(),
		},
	});

	return deletedZone;
};

export const ZoneService = {
	getAllZones,
	getZoneById,
	createZone,
	updateZone,
	deleteZone,
};
