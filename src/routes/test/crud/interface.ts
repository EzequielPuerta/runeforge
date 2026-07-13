import { AttributeType, formatBoolean, type InterfaceMetadata } from '$lib/index.js';
import { formatTruncateTextUpTo } from '$lib/index.js';

export interface ITask {
	_id: string;
	title: string;
	description: string;
	completed: boolean;
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
		formatter: formatTruncateTextUpTo(60),
		placeholder: 'Task description'
	},
	completed: {
		label: 'Completed',
		type: AttributeType.boolean,
		formatter: formatBoolean(),
		default: false
	}
} satisfies InterfaceMetadata<ITask>;
