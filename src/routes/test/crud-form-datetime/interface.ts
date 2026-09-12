import { AttributeType, formatDatetime, type InterfaceMetadata } from '$lib/index.js';

export interface IAppointment {
	id: string;
	title: string;
	scheduled: string;
	followUp: string;
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
	},
	followUp: {
		label: 'Follow-up',
		type: AttributeType.datetime,
		formatter: formatDatetime(),
		validate: (value, record) =>
			typeof value === 'string' &&
			value &&
			typeof record.scheduled === 'string' &&
			record.scheduled &&
			value <= record.scheduled
				? 'Follow-up must be later than the scheduled date'
				: undefined
	}
} satisfies InterfaceMetadata<IAppointment>;
