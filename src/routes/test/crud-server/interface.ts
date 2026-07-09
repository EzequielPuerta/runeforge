import { AttributeType, type InterfaceMetadata } from '$lib/index.js';

export interface IPerson {
	id: number;
	name: string;
	age: number;
	city: string;
	active: boolean;
}

export const personMeta = {
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
		filterable: true,
	},
	age: {
		label: 'Age',
		type: AttributeType.number,
		required: true,
		sortable: true,
		filterable: false,
	},
	city: {
		label: 'City',
		type: AttributeType.text,
		required: true,
		sortable: true,
		filterable: true,
	},
	active: {
		label: 'Active',
		type: AttributeType.boolean,
		default: true,
		sortable: true,
		filterable: true,
	},
} satisfies InterfaceMetadata<IPerson>;
