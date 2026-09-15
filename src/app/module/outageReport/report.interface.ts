export interface ISubmitReportPayload {
	title: string;
	areaId: string;
	description?: string;
}
export interface IPayAppointmentPayload {
	appointmentId: string;
}
export interface ICancelAppointmentPayload {
	appointmentId: string;
}

export interface IUpdateAppointmentStatusPayload {
	status: "ONGOING" | "COMPLETED";
	// status: AppointmentStatus
}
