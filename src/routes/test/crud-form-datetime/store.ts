import type { IAppointment } from './interface.js';

const INITIAL: IAppointment[] = [
	{ id: '1', title: 'Kickoff', scheduled: '2026-03-15T09:30', followUp: '' },
	{ id: '2', title: 'Unscheduled follow-up', scheduled: '', followUp: '' }
];

export let appointments: IAppointment[] = INITIAL.map((a) => ({ ...a }));
let nextId = 3;

export function resetAppointments() {
	appointments = INITIAL.map((a) => ({ ...a }));
	nextId = 3;
}

export function addAppointment(appointment: Omit<IAppointment, 'id'>): IAppointment {
	const created: IAppointment = { id: String(nextId++), ...appointment };
	appointments.push(created);
	return created;
}

export function updateAppointment(id: string, appointment: Omit<IAppointment, 'id'>): boolean {
	const idx = appointments.findIndex((a) => a.id === id);
	if (idx < 0) return false;
	appointments[idx] = { id, ...appointment };
	return true;
}
