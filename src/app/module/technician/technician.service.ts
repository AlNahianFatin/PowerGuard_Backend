import bcrypt from "bcryptjs";
import type { UploadApiResponse } from "cloudinary";
import crypto from "crypto";
import { addDays, startOfDay } from "date-fns";
import ejs from "ejs";
import httpStatus from "http-status";
import path from "path";
import {
	TechnicianVerificationStatus,
	Role,
	ScheduleStatus,
	TechnicianStatus,
} from "../../../generated/prisma/enums";
import { TechnicianWhereInput } from "../../../generated/prisma/models";
import config from "../../config";
import { IQuery } from "../../interfaces";
import { cloudinary } from "../../lib/cloudinary";
import { transporter } from "../../lib/nodemailer";
import { prisma } from "../../lib/prisma";
import { redisClient } from "../../lib/redis";
import { RequestUser } from "../../middleware/checkAuth";
import { AppError } from "../../utils/AppError";
import {
	IApplyAsTechnicianPayload,
	IApproveTechnicianPayload,
	IUpdateTechnicianProfilePayload,
	IVerifyTechnicianEmailPayload,
} from "./technician.interface";

const applyAsTechnician = async (
	payload: IApplyAsTechnicianPayload,
	resume: Express.Multer.File | null,
	additionalFiles: Express.Multer.File[],
) => {
	const isUserExists = await prisma.user.findUnique({
		where: {
			email: payload.user.email,
		},
	});

	if (isUserExists) {
		throw new AppError(
			httpStatus.CONFLICT,
			"User Already Exists With This Email",
		);
	}

	const resumeUploadResult = await new Promise<UploadApiResponse>(
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
							return reject(
								new AppError(
									httpStatus.INTERNAL_SERVER_ERROR,
									"No result returned from Cloudinary",
								),
							);
						}

						resolve(result);
					},
				)
				.end(resume?.buffer);
		},
	);

	console.log({ resumeUploadResult });

	const additionalFilesUploadResults = await Promise.all(
		additionalFiles.map((file) => {
			return new Promise<UploadApiResponse>((resolve, reject) => {
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
					.end(file.buffer);
			});
		}),
	);

	console.log({ additionalFilesUploadResults });

	const randomTechnicianPassword = Math.random().toString(36).slice(-8);

	const hashedPassword = await bcrypt.hash(
		randomTechnicianPassword,
		Number(config.bcrypt_salt_rounds),
	);

	const technicianApplication = await prisma.user.create({
		data: {
			...payload.user,
			password: hashedPassword,
			role: Role.TECHNICIAN,
			needPasswordChange: true,
			technician: {
				create: {
					name: payload.user.name,
					email: payload.user.email,
					...payload.technician,
					resume: resumeUploadResult.secure_url,
					resumePublicId: resumeUploadResult.public_id,
					additionalFiles: additionalFilesUploadResults.map((file) => ({
						url: file.secure_url,
						publicId: file.public_id,
					})),
				},
			},
		},

		include: {
			technician: true,
		},
	});

	const expirationSeconds = 60 * 60;

	const otpKey = `technician-application-otp:${payload.user.email}`;
	const otpValue = crypto.randomInt(100000, 1000000).toString();

	await redisClient.set(otpKey, otpValue, {
		expiration: {
			type: "EX",
			value: expirationSeconds,
		},
	});

	const templatePath = path.join(
		process.cwd(),
		"src/app/templates/registration-user-otp.ejs",
	);

	const templateData = {
		name: payload.user.name,
		email: payload.user.email,
		otp: otpValue,
		expirationMinutes: expirationSeconds / 60,
	};

	const html = await ejs.renderFile(templatePath, templateData);

	await transporter.sendMail({
		from: config.email_sender,
		to: payload.user.email,
		subject: "Technician Application - Email Verification",
		html,
	});

	return technicianApplication;
};

const verifyTechnicianEmail = async (
	payload: IVerifyTechnicianEmailPayload,
) => {
	const otp = payload.otp;
	const email = payload.email.trim().toLowerCase();

	const existingUser = await prisma.user.findUnique({
		where: { email, role: Role.TECHNICIAN },
	});

	if (!existingUser) {
		throw new AppError(
			httpStatus.NOT_FOUND,
			"Technician Application Not Found. Please Apply Again.",
		);
	}

	if (existingUser.emailVerified) {
		throw new AppError(httpStatus.CONFLICT, "Email Already Verified");
	}

	const otpKey = `technician-application-otp:${email}`;

	const redisOtp = await redisClient.get(otpKey);

	if (!redisOtp) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"OTP Expired. Your Application Window Has Closed. Please Apply Again.",
		);
	}

	if (redisOtp !== otp) {
		throw new AppError(httpStatus.BAD_REQUEST, "OTP Does Not Match");
	}

	await redisClient.del(otpKey);

	const verifiedUser = await prisma.user.update({
		where: { id: existingUser.id },
		data: { emailVerified: true },
		omit: { password: true },
		include: { technician: true },
	});

	return verifiedUser;
};

