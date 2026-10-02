export interface ISubmitReportPayload {
	diagnosis: string;
	charge: string;
}

export interface IUpdateReportPayload {
	diagnosis?: string;
	charge?: string;
}
