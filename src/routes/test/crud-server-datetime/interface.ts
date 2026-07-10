import { AttributeType, type InterfaceMetadata } from '$lib/index.js';

export interface IEvent {
	id: number;
	name: string;
	joined: string;
}

export const eventMeta = {
	id: {
		label: 'ID',
		type: AttributeType.number,
		excludedFromCreate: true,
		excludedFromUpdate: true,
		sortable: true,
		filterable: false,
	},
	name: {
		label: 'Name',
		type: AttributeType.text,
		required: true,
		sortable: true,
		filterable: false,
	},
	joined: {
		label: 'Joined',
		type: AttributeType.datetime,
		sortable: true,
		filterable: true,
	},
} satisfies InterfaceMetadata<IEvent>;