const approveTechnician = async (
	payload: IApproveTechnicianPayload,
	reviewer: RequestUser,
) => {
	const { technicianId, verificationStatus, rejectionReason } = payload;

	const existingTechnician = await prisma.technician.findUnique({
		where: { id: technicianId },
		include: { user: true },
	});

	if (!existingTechnician) {
		throw new AppError(
			httpStatus.NOT_FOUND,
			"Technician Application Not Found",
		);
	}

	if (existingTechnician.isDeleted) {
		throw new AppError(
			httpStatus.GONE,
			"Technician Application Has Been Deleted",
		);
	}

	if (!existingTechnician.user.emailVerified) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Technician Has Not Verified Their Email Yet. Application Cannot Be Reviewed.",
		);
	}

	if (
		existingTechnician.verificationStatus !==
		TechnicianVerificationStatus.PENDING
	) {
		throw new AppError(
			httpStatus.CONFLICT,
			`Technician Application Has Already Been ${existingTechnician.verificationStatus.toLowerCase()}`,
		);
	}

	if (
		verificationStatus === TechnicianVerificationStatus.REJECTED &&
		!rejectionReason
	) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Rejection Reason Is Required When Rejecting A Doctor Application",
		);
	}

	const updatedTechnician = await prisma.technician.update({
		where: { id: technicianId },
		data: {
			verificationStatus,
			rejectionReason:
				verificationStatus === TechnicianVerificationStatus.REJECTED
					? rejectionReason
					: null,
			reviewedBy: reviewer.userId,
			reviewedAt: new Date(),
		},
	});

	const isApproved =
		verificationStatus === TechnicianVerificationStatus.APPROVED;

	const templatePath = path.join(
		process.cwd(),
		`src/app/templates/${
			isApproved
				? "technician-application-approved.ejs"
				: "technician-application-rejected.ejs"
		}`,
	);

	const templateData = {
		name: updatedTechnician.name,
		reason: updatedTechnician.rejectionReason,
	};

	const html = await ejs.renderFile(templatePath, templateData);

	await transporter.sendMail({
		from: config.email_sender,
		to: updatedTechnician.email,
		subject: isApproved
			? "Your Technician Application Has Been Approved"
			: "Your Technician Application Has Been Rejected",
		html,
	});

	return updatedTechnician;
};

const getAllTechnicians = async (query: IQuery) => {
	const limit = query.limit ? Number(query.limit) : 10;
	const page = query.page ? Number(query.page) : 1;
	const skip = (page - 1) * limit;
	const sortBy = query.sortBy ? query.sortBy : "createdAt";
	const sortOrder = query.sortOrder ? query.sortOrder : "desc";

	const andConditions: TechnicianWhereInput[] = [];

	//Searching
	if (query.searchTerm) {
		andConditions.push({
			OR: [
				{ name: { contains: query.searchTerm, mode: "insensitive" } },
				{ email: { contains: query.searchTerm, mode: "insensitive" } },
			],
		});
	}

	//filtering
	if (query.email) {
		andConditions.push({
			email: { contains: query.email, mode: "insensitive" },
		});
	}

	if (query.verificationStatus) {
		andConditions.push({
			verificationStatus:
				query.verificationStatus as TechnicianVerificationStatus,
		});
	}

	andConditions.push({ isDeleted: false });

	const allTechnicians = await prisma.technician.findMany({
		where: {
			AND: andConditions.length > 0 ? andConditions : undefined,
		},

		take: limit,
		skip: skip,

		orderBy: {
			// sortBy : sortOrder
			[sortBy]: sortOrder,
		},

		include: {
			user: {
				omit: {
					password: true,
				},
			},
		},
	});

	const totalTechnicianCount = await prisma.technician.count({
		where: {
			AND: andConditions,
		},
	});

	return {
		data: allTechnicians,
		meta: {
			page: page,
			limit: limit,
			total: totalTechnicianCount,
			totalPages: Math.ceil(totalTechnicianCount / limit),
		},
	};
};

const updateTechnicianProfile = async (
	payload: IUpdateTechnicianProfilePayload,
	user: RequestUser,
) => {
	const existingTechnician = await prisma.technician.findUnique({
		where: { userId: user.userId },
	});

	if (!existingTechnician) {
		throw new AppError(httpStatus.NOT_FOUND, "Technician Profile Not Found");
	}

	const updatedTechnician = await prisma.technician.update({
		where: { id: existingTechnician.id },
		data: payload,
	});

	return updatedTechnician;
};

