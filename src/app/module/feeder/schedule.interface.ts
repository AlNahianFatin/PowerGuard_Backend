export interface ICreateSchedulePayload {
	startDateTime: Date;
	endDateTime: Date;
	reason: string;
	feederId: string;
}
export interface IUpdateSchedulePayload {
	startDateTime?: Date;
	endDateTime?: Date;
	reason?: string;
	feederId?: string;
}
