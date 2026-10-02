export interface ICreateReportPayload {
	diagnosis: string;
	charge: string;
}

export interface IUpdateReportPayload {
	diagnosis?: string;
	charge?: string;
}
