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

export interface ICancelRequestPayload {
	requestId: string;
}

export interface IRejectRequestPayload {
	rejectionReason: string;
}
