import type { ITask } from './interface.js';

const INITIAL: ITask[] = [
	{ _id: '1', title: 'Buy groceries', description: 'Milk, eggs, bread', completed: false },
	{
		_id: '2',
		title: 'Write tests',
		description: 'Add Playwright e2e coverage',
		completed: false
	},
	{ _id: '3', title: 'Review PR', description: 'Check the new feature branch', completed: false }
];

export let tasks: ITask[] = INITIAL.map((t) => ({ ...t }));
let nextId = 4;

export function resetTasks() {
	tasks = INITIAL.map((t) => ({ ...t }));
	nextId = 4;
}

export function addTask(title: string, description: string): ITask {
	const task: ITask = { _id: String(nextId++), title, description, completed: false };
	tasks.push(task);
	return task;
}

export function updateTask(id: string, title: string, description: string): boolean {
	const idx = tasks.findIndex((t) => t._id === id);
	if (idx < 0) return false;
	tasks[idx] = { ...tasks[idx], title, description };
	return true;
}

export function deleteTask(id: string): boolean {
	const idx = tasks.findIndex((t) => t._id === id);
	if (idx < 0) return false;
	tasks.splice(idx, 1);
	return true;
}

export function setTaskCompleted(id: string, completed: boolean): boolean {
	const idx = tasks.findIndex((t) => t._id === id);
	if (idx < 0) return false;
	tasks[idx] = { ...tasks[idx], completed };
	return true;
}
