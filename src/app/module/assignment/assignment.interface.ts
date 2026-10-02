export interface IAssignTechnicianPayload {
	technicianId: string;
	notes?: string;
}

export interface IUpdateAssignmentPayload {
	technicianId?: string;
	notes?: string;
}

export interface IUpdateAssignmentStatusPayload {
	status: "INSPECTING" | "RESOLVED" | "FAILED";
	failureNote?: string;
	// status: AppointmentStatus
}
