export interface ICreateSubstationPayload {
	name: string;
	code: string;
	description?: string;
	zoneId: string;
}
export interface IUpdateSubstationPayload {
	name?: string;
	code?: string;
	description?: string;
	zoneId?: string;
	feederIds?: string[];
}
