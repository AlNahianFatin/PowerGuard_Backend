export interface ICreateAreaPayload {
	name: string;
	code: string;
	description?: string;
	feederId: string;
}
export interface IUpdateAreaPayload {
	name?: string;
	code?: string;
	description?: string;
	feederId?: string;
}
