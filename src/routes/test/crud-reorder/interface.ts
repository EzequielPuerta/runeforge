import { AttributeType, type InterfaceMetadata } from '$lib/index.js';

export interface IChapter {
	_id: string;
	title: string;
	order: number;
}

export const chapterMeta = {
	title: {
		label: 'Title',
		type: AttributeType.text,
		placeholder: 'Chapter title',
		required: true
	},
	order: {
		label: 'Order',
		type: AttributeType.number,
		integer: true,
		excludedFromList: true
	}
} satisfies InterfaceMetadata<IChapter>;
