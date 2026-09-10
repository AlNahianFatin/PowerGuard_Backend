import httpStatus from "http-status";
import type { SubstationWhereInput } from "../../../generated/prisma/models";
import type { IQuery } from "../../interfaces";
import { prisma } from "../../lib/prisma";
import type { RequestUser } from "../../middleware/checkAuth";
import { AppError } from "../../utils/AppError";
import type {
	ICreateSubstationPayload,
	IUpdateSubstationPayload,
} from "./substation.interface";

const getAllSubstations = async (query: IQuery) => {
	const limit = query.limit ? Number(query.limit) : 10;
	const page = query.page ? Number(query.page) : 1;
	const skip = (page - 1) * limit;
	const sortBy = query.sortBy ? query.sortBy : "createdAt";
	const sortOrder = query.sortOrder ? query.sortOrder : "desc";

	const andConditions: SubstationWhereInput[] = [
		{
			isDeleted: false,
		},
		{
			zone: {
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

	const substations = await prisma.substation.findMany({
		where: {
			AND: andConditions,
		},

		take: limit,
		skip,
		orderBy: {
			[sortBy]: sortOrder,
		},
		include: {
			zone: true,
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
	});

	const total = await prisma.substation.count({
		where: { AND: andConditions },
	});

	return {
		data: substations,
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
};

const getSubstationById = async (substationId: string) => {
	const substation = await prisma.substation.findUnique({
		where: { id: substationId },
		include: {
			zone: true,
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
	});

	if (!substation || substation.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "Substation Not Found");
	}

	return substation;
};

const createSubstation = async (
	payload: ICreateSubstationPayload,
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
	const zoneId = payload.zoneId.trim();

	const existingSubstationName = await prisma.substation.findFirst({
		where: {
			name,
			isDeleted: false,
		},
	});

	if (existingSubstationName) {
		throw new AppError(
			httpStatus.CONFLICT,
			`A substation named ${existingSubstationName.name} already exists!`,
		);
	}

	const existingSubstationCode = await prisma.substation.findFirst({
		where: {
			code,
			isDeleted: false,
		},
	});

	if (existingSubstationCode) {
		throw new AppError(
			httpStatus.CONFLICT,
			`A substation named ${existingSubstationCode.name} already exists for ${existingSubstationCode.code}!`,
		);
	}

	const substation = await prisma.substation.create({
		data: {
			name,
			code,
			description,
			zoneId,
		},
		include: {
			zone: {
				select: {
					name: true,
					code: true,
					description: true,
				},
			},
			feeders: {
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

	return substation;
};

const updateSubstation = async (
	substationId: string,
	payload: IUpdateSubstationPayload,
	user: RequestUser,
) => {
	const admin = await prisma.user.findUnique({
		where: { id: user.userId },
	});

	if (!admin) {
		throw new AppError(httpStatus.NOT_FOUND, "Admin Profile Not Found");
	}

	const substation = await prisma.substation.findUnique({
		where: { id: substationId },
	});

	if (!substation || substation.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "Substation Not Found");
	}

	if (payload.name) {
		const existingSubstationName = await prisma.substation.findFirst({
			where: {
				name: payload.name.toUpperCase(),
				id: {
					not: substationId,
				},
				isDeleted: false,
			},
		});

		if (existingSubstationName) {
			throw new AppError(
				httpStatus.CONFLICT,
				`A substation named ${existingSubstationName.name} already exists!`,
			);
		}
	}

	if (payload.code) {
		const existingSubstationCode = await prisma.substation.findFirst({
			where: {
				code: payload.code,
				id: {
					not: substationId,
				},
				isDeleted: false,
			},
		});

		if (existingSubstationCode) {
			throw new AppError(
				httpStatus.CONFLICT,
				`A substation named ${existingSubstationCode.name} with code ${existingSubstationCode.code} already exists!`,
			);
		}
	}

	if (payload.zoneId?.length) {
		const zone = await prisma.distributionZone.findUnique({
			where: { id: payload.zoneId },
		});

		if (!zone || zone.isDeleted) {
			throw new AppError(httpStatus.NOT_FOUND, "Distribution zone not found");
		}
	}

	if (payload.feederIds?.length) {
		const feeders = await prisma.feeder.findMany({
			where: {
				id: {
					in: payload.feederIds,
				},
				isDeleted: false,
			},
			select: {
				id: true,
			},
		});

		if (feeders.length !== payload.feederIds.length) {
			throw new AppError(
				httpStatus.NOT_FOUND,
				"One or more feeder IDs are invalid",
			);
		}
	}

	const updatedSubstation = await prisma.$transaction(async (tx) => {
		const updatedSubstation = await tx.substation.update({
			where: {
				id: substation.id,
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

				...(payload.zoneId && {
					zoneId: payload.zoneId,
				}),
			},
			include: {
				zone: true,
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
		});

		await tx.feeder.updateMany({
			where: {
				id: {
					in: payload.feederIds,
				},
			},
			data: {
				substationId,
			},
		});

		return updatedSubstation;
	});

	return updatedSubstation;
};

const deleteSubstation = async (substationId: string, user: RequestUser) => {
	const admin = await prisma.user.findUnique({
		where: { id: user.userId },
	});

	if (!admin) {
		throw new AppError(httpStatus.NOT_FOUND, "Admin Profile Not Found");
	}

	const substation = await prisma.substation.findUnique({
		where: { id: substationId },
	});

	if (!substation || substation.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "Substation Not Found");
	}

	await prisma.substation.update({
		where: { id: substation.id },
		data: {
			isDeleted: true,
			deletedBy: admin.id,
			deletedAt: new Date(),
		},
	});

	return;
};

export const SubstationService = {
	getAllSubstations,
	getSubstationById,
	createSubstation,
	updateSubstation,
	deleteSubstation,
};
