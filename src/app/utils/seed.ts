import bcrypt from "bcryptjs";
import httpStatus from "http-status";
import {
	TechnicianVerificationStatus,
	Role,
} from "../../generated/prisma/enums";
import config from "../config";
import { prisma } from "../lib/prisma";
import { AppError } from "./AppError";

//create tester admin
export const seedTesterAdmin = async () => {
	try {
		const isTesterAdminExist = await prisma.user.findFirst({
			where: {
				email: config.tester_admin_email,
				role: Role.ADMIN,
			},
		});

		if (isTesterAdminExist) {
			console.log("Tester Admin Already Exists!");
			return;
		}

		const name = config.tester_admin_name;
		const email = config.tester_admin_email;
		const password = config.tester_admin_password;

		if (!name || !email || !password) {
			throw new AppError(
				httpStatus.INTERNAL_SERVER_ERROR,
				"Tester Admin Name , Email, Password Missing In Env File!!!",
			);
		}

		const hashedPassword = await bcrypt.hash(
			password,
			Number(config.bcrypt_salt_rounds),
		);

		const testerAdmin = await prisma.user.create({
			data: {
				name,
				email,
				password: hashedPassword,
				role: Role.ADMIN,
				needPasswordChange: false,
				emailVerified: true,
			},
		});

		console.log("Tester Admin Created : ", testerAdmin);
	} catch (error) {
		console.log("Error Seeding Tester Admin : ", error);

		await prisma.user.delete({
			where: {
				email: config.tester_admin_email,
			},
		});
	}
};

//create tester operator
export const seedTesterOperator = async () => {
	try {
		const isTesterOperatorExist = await prisma.user.findUnique({
			where: {
				email: config.tester_operator_email,
			},
		});

		if (isTesterOperatorExist) {
			console.log("Tester Operator Already Exists!");
			return;
		}

		const name = config.tester_operator_name;
		const email = config.tester_operator_email;
		const password = config.tester_operator_password;

		if (!name || !email || !password) {
			throw new AppError(
				httpStatus.INTERNAL_SERVER_ERROR,
				"Tester Operator Name , Email, Password Missing In Env File!!!",
			);
		}

		const hashedPassword = await bcrypt.hash(
			password,
			Number(config.bcrypt_salt_rounds),
		);

		const testerOperator = await prisma.user.create({
			data: {
				name,
				email,
				password: hashedPassword,
				role: Role.OPERATOR,
				needPasswordChange: false,
				emailVerified: true,
				operator: {
					create: {
						name,
						email,
					},
				},
			},
		});

		console.log("Tester Operator Created : ", testerOperator);
	} catch (error) {
		console.log("Error Seeding Tester Operator : ", error);

		await prisma.user.delete({
			where: {
				email: config.tester_operator_email,
			},
		});
	}
};

// create tester technician
export const seedTesterTechnician = async () => {
	try {
		const isTesterTechnicianExist = await prisma.user.findUnique({
			where: {
				email: config.tester_technician_email,
			},
		});

		if (isTesterTechnicianExist) {
			console.log("Tester Technician Already Exists!");
			return;
		}

		const name = config.tester_technician_name;
		const email = config.tester_technician_email;
		const password = config.tester_technician_password;

		if (!name || !email || !password) {
			throw new AppError(
				httpStatus.INTERNAL_SERVER_ERROR,
				"Tester Technician Name , Email, Password Missing In Env File!!!",
			);
		}

		const hashedPassword = await bcrypt.hash(
			password,
			Number(config.bcrypt_salt_rounds),
		);

		const testerTechnician = await prisma.user.create({
			data: {
				name,
				email,
				password: hashedPassword,
				role: Role.TECHNICIAN,
				needPasswordChange: false,
				emailVerified: true,
				technician: {
					create: {
						name,
						email,
						experienceYears: 5,
						bio: "Not an actual technician. Just created for testing purposes during development",
						verificationStatus: TechnicianVerificationStatus.APPROVED,
					},
				},
			},
		});

		console.log("Tester Technician Created : ", testerTechnician);
	} catch (error) {
		console.log("Error Seeding Technician Doctor : ", error);

		await prisma.user.delete({
			where: {
				email: config.tester_technician_email,
			},
		});
	}
};

// create tester customer
export const seedTesterCustomer = async () => {
	try {
		const isTesterCustomerExist = await prisma.user.findUnique({
			where: {
				email: config.tester_customer_email,
			},
		});

		if (isTesterCustomerExist) {
			console.log("Tester Customer Already Exists!");
			return;
		}

		const name = config.tester_customer_name;
		const email = config.tester_customer_email;
		const password = config.tester_customer_password;

		if (!name || !email || !password) {
			throw new AppError(
				httpStatus.INTERNAL_SERVER_ERROR,
				"Tester Customer Name , Email, Password Missing In Env File!!!",
			);
		}

		const hashedPassword = await bcrypt.hash(
			password,
			Number(config.bcrypt_salt_rounds),
		);

		const testerCustomer = await prisma.user.create({
			data: {
				name,
				email,
				password: hashedPassword,
				role: Role.CUSTOMER,
				needPasswordChange: false,
				emailVerified: true,
				customer: {
					create: {
						name,
						email,
					},
				},
			},
		});

		console.log("Tester Customer Created : ", testerCustomer);
	} catch (error) {
		console.log("Error Seeding Tester Customer : ", error);

		await prisma.user.delete({
			where: {
				email: config.tester_customer_email,
			},
		});
	}
};
