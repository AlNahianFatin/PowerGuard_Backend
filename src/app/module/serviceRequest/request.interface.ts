export interface ISubmitRequestPayload {
	title: string;
	description?: string;
	areaId: string;
}

export interface IUpdateRequestPayload {
	title?: string;
	description?: string;
	areaId?: string;
}

export interface IRejectRequestPayload {
	rejectionReason: string;
	// status: AppointmentStatus
}

export interface IAssignTechnicianPayload {
	technicianId: string;
	notes?: string;
}

export interface IUpdateRequestStatusPayload {
	status: "INSPECTING" | "RESOLVED" | "FAILED";
	failureNote?: string;
	// status: AppointmentStatus
}
