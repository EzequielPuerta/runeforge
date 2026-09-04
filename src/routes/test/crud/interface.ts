import { AttributeType, formatBoolean, type InterfaceMetadata } from '$lib/index.js';

export interface ITask {
	_id: string;
	title: string;
	description: string;
	completed: boolean;
	link?: string;
}

export const taskMeta = {
	title: {
		label: 'Title',
		type: AttributeType.text,
		placeholder: 'Task title',
		required: true
	},
	description: {
		label: 'Description',
		type: AttributeType.textarea,
		truncateUpTo: 60,
		placeholder: 'Task description'
	},
	link: {
		label: 'Link',
		type: AttributeType.text,
		formatter: () => (value: unknown) =>
			value ? `<a href="${String(value)}" class="link link-primary">Open</a>` : '',
		excludedFromList: true,
		excludedFromCreate: true,
		excludedFromUpdate: true
	},
	completed: {
		label: 'Completed',
		type: AttributeType.boolean,
		formatter: formatBoolean(),
		default: false
	}
} satisfies InterfaceMetadata<ITask>;
