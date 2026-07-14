import type { RuneforgeStrings } from '$lib/i18n/types.js';

export const es: RuneforgeStrings = {
	showing: (start, end, total) => `Mostrando ${start}–${end} de ${total}`,
	actions: 'Acciones',
	filter: 'Filtrar',
	filterColumn: (column) => `Filtrar ${column}`,
	filterPlaceholder: 'Filtrar…',
	clearFilter: 'Limpiar filtro',
	emptyValue: '(vacío)',
	previous: 'Anterior',
	next: 'Siguiente',
	selectPlaceholder: 'Seleccioná una opción',
	selectSearch: 'Buscar...',
	selectNoResults: 'Sin resultados',
	view: 'Ver',
	edit: 'Editar',
	delete: 'Eliminar',
	create: 'Crear',
	searchPlaceholder: 'Buscar...',
	export: 'Exportar',
	exportCsv: 'Exportar a CSV',
	exportExcel: 'Exportar a Excel',
	save: 'Guardar',
	saveAndContinue: 'Guardar y continuar',
	cancel: 'Cancelar',
	back: 'Volver',
	confirm: 'Confirmar',
	deleteConfirm: (count, actionLabel) =>
		`¿Seguro que querés ${String(actionLabel).toLowerCase()} ${count} elemento${count === 1 ? '' : 's'}?`,
	required: (field) => `${field} es requerido`,
	serverError: 'Error inesperado del servidor.'
};
