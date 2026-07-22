import { AttributeType, formatBoolean, type InterfaceMetadata } from '$lib/index.js';

export interface IWidget {
	_id: string;
	name: string;
	code: string;
	unlimited: boolean;
	quantity: number;
	notes: string;
}

export const widgetMeta = {
	name: {
		label: 'Name',
		type: AttributeType.text,
		placeholder: 'Widget name',
		required: true
	},
	code: {
		label: 'Code',
		type: AttributeType.text,
		placeholder: 'ABC123',
		required: true,
		pattern: '^[A-Z0-9]{3,8}$',
		groupedAs: 'Identification'
	},
	unlimited: {
		label: 'Unlimited quantity',
		type: AttributeType.boolean,
		default: false,
		formatter: formatBoolean(),
		groupedAs: 'Quantity'
	},
	quantity: {
		label: 'Quantity',
		type: AttributeType.number,
		default: 1,
		min: 1,
		max: 100,
		integer: true,
		disabled: (record) => !!record.unlimited,
		groupedAs: 'Quantity'
	},
	notes: {
		label: 'Notes',
		type: AttributeType.textarea,
		placeholder: 'Extra notes...',
		minLength: 3,
		maxLength: 200
	}
} satisfies InterfaceMetadata<IWidget>;
