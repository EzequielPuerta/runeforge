import { AttributeType, formatDatetime, type InterfaceMetadata } from '$lib/index.js';

export interface IAppointment {
	id: string;
	title: string;
	scheduled: string;
}

export const appointmentMeta = {
	id: {
		label: 'ID',
		type: AttributeType.text,
		excludedFromCreate: true,
		excludedFromUpdate: true
	},
	title: {
		label: 'Title',
		type: AttributeType.text,
		required: true
	},
	scheduled: {
		label: 'Scheduled',
		type: AttributeType.datetime,
		formatter: formatDatetime()
	}
} satisfies InterfaceMetadata<IAppointment>;
