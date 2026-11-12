import type { Role } from "../../../generated/prisma/browser";

export interface ILoginUserPayload {
	email: string;
	password: string;
}

export interface IRegisterCustomerPayload {
	name: string;
	email: string;
	password: string;
	confirmPassword: string;
	customer: {
		contactNumber?: string;
		address?: string;
	};
}
export interface IVerifyEmailPayload {
	email: string;
	otp: string;
}

export interface IRequestUser {
	userId: string;
	email: string;
	name: string;
	role: Role;
}

export interface IGoogleLoginPayload {
	idToken: string;
}

export interface IForgotPasswordPayload {
	email: string;
}
export interface IResetPasswordPayload {
	email: string;
	otp: string;
	newPassword: string;
	confirmNewPassword: string;
}

export interface IResendOtpPayload {
	email: string;
}