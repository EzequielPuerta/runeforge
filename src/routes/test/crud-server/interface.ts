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
		// Includes 'Salta', which no seeded row ever has — proves the checkbox
		// list comes from this static list, not from what's on the loaded page.
		filterOptions: ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'Tucumán', 'Salta'].map(
			(city) => ({ value: city, label: city }),
		),
	},
	active: {
		label: 'Active',
		type: AttributeType.boolean,
		default: true,
		sortable: true,
		filterable: true,
	},
} satisfies InterfaceMetadata<IPerson>;