// Fields safe to expose on the public (unauthenticated) doctor-discovery endpoints.
// Deliberately excludes resume/additionalFiles, verification review metadata, and
// anything relation/auth related (user, userId, isDeleted, deletedAt...).

const getAvailableTechnicianByTodaysSchedule = async (query: IQuery) => {
	const limit = query.limit ? Number(query.limit) : 10;
	const page = query.page ? Number(query.page) : 1;
	const skip = (page - 1) * limit;
	const sortBy = query.sortBy ? query.sortBy : "createdAt";
	const sortOrder = query.sortOrder ? query.sortOrder : "desc";

	// const now = new Date();
	// const startOfToday = startOfDay(now);
	// const startOfTomorrow = addDays(startOfToday, 1);

	// A doctor is "available today" if they have at least one published,
	// not-yet-started schedule today with open slots left.

	const andConditions: TechnicianWhereInput[] = [
		{ status: TechnicianStatus.AVAILABLE },
		{ isDeleted: false },
		{ verificationStatus: TechnicianVerificationStatus.APPROVED },
	];

	if (query.searchTerm) {
		andConditions.push({
			OR: [{ name: { contains: query.searchTerm, mode: "insensitive" } }],
		});
	}

	const availableTechnicians = await prisma.technician.findMany({
		where: {
			AND: andConditions,
		},

		take: limit,
		skip,

		orderBy: {
			[sortBy]: sortOrder,
		},

		select: {
			id: true,
			name: true,
			experienceYears: true,
			bio: true,
			createdAt: true,
		},
	});

	const totalAvailableTechnicianCount = await prisma.technician.count({
		where: { AND: andConditions },
	});

	return {
		data: availableTechnicians,
		meta: {
			page,
			limit,
			total: totalAvailableTechnicianCount,
			totalPages: Math.ceil(totalAvailableTechnicianCount / limit),
		},
	};
};

// const getAllDoctorsListPublic = async (query: IQuery) => {
// 	const limit = query.limit ? Number(query.limit) : 10;
// 	const page = query.page ? Number(query.page) : 1;
// 	const skip = (page - 1) * limit;
// 	const sortBy = query.sortBy ? query.sortBy : "createdAt";
// 	const sortOrder = query.sortOrder ? query.sortOrder : "desc";

// 	const andConditions: DoctorWhereInput[] = [
// 		{ isDeleted: false },
// 		{ verificationStatus: DoctorVerificationStatus.APPROVED },
// 	];

// 	if (query.searchTerm) {
// 		andConditions.push({
// 			OR: [
// 				{ name: { contains: query.searchTerm, mode: "insensitive" } },
// 				{ specialization: { contains: query.searchTerm, mode: "insensitive" } },
// 				{ qualifications: { contains: query.searchTerm, mode: "insensitive" } },
// 			],
// 		});
// 	}

// 	if (query.specialization) {
// 		andConditions.push({
// 			specialization: { equals: query.specialization, mode: "insensitive" },
// 		});
// 	}

// 	const allDoctors = await prisma.doctor.findMany({
// 		where: {
// 			AND: andConditions,
// 		},

// 		take: limit,
// 		skip,

// 		orderBy: {
// 			[sortBy]: sortOrder,
// 		},

// 		select: {
// 			id: true,
// 			name: true,
// 			specialization: true,
// 			licenseNumber: true,
// 			qualifications: true,
// 			experienceYears: true,
// 			bio: true,
// 			consultationFee: true,
// 			createdAt: true,
// 		},
// 	});

// 	const totalDoctorCount = await prisma.doctor.count({
// 		where: { AND: andConditions },
// 	});

// 	return {
// 		data: allDoctors,
// 		meta: {
// 			page,
// 			limit,
// 			total: totalDoctorCount,
// 			totalPages: Math.ceil(totalDoctorCount / limit),
// 		},
// 	};
// };

// const getSingleDoctorPublicProfile = async (doctorId: string) => {
// 	const doctor = await prisma.doctor.findUnique({
// 		where: {
// 			id: doctorId,
// 			isDeleted: false,
// 			verificationStatus: DoctorVerificationStatus.APPROVED,
// 		},
// 		select: {
// 			id: true,
// 			name: true,
// 			specialization: true,
// 			licenseNumber: true,
// 			qualifications: true,
// 			experienceYears: true,
// 			bio: true,
// 			consultationFee: true,
// 			createdAt: true,
// 		},
// 	});

// 	if (!doctor) {
// 		throw new AppError(httpStatus.NOT_FOUND, "Doctor Not Found");
// 	}

// 	return doctor;
// };

export const TechnicianService = {
	applyAsTechnician,
	verifyTechnicianEmail,
	approveTechnician,
	getAllTechnicians,
	updateTechnicianProfile,
	getAvailableTechnicianByTodaysSchedule,
	// getAllDoctorsListPublic,
	// getSingleDoctorPublicProfile
};
