import { AttributeType, type InterfaceMetadata } from '$lib/index.js';
import { formatTruncateTextUpTo } from '$lib/index.js';

export interface ITask {
	_id: string;
	title: string;
	description: string;
}

export const taskMeta = {
	title: {
		label: 'Title',
		type: AttributeType.text,
		placeholder: 'Task title',
		required: true,
	},
	description: {
		label: 'Description',
		type: AttributeType.textarea,
		formatter: formatTruncateTextUpTo(60),
		placeholder: 'Task description',
	},
} satisfies InterfaceMetadata<ITask>;
