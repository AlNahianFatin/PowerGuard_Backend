export interface ICreateFeederPayload {
	name: string;
	code: string;
	description?: string;
	repairingCost: string;
	substationId: string;
}
export interface IUpdateFeederPayload {
	name?: string;
	code?: string;
	description?: string;
	repairingCost?: string;
	substationId?: string;
	areaIds?: string[];
}
