import type { TechnicianVerificationStatus } from "../../../generated/prisma/enums";

export interface TechnicianApplicationData {
	user: {
		name: string;
		email: string;
	};
	technician: {
		address?: string;
		experienceYears: number;
		bio?: string;
		contactNumber?: string;
	};
}

export interface IApplyAsTechnicianPayload {
	resume: File;
	additionalFiles: File[];
	data: TechnicianApplicationData;
}

export interface IVerifyTechnicianEmailPayload {
	email: string;
	otp: string;
}

export interface IApproveTechnicianPayload {
	technicianId: string;
	verificationStatus: TechnicianVerificationStatus;
	rejectionReason: string;
}

export interface IUpdateTechnicianProfilePayload {
	name?: string;
	address?: string;
	bio?: string;
	contactNumber?: string;
}

export interface IChangeTechnicianPasswordPayload {
	email: string;
	password: string;
}
