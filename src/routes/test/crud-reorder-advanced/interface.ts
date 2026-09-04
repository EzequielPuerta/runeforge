import { AttributeType, type InterfaceMetadata } from '$lib/index.js';

/** Models the interno-cfi "indicators" scenario: `order` is only unique
 * *within* its `group` (e.g. a parent chapter) — the true resting order is
 * (`group`, `order`), a composite key `attribute` alone can't express. */
export interface IIndicator {
	_id: string;
	title: string;
	group: number;
	order: number;
}

export const indicatorMeta = {
	title: {
		label: 'Title',
		type: AttributeType.text,
		placeholder: 'Indicator title',
		required: true
	},
	group: {
		label: 'Group',
		type: AttributeType.number,
		integer: true,
		excludedFromList: true
	},
	order: {
		label: 'Order',
		type: AttributeType.number,
		integer: true,
		excludedFromList: true
	}
} satisfies InterfaceMetadata<IIndicator>;
