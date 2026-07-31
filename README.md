<div align="center">

<img src="docs/logo.png" alt="Runeforge logo" width="300" />

# Runeforge

A SvelteKit toolkit that forges forms, tables, actions, and CRUD workflows from reusable definitions.

<img src="docs/crud-list.png" alt="CRUD list view" />

</div>

---

## Table of Contents

- [Runeforge](#runeforge)
  - [Table of Contents](#table-of-contents)
  - [Introduction](#introduction)
  - [Requirements](#requirements)
  - [Key Features](#key-features)
  - [Installation](#installation)
  - [Theming](#theming)
    - [Tailwind source scanning](#tailwind-source-scanning)
    - [CSS variables](#css-variables)
  - [Configuration](#configuration)
  - [Basic Usage](#basic-usage)
    - [1. Define your interface and metadata](#1-define-your-interface-and-metadata)
    - [2. Create the model](#2-create-the-model)
    - [3. Set up the server](#3-set-up-the-server)
    - [4. Add the page component](#4-add-the-page-component)
  - [Field System](#field-system)
    - [Attribute reference](#attribute-reference)
    - [Validation](#validation)
    - [Conditional fields](#conditional-fields)
    - [Field grouping](#field-grouping)
    - [Default values](#default-values)
    - [Select options](#select-options)
    - [Multiselect fields](#multiselect-fields)
    - [Tree fields](#tree-fields)
    - [Embedded fields (sub-documents)](#embedded-fields-sub-documents)
  - [Components](#components)
    - [GenericCRUD](#genericcrud)
      - [Free-text search](#free-text-search)
      - [Custom row actions](#custom-row-actions)
      - [Custom bulk actions](#custom-bulk-actions)
      - [Exporting data (CSV/XLSX)](#exporting-data-csvxlsx)
      - [Server-side pagination, sorting & filtering](#server-side-pagination-sorting--filtering)
    - [PaginatedTable](#paginatedtable)
    - [Form Components](#form-components)
    - [Shared Components](#shared-components)
  - [Formatters](#formatters)
    - [`formatBoolean`](#formatboolean)
    - [`formatDatetime`](#formatdatetime)
    - [`formatTruncateTextUpTo`](#formattruncatetextupto)
    - [`formatInstance`](#formatinstance)
  - [Custom Cell Components](#custom-cell-components)
    - [Example: avatar column](#example-avatar-column)
    - [Example: icon column](#example-icon-column)
  - [Internationalization](#internationalization)
    - [Switch to English](#switch-to-english)
    - [Override individual strings](#override-individual-strings)
    - [Full `RuneforgeStrings` reference](#full-runeforgestrings-reference)
    - [Bundled locales](#bundled-locales)
  - [Icon System](#icon-system)
  - [Running Tests](#running-tests)
    - [Unit Tests](#unit-tests)
    - [End-to-End Tests](#end-to-end-tests)
    - [Run All Tests](#run-all-tests)
  - [Development](#development)
  - [License](#license)

---

## Introduction

Runeforge provides a set of composable, metadata-driven components for building data-heavy interfaces in SvelteKit. It handles the repetitive parts of CRUD UIs — listing records, creating and editing forms, sorting and filtering tables — through a declarative API built on top of [DaisyUI](https://daisyui.com/) and [Tailwind CSS](https://tailwindcss.com/).

---

## Requirements

- SvelteKit 2+
- Svelte 5 (runes mode)
- Tailwind CSS 4
- DaisyUI 5
- Cally
- `xlsx` (optional, only if you enable Excel export)

---

## Key Features

- **GenericCRUD** — a single orchestrator component that wires together list, create, read, and update views from field and column definitions.
- **PaginatedTable** — a full-featured table with sorting, filtering, pagination, and row selection, usable either fully client-side or driven by a server-paginated backend.
- **Field system** — declarative field definitions that drive both form rendering and display, supporting text, email, password, number, boolean, textarea, file, select, multiselect, tree, datetime, and embedded (sub-document list) types.
- **Validation** — built-in `required`, `min`/`max`, `integer`, `minLength`/`maxLength`, and `pattern` rules, checked client-side before submit with consistent, translatable error messages.
- **Conditional fields & field grouping** — disable, or entirely hide, a field based on the current values of others in the same form, and visually group related fields under a titled `fieldset`.
- **Smart select fields** — options can be static, computed from page data, dependent on another field's value, or resolved live from the server as the user types. `multiselect` supports the same resolvers for a checkbox-style multiple-choice list.
- **Tree fields** — a hierarchical, cascading-selection picker (e.g. categories with parent/child relationships) driven by a flat option list with a `parentValue` link.
- **Embedded fields** — model one-to-many sub-documents (e.g. line items, adjustments) as an in-form add/edit list backed by a single JSON field.
- **Custom row & bulk actions** — add entity-specific actions (in a panel or via redirect) alongside the built-in view/edit/delete, and bulk actions that operate on the current selection.
- **CSV/XLSX export** — one-click export of the current table view, with optional Excel support via the `xlsx` package.
- **Server-side pagination, sorting & filtering** — point `GenericCRUD`/`PaginatedTable` at a paginated envelope and it drives page/sort/filter state through the URL for you.
- **Pluggable icon system** — swap the default icon set or use the included Bootstrap Icons alternative via `setIconSet`.
- **Standalone components** — table, form, and navigation components can be used independently without the full CRUD orchestrator.

---

## Installation

```bash
pnpm add runeforge
```

---

## Theming

### Tailwind source scanning

Runeforge components use Tailwind CSS utility classes internally. Tailwind v4 does not scan `node_modules` by default, so add an `@source` directive in your project's `app.css` to ensure every utility class is generated:

```css
@import "tailwindcss";
@source "../node_modules/runeforge/dist";
@plugin "daisyui";
```

### CSS variables

Key visual properties are exposed as CSS custom properties so you can tune them per project. Set them on `:root` (or any narrower selector) in your `app.css`:

```css
:root {
  --runeforge-crud-title-size: 1.875rem;
  --runeforge-breadcrumb-font-size: 0.875rem;
  --runeforge-breadcrumb-icon-size: 1rem;
}
```

Responsive overrides work too:

```css
:root {
  --runeforge-crud-title-size: 1.25rem;
}
@media (min-width: 768px) {
  :root {
    --runeforge-crud-title-size: 1.875rem;
  }
}
```

| Variable | Default | Affects |
| --- | --- | --- |
| `--runeforge-crud-max-width` | _(none)_ | Max width of the Header and List view; centers them when set |
| `--runeforge-form-max-width` | `32rem` | Max width of the form/fields panel in Create, Update, and Read views |
| `--runeforge-crud-title-size` | `1.875rem` | `<h1>` inside the `Header` component |
| `--runeforge-breadcrumb-font-size` | `0.875rem` | Breadcrumb label text size |
| `--runeforge-breadcrumb-icon-size` | `1rem` | Breadcrumb icon width and height |

Modal sizing (see [Shared Components](#shared-components)) is set per-instance via props rather than a CSS variable.

---

## Configuration

Global settings are applied once in your root layout via `setConfig`. This avoids passing the same prop to every CRUD component.

```ts
<!-- +layout.svelte -->
<script>
  import { setConfig } from 'runeforge';

  setConfig({ homeHref: '/admin' });
</script>
```

| Option | Default | Description |
| --- | --- | --- |
| `homeHref` | `'/'` | URL for the home crumb in every breadcrumb trail |

---

## Basic Usage

### 1. Define your interface and metadata

```ts
// interface.ts
import { AttributeType, type InterfaceMetadata } from 'runeforge';
import { formatBoolean, formatDatetime } from 'runeforge';

export interface IArticle {
  _id: string;
  title: string;
  published: boolean;
  createdAt: Date;
}

export const articleMeta = {
  title: {
    label: 'Title',
    type: AttributeType.text,
    placeholder: 'My article',
    required: true,
  },
  published: {
    label: 'Published',
    type: AttributeType.boolean,
    formatter: formatBoolean,
    default: false,
    required: true,
  },
  createdAt: {
    label: 'Created',
    type: AttributeType.datetime,
    formatter: formatDatetime(),
    excludedFromCreate: true,
    excludedFromUpdate: true
  },
  updatedAt: {
    label: 'Updated',
    type: AttributeType.datetime,
    formatter: formatDatetime(),
    excludedFromCreate: true,
    excludedFromUpdate: true
  },
} satisfies InterfaceMetadata<IArticle>;
```

Each metadata entry drives both the table column and the form field for that attribute. You can use `excludedFromList`, `excludedFromCreate`, `excludedFromRead`, or `excludedFromUpdate` to hide a field from specific views. The [Field System](#field-system) section below covers the full set of options — validation, conditional/grouped fields, smart selects, and embedded sub-documents.

### 2. Create the model

```ts
// model.ts
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import type { IArticle } from './interface';

const schema = new mongoose.Schema<IArticle>(
  {
    _id: { type: String, default: () => crypto.randomUUID() },
    title: { type: String, required: true, trim: true },
    published: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

export const Article = mongoose.models.Article ?? mongoose.model<IArticle>('Article', schema);
```

### 3. Set up the server

```ts
// +page.server.ts
import { fail, error } from '@sveltejs/kit';
import { Article } from '$lib/server/articles/model';
import type { Actions, PageServerLoad } from './$types';
import type { IArticle } from './interface';

export const load: PageServerLoad = async ({ url }) => {
  const id = url.searchParams.get('id');
  if (id) {
    const article = await Article.findById(id).lean<IArticle>();
    if (!article) error(404, 'Not found');
    return { article };
  }
  const articles = await Article.find({}).sort({ createdAt: -1 }).lean<IArticle[]>();
  return { articles };
};

export const actions: Actions = {
  create: async ({ request }) => {
    const data = await request.formData();
    const title = String(data.get('title') ?? '').trim();
    if (!title) return fail(400, { error: 'Title is required' });
    await Article.create({ title, published: data.has('published') });
    return { success: true };
  },

  update: async ({ request }) => {
    const data = await request.formData();
    const id = String(data.get('id') ?? '').trim();
    if (!id) return fail(400, { error: 'ID is required' });
    await Article.findByIdAndUpdate(id, {
      title: String(data.get('title') ?? '').trim(),
      published: data.has('published'),
    });
    return { success: true };
  },

  delete: async ({ request }) => {
    const data = await request.formData();
    const id = String(data.get('id') ?? '').trim();
    if (!id) return fail(400, { error: 'ID is required' });
    await Article.findByIdAndDelete(id);
    return { success: true };
  },
};
```

The `load` function returns a single record when `?id=` is present (used by the read/edit views), or the full list otherwise.

### 4. Add the page component

```html
<!-- +page.svelte -->
<script lang="ts">
  import { GenericCRUD } from 'runeforge';
  import { articleMeta as meta } from './interface';

  let { data, form } = $props();
</script>

<GenericCRUD
  labelOne="Article"
  labelMany="Articles"
  {data}
  {form}
  {meta}
  dataKey="articles"
  creation={{ endpoint: '?/create' }}
  read={{ endpoint: '?/read' }}
  update={{ endpoint: '?/update' }}
  deletion={{ endpoint: '?/delete' }}
/>
```

`dataKey` must match the key returned by the load function for the list. Each `endpoint` maps to a SvelteKit form action on the same page.

If your records use a different identifier field than `_id` (e.g. a plain `id`), pass the `idKey` prop:

```ts
<GenericCRUD idKey="id" ... />
```

This propagates to navigation URLs, form submissions, deletion calls, and the auto-excluded column list, so no other changes are needed on your end.

---

## Field System

Every entry in an `InterfaceMetadata<T>` object is an `AttributeMetadata` — a superset of what drives the table column, the form input, and its validation. This section documents every option beyond the basics shown above.

### Attribute reference

| Option | Type | Applies to | Description |
| --- | --- | --- | --- |
| `label` | `string` | all | Column header, form label, and the field name used in validation messages |
| `type` | `AttributeType` | all | `text` \| `email` \| `password` \| `number` \| `boolean` \| `textarea` \| `file` \| `select` \| `multiselect` \| `tree` \| `datetime` \| `embedded` |
| `required` | `boolean \| (record) => boolean` | all | Marks the label and enforces a non-empty value on submit. The function form re-evaluates against the other fields' current values — see [Validation](#validation) |
| `autocomplete` | `FullAutoFill` | text-like | Native `autocomplete` attribute |
| `placeholder` | `string` | text-like, select, multiselect | Placeholder text |
| `default` | `value \| (data) => value` | all | Initial value on the create form — see [Default values](#default-values) |
| `min` / `max` | `number` | `number` | Numeric range validation |
| `integer` | `boolean` | `number` | Rejects non-whole numbers |
| `minLength` / `maxLength` | `number` | text-like | Character-count validation |
| `pattern` | `string` | text-like | Regex the value must match (`new RegExp(pattern)`) |
| `disabled` | `(record) => boolean` | all | Conditionally disables the input — see [Conditional fields](#conditional-fields) |
| `hidden` | `boolean \| (record) => boolean` | all | Conditionally removes the field from the form entirely — not rendered, not validated, not submitted — see [Conditional fields](#conditional-fields) |
| `groupedAs` | `string` | all | Visually groups fields under a titled section — see [Field grouping](#field-grouping) |
| `options` | `SelectOption[] \| (data) => SelectOption[]` | `select`, `multiselect`, `tree` | Static or computed option list — see [Select options](#select-options). `tree` options additionally accept `parentValue` — see [Tree fields](#tree-fields) |
| `dependentOptions` | `(data, record) => SelectOption[]` | `select`, `multiselect`, `tree` | Options derived from other fields' current values |
| `search` | `(query) => Promise<SelectOption[]>` | `select`, `multiselect` | Server-side option search as the user types |
| `seed` | `(instance) => unknown` | all | Overrides how the update form seeds this field from the loaded record |
| `fields` | `InterfaceMetadata<any>` | `embedded` | Sub-field schema for each item — see [Embedded fields](#embedded-fields-sub-documents) |
| `itemLabel` | `(item) => string` | `embedded` | Summary label for an item in the embedded list |
| `component` | `CellComponent` | all | Custom cell renderer — see [Custom Cell Components](#custom-cell-components) |
| `formatter` | `(data) => (value, row) => string` | all | Custom cell text — see [Formatters](#formatters) |
| `excludedFromList/Create/Read/Update` | `boolean` | all | Hides the field from that specific view |
| `sortable` / `filterable` | `boolean` | all | Table column controls |

### Validation

`required`, `min`/`max`, `integer`, `minLength`/`maxLength`, and `pattern` are checked client-side on submit, before the request hits your form action. Every failure is surfaced through the same field-level error UI (and the same translatable strings) regardless of which rule failed, so your server-side checks and Runeforge's checks look identical to the user.

```ts
code: {
  label: 'Code',
  type: AttributeType.text,
  required: true,
  pattern: '^[A-Z0-9]{3,8}$',
},
quantity: {
  label: 'Quantity',
  type: AttributeType.number,
  min: 1,
  max: 100,
  integer: true,
},
notes: {
  label: 'Notes',
  type: AttributeType.textarea,
  minLength: 3,
  maxLength: 200,
},
```

`required` also accepts a function of the other fields' current values, for when whether a field is mandatory depends on the rest of the form rather than being fixed:

```ts
formula: {
  label: 'Formula',
  type: AttributeType.select,
  options: [
    { value: 'benchmark', label: 'Benchmark' },
    { value: 'max', label: 'Max' },
  ],
},
quantity: {
  label: 'Quantity',
  type: AttributeType.number,
  // Not required for the "benchmark" formula, mandatory for every other one.
  required: (record) => record.formula !== 'benchmark',
},
```

The label's required marker and the submit-time check both re-evaluate the same way `disabled` does — see [Conditional fields](#conditional-fields).

> [!TIP]
> Client-side validation is a UX nicety, not a security boundary — always re-validate in your form actions.

### Conditional fields

`disabled` receives the form's current draft record (including in-progress edits to sibling fields) and returns whether the input should be disabled. It re-evaluates as the user types. `required` (see [Validation](#validation)) follows the same pattern for making a field mandatory only in certain conditions.

```ts
unlimited: {
  label: 'Unlimited quantity',
  type: AttributeType.boolean,
  default: false,
},
quantity: {
  label: 'Quantity',
  type: AttributeType.number,
  min: 1,
  disabled: (record) => !!record.unlimited,
},
```

`hidden` follows the exact same `boolean | (record) => boolean` shape, but goes a step further than `disabled`: a hidden field isn't just greyed out, it's removed from the form entirely — not rendered, not required-checked, not submitted. Use it when a field only makes sense for certain values of another field, rather than merely being non-editable:

```ts
paymentMethod: {
  label: 'Payment method',
  type: AttributeType.select,
  options: [
    { value: 'card', label: 'Credit card' },
    { value: 'cash', label: 'Cash on delivery' },
  ],
},
cardNumber: {
  label: 'Card number',
  type: AttributeType.text,
  hidden: (record) => record.paymentMethod !== 'card',
  required: (record) => record.paymentMethod === 'card',
},
cardExpiry: {
  label: 'Expiry date',
  type: AttributeType.text,
  hidden: (record) => record.paymentMethod !== 'card',
  required: (record) => record.paymentMethod === 'card',
},
```

Switching `paymentMethod` between `card` and `cash` swaps which fields are present, live, in the same create/edit view — no separate step or modal needed to collect the payment-specific details.

### Field grouping

Fields sharing the same `groupedAs` string render together inside a titled `fieldset`, at the position of the group's first field. Fields without `groupedAs` keep the original flat layout.

```ts
code: {
  label: 'Code',
  type: AttributeType.text,
  groupedAs: 'Identification',
},
sku: {
  label: 'SKU',
  type: AttributeType.text,
  groupedAs: 'Identification',
},
```

### Default values

`default` can be a plain value or a function of the page `data` object, evaluated once when the create form's fields are resolved — handy for defaulting a select to something derived from prefetched data.

```ts
published: {
  label: 'Published',
  type: AttributeType.boolean,
  default: false,
},
assignedTo: {
  label: 'Assigned to',
  type: AttributeType.select,
  options: (data: { users?: IUser[] }) => (data.users ?? []).map((u) => ({ value: u._id, label: u.name })),
  default: (data: { currentUserId?: string }) => data.currentUserId ?? '',
},
```

### Select options

`select` fields support four ways of resolving their options, which can be combined as needed:

- **Static** — a plain `SelectOption[]` array.
- **Computed from page data** — a function of the page `data` object, useful for prefetched, related records (see `formatInstance` in [Formatters](#formatters) for rendering the resolved link back).
- **Dependent** — `dependentOptions(data, record)` recomputes the option list from the *current draft record*, so one field's choices can depend on another's value. If the currently selected value is no longer in the recomputed list, it's cleared automatically.
- **Server search** — `search(query)` is called (debounced) as the user types, instead of filtering the (possibly partial) `options` list in memory. Combine it with `options` to keep a usable list before the user starts typing.

```ts
// Dependent options: narrow "city" choices by the selected "country"
country: {
  label: 'Country',
  type: AttributeType.select,
  options: [{ value: 'ar', label: 'Argentina' }, { value: 'uy', label: 'Uruguay' }],
},
city: {
  label: 'City',
  type: AttributeType.select,
  dependentOptions: (data, record) => CITIES_BY_COUNTRY[record.country as string] ?? [],
},

// Server-aware search: fall back to a prefetched slice, but query the
// server for anything outside it.
owner: {
  label: 'Owner',
  type: AttributeType.select,
  placeholder: 'Choose an owner',
  options: (data: { owners?: IOwner[] }) => (data.owners ?? []).map((o) => ({ value: o.id, label: o.name })),
  search: async (query) => {
    const fd = new FormData();
    fd.set('query', query);
    const res = await fetch('?/searchOwners', { method: 'POST', body: fd });
    const result = deserialize(await res.text());
    if (result.type !== 'success') return [];
    return (result.data.owners ?? []).map((o: IOwner) => ({ value: o.id, label: o.name }));
  },
},
```

```ts
// +page.server.ts
export const actions: Actions = {
  // ...create/update/delete
  searchOwners: async ({ request }) => {
    const data = await request.formData();
    const query = String(data.get('query') ?? '');
    return { owners: await Owner.find({ name: { $regex: query, $options: 'i' } }).limit(20).lean() };
  },
};
```

### Multiselect fields

`AttributeType.multiselect` is a checkbox-style multiple-choice dropdown — the same `options`/`dependentOptions`/`default`/`search` resolvers as `select` (see [Select options](#select-options)), but the stored value is a `string[]` instead of a single `string`. Picking an option toggles it without closing the dropdown, and the closed-state button summarizes the count (`"2 selected"`).

```ts
tags: {
  label: 'Tags',
  type: AttributeType.multiselect,
  options: [
    { value: 'fragile', label: 'Fragile' },
    { value: 'perishable', label: 'Perishable' },
    { value: 'oversized', label: 'Oversized' },
  ],
  default: [],
},
```

Like `embedded`, the value is submitted as a single hidden field holding a JSON array — parse it back out the same way:

```ts
const tags = JSON.parse(String(data.get('tags') ?? '[]'));
```

If the field also sets `dependentOptions`, selections that fall outside the recomputed list are pruned automatically (rather than clearing the whole field, as a single `select` does) — e.g. narrowing a `provinces` multiselect to only the options valid for the currently selected `country`.

### Tree fields

`AttributeType.tree` is a hierarchical picker — checkboxes in a collapsible tree, where checking a parent node cascades the selection to all of its descendants. It's driven by the same flat `SelectOption[]` as `select`/`multiselect`, plus an optional `parentValue` linking each option to its parent's `value` (omit or set `null` for a root node):

```ts
categories: {
  label: 'Categories',
  type: AttributeType.tree,
  options: (data: { categories?: ICategory[] }) =>
    (data.categories ?? []).map((c) => ({
      value: String(c.id),
      label: c.name,
      parentValue: c.parentCategory != null ? String(c.parentCategory) : null,
    })),
},
```

The stored value is a `string[]` of selected node values, submitted the same way as `multiselect` — a single hidden field holding a JSON array, parsed back out server-side with `JSON.parse`. `dependentOptions` and `hidden` work the same as any other field type.

### Embedded fields (sub-documents)

`AttributeType.embedded` models a one-to-many list of sub-records — line items, adjustments, contacts, anything you'd otherwise store as an array of objects — entirely within one form field. It renders as a list with an "+ Add" button; each item is added/edited through a modal built from the `fields` sub-schema, and removed with a single click. The whole list is serialized to JSON and submitted as a single hidden form field.

```ts
export interface IAdjustment {
  kind: string;
  amount: number;
}

export interface IWidget {
  _id: string;
  name: string;
  adjustments: IAdjustment[];
}

export const widgetMeta = {
  name: { label: 'Name', type: AttributeType.text, required: true },
  adjustments: {
    label: 'Adjustments',
    type: AttributeType.embedded,
    // Arrays of objects have no sensible plain-text table cell.
    excludedFromList: true,
    fields: {
      kind: {
        label: 'Kind',
        type: AttributeType.select,
        required: true,
        options: [
          { value: 'bonus', label: 'Bonus' },
          { value: 'penalty', label: 'Penalty' },
        ],
      },
      amount: { label: 'Amount', type: AttributeType.number, required: true, min: 0 },
    },
    itemLabel: (item) => `${item.kind === 'bonus' ? 'Bonus' : 'Penalty'}: ${item.amount}`,
  },
} satisfies InterfaceMetadata<IWidget>;
```

On the server, parse the field back out of `FormData` as JSON:

```ts
function widgetFromFormData(data: FormData) {
  let adjustments: IAdjustment[];
  try {
    adjustments = JSON.parse(String(data.get('adjustments') ?? '[]'));
  } catch {
    adjustments = [];
  }
  return { name: String(data.get('name') ?? '').trim(), adjustments };
}
```

Sub-fields support the same validation rules as top-level fields (`required`, `min`/`max`, `pattern`, etc.), checked when an item is added or edited in the modal. `itemLabel` controls how each item summarizes itself in the list; without it, Runeforge joins the resolved display value of every sub-field with `·`.

---

## Components

### GenericCRUD

The main CRUD orchestrator. It manages navigation between List, Create, Read, and Update views using URL search params (`?view=create`, `?id=xxx`, `?view=edit`).

Key props:

- `data` / `dataKey` — the record array (or [server-paginated envelope](#server-side-pagination-sorting--filtering)) and its primary key field
- `labelOne` / `labelMany` — singular and plural names for the entity
- `columns` — `ColumnDefinition[]` for the table view
- `fields` — `FieldDefinition[]` for form views
- `creation`, `update`, `read`, `deletion` — `ActionConfiguration` objects that define handlers and permissions for each operation. Set `confirm: true` on `deletion` to show a confirmation dialog before any delete (single row or batch)
- `actions` — `CustomAction[]`, extra per-row actions — see [Custom row actions](#custom-row-actions)
- `customBulkActions` — `CustomBulkAction[]`, extra actions on the current selection — see [Custom bulk actions](#custom-bulk-actions)
- `search` — `SearchConfiguration`, shows a free-text search box — see [Free-text search](#free-text-search)
- `enableExport`, `onExport`, `xlsx` — CSV/Excel export — see [Exporting data](#exporting-data-csvxlsx)

#### Free-text search

Passing `search` renders a debounced search box in the header. Typing updates a URL search param (`?search=...` by default), resets pagination and any open create/read/edit view, and leaves interpreting the term entirely to your `load` function — it's the same mechanism server-side pagination uses, so it composes naturally with it.

```ts
<GenericCRUD
  ...
  search={{ param: 'q', placeholder: 'Search tasks...', debounceMs: 300 }}
/>
```

| Option | Default | Description |
| --- | --- | --- |
| `param` | `'search'` | Query-string parameter name |
| `placeholder` | `strings.searchPlaceholder` | Input placeholder |
| `debounceMs` | `300` | Delay before the URL updates |

#### Custom row actions

`actions` adds entries to the per-row action menu, alongside the built-in view/edit/delete. Each `CustomAction` resolves in one of two ways — provide exactly one of `view` or `href`:

- `href(item)` — plain navigation, e.g. deep-linking into another CRUD's filtered list.
- `view` — a Svelte component of your own that `GenericCRUD` mounts directly (no wrapper) when the action runs. Since you own the whole component, you decide how it presents itself — typically as a modal built on the exported `Modal` component, sized however that action needs via `Modal`'s `class`/`width`/`maxWidth`/`height`/`maxHeight` props (see [Shared Components](#shared-components)).

```ts
import ArchiveIcon from './icons/Archive.svelte';
import ArchiveForm from './ArchiveForm.svelte';

const actions: CustomAction<IWidget>[] = [
  {
    label: 'Archive',
    icon: ArchiveIcon,
    endpoint: '?/archive',
    view: ArchiveForm,
    condition: (item) => !item.archived,
  },
  {
    label: 'Open in new tab',
    icon: ExternalLinkIcon,
    href: (item) => `/widgets/${item._id}`,
  },
];
```

```svelte
<GenericCRUD ... {actions} />
```

A `view` component receives `instance`, `label`, `endpoint`, `serverError`, `onCancel`, and `onSuccess` — the same shape Create/Update use internally — so it can reuse `enhance`-based form submission while rendering as a parametrized modal:

```svelte
<!-- ArchiveForm.svelte -->
<script lang="ts">
  import { enhance } from '$app/forms';
  import { Modal } from 'runeforge';

  let { instance, label, endpoint, serverError, onCancel, onSuccess } = $props();
</script>

<Modal title={label} onClose={onCancel} maxWidth="28rem">
  <form
    method="POST"
    action={endpoint}
    use:enhance={() => async ({ result, update }) => {
      await update({ reset: false });
      if (result.type === 'success') onSuccess();
    }}
  >
    <input type="hidden" name="id" value={instance._id} />
    {#if serverError}<p class="text-error">{serverError}</p>{/if}
    <div class="flex justify-end gap-2 mt-4">
      <button type="button" onclick={onCancel}>Cancel</button>
      <button type="submit">{label}</button>
    </div>
  </form>
</Modal>
```

#### Custom bulk actions

`customBulkActions` adds buttons next to the built-in Delete button in the header, operating on the current row selection. Each one is disabled until at least one row is selected, and (like deletion) can require confirmation.

```ts
<GenericCRUD
  ...
  customBulkActions={[
    { label: 'Complete', icon: CheckIcon, endpoint: '?/complete' },
    { label: 'Mark pending', icon: UndoIcon, endpoint: '?/incomplete', variant: 'error', confirm: true },
  ]}
/>
```

`endpoint` is called once per selected row (`POST` with an `id` field), then the list is refreshed. `variant` matches DaisyUI's `btn-*` modifiers (`'primary'`, `'error'`, `'ghost'`, ...). `condition(selectedItems)` can hide the action entirely based on the current selection.

#### Exporting data (CSV/XLSX)

`enableExport` adds an export button to the header offering CSV (always) and Excel (when an `xlsx` module is supplied). Runeforge never bundles `xlsx` itself — install it separately and pass the resolved module in, so the dependency stays fully optional:

```bash
pnpm add xlsx
```

```ts
<script>
  import { GenericCRUD } from 'runeforge';
  import * as xlsx from 'xlsx';
</script>

<GenericCRUD ... enableExport {xlsx} />
```

In client-pagination mode, export includes every row currently matching the table's filters (not just the visible page). In [server-pagination mode](#server-side-pagination-sorting--filtering), pass `onExport` to fetch the full, unpaginated result set for the current query — without it, export falls back to just the currently loaded page:

```ts
<GenericCRUD
  ...
  enableExport
  onExport={async (query) => {
    const params = new URLSearchParams();
    if (query.ordering) params.set('ordering', query.ordering);
    // ...translate query.filters into your API's params
    const res = await fetch(`/api/widgets/export?${params}`);
    return res.json();
  }}
/>
```

#### Server-side pagination, sorting & filtering

By default, `GenericCRUD` and `PaginatedTable` paginate, sort, and filter the full `data` array in the browser. For large datasets, return a `PaginatedEnvelope<T>` from your `load` function instead — `{ results, count, page, pageSize }` — and Runeforge switches to server mode automatically: it drives `page`, `ordering`, and per-column filter values through the URL, and expects your `load` function to read them back.

```ts
// +page.server.ts
export const load: PageServerLoad = ({ url }) => {
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const ordering = url.searchParams.get('ordering');
  const name = url.searchParams.get('name'); // per-column text filter

  let rows = [...allWidgets];
  if (name) rows = rows.filter((w) => w.name.toLowerCase().includes(name.toLowerCase()));
  if (ordering) {
    const desc = ordering.startsWith('-');
    const field = desc ? ordering.slice(1) : ordering;
    rows = [...rows].sort((a, b) => (desc ? -1 : 1) * compare(a[field], b[field]));
  }

  const pageSize = 20;
  const start = (page - 1) * pageSize;
  return { widgets: { results: rows.slice(start, start + pageSize), count: rows.length, page, pageSize } };
};
```

```ts
<GenericCRUD
  ...
  data={{ widgets: data.widgets }}
  dataKey="widgets"
/>
```

No other prop changes are needed — column sorting/filtering UI, the paginator, and (with `onExport`) export all keep working the same way, just backed by the server instead of the in-memory array. Boolean-column filters send comma-separated values (`?active=true,false`); date-range filters send `<attribute>_from`/`<attribute>_to`.

### PaginatedTable

A standalone table component with built-in sort, filter, and pagination — the same engine `GenericCRUD` uses internally.

```ts
<script>
  import { PaginatedTable } from 'runeforge';
</script>

<PaginatedTable {data} {columns} />
```

Sort and filter state can be managed externally via the exported `SortState` and `FilterState` classes. Pass a `pagination` prop (`ServerPagination`) plus `onPaginationChange` to opt into the same [server-driven mode](#server-side-pagination-sorting--filtering) `GenericCRUD` uses. `bind:visibleRows` and `bind:query` expose the currently filtered/sorted rows and query snapshot, useful for building your own export UI on top of the raw table.

### Form Components

Individual form primitives styled with DaisyUI:

- `Button` — styled action button
- `Label` — form label with optional required marker
- `Select` — dropdown with option group support, optional in-memory filtering, and an optional `search` prop for server-resolved options (see [Select options](#select-options))
- `PasswordInput` — password field with show/hide toggle; `labelClass`, `inputClass`, and `buttonClass` props let you restyle the wrapper, input, and toggle button independently

### Shared Components

- `Avatar` — user avatar display
- `Modal` — DaisyUI modal wrapper. Size it with Tailwind utility classes via `class` (e.g. `class="max-w-4xl"`), or with explicit `width`/`maxWidth`/`height`/`maxHeight` CSS lengths, which are applied as inline styles and take priority over `class`
- `Breadcrumbs` — navigation breadcrumb trail
- `IconRenderer` — renders icons from the active icon set

---

## Formatters

Formatters are functions you attach to a metadata field to control how its value is displayed in the table and read view. They follow a curried signature: `(data) => (value) => string`, where `data` is the full page data object (useful for resolving related records).

### `formatBoolean`

Converts a boolean to a readable label.

> [!NOTE]
> Defaults to `Sí` / `No` because this was created at Argentina papá! 🇦🇷.

```ts
import { formatBoolean } from 'runeforge';

isActive: {
  label: 'Active',
  type: AttributeType.boolean,
  formatter: formatBoolean(),
  // or with custom labels:
  formatter: formatBoolean('Enabled', 'Disabled'),
},
```

### `formatDatetime`

Formats a `Date` value using the tokens `dd`, `mm`, `YYYY`, `HH`, `MM`, `ss`.

> [!NOTE]
> Defaults to `'dd/mm/YYYY HH:MM'`.

```ts
import { formatDatetime } from 'runeforge';

createdAt: {
  label: 'Created',
  type: AttributeType.datetime,
  formatter: formatDatetime(),             // → "13/06/2026 09:45"
},

publishedAt: {
  label: 'Published',
  type: AttributeType.datetime,
  formatter: formatDatetime('dd/mm/YYYY'), // → "13/06/2026"
},
```

### `formatTruncateTextUpTo`

Truncates long text to a maximum character count, appending `…`.

```ts
import { formatTruncateTextUpTo } from 'runeforge';

description: {
  label: 'Description',
  type: AttributeType.textarea,
  formatter: formatTruncateTextUpTo(80),
},
```

### `formatInstance`

Resolves a foreign-key ID to a linked label. Receives the related records and the URL path for the detail view, and renders an anchor tag pointing to that record.

```ts
import { formatInstance } from 'runeforge';
import type { ICategory } from '$lib/server/categories/interface';

categoryId: {
  label: 'Category',
  type: AttributeType.select,
  options: (data: { categories?: ICategory[] }) =>
    (data.categories ?? []).map((c) => ({ value: c._id, label: c.name })),
  formatter: (data: { categories?: ICategory[] }) =>
    formatInstance<ICategory>('name', data.categories ?? [], '/admin/categories'),
},
```

---

## Custom Cell Components

Instead of a `formatter`, a metadata field can declare a `component` — a Svelte component that renders the cell in both the table list and the read view. This is useful when you need to render something visual, like an avatar image or an icon, rather than plain text.

A cell component receives two props defined by `CellProps<T, V>`:

- `value` — the raw field value for that cell
- `row` — the full record object, useful when the rendering depends on other fields

```ts
// CellProps interface (from runeforge)
interface CellProps<T extends object, V> {
  value: V;
  row: T;
}
```

### Example: avatar column

The following renders a user photo with a fallback to initials, using data from sibling fields on the row:

```ts
<!-- components/UserAvatar.svelte -->
<script lang="ts">
  import { Avatar } from 'runeforge';
  import type { CellProps } from 'runeforge';

  type UserRow = { firstName?: string; lastName?: string; email?: string };

  let { value, row }: CellProps<UserRow, string | null> = $props();

  const initials = [row.firstName?.[0], row.lastName?.[0]].filter(Boolean).join('').toUpperCase();
</script>

<Avatar src={value} text={initials} alt={row.email ?? ''} />
```

Register it in the metadata with `component`:

```ts
// interface.ts
import UserAvatar from './components/UserAvatar.svelte';

export const userMeta = {
  photo: {
    label: 'Photo',
    type: AttributeType.file,
    component: UserAvatar,
    sortable: false,
    filterable: false,
  },
  // ...
} satisfies InterfaceMetadata<IUser>;
```

### Example: icon column

A simpler case — render a Bootstrap icon by name stored as a plain string:

```ts
<!-- components/IconCell.svelte -->
<script lang="ts">
  import { IconRenderer } from 'runeforge';
  import type { CellProps } from 'runeforge';

  let { value }: CellProps<Record<string, unknown>, string> = $props();
</script>

<IconRenderer name={value} />
```

```ts
icon: {
  label: 'Icon',
  type: AttributeType.text,
  component: IconCell,
},
```

> [!TIP]
> Both `AvatarCell` and `IconCell` are included in the package and ready to use — you don't need to build them from scratch:
>
> ```ts
> import { AvatarCell, IconCell } from 'runeforge';
>
> photo: { label: 'Photo', type: AttributeType.file, component: AvatarCell },
> icon:  { label: 'Icon',  type: AttributeType.text, component: IconCell  },
> ```

---

## Internationalization

All UI strings default to **Spanish** (Argentina). To switch to another language, call `setStrings` in your root layout with a full or partial `RuneforgeStrings` object. Values you omit fall back to the Spanish defaults.

### Switch to English

```ts
<!-- +layout.svelte -->
<script>
  import { setStrings, en } from 'runeforge';

  setStrings(en);
</script>
```

### Override individual strings

```ts
<script>
  import { setStrings } from 'runeforge';

  setStrings({
    create: 'New',
    save: 'Confirm',
    required: (field) => `${field} cannot be blank`,
  });
</script>
```

### Full `RuneforgeStrings` reference

| Key | Type | Spanish default |
| --- | --- | --- |
| `showing` | `(start, end, total) => string` | `Mostrando 1–10 de 25` |
| `actions` | `string` | `Acciones` |
| `filter` | `string` | `Filtrar` |
| `filterColumn` | `(column) => string` | `Filtrar Nombre` |
| `filterPlaceholder` | `string` | `Filtrar…` |
| `clearFilter` | `string` | `Limpiar filtro` |
| `emptyValue` | `string` | `(vacío)` |
| `previous` | `string` | `Anterior` |
| `next` | `string` | `Siguiente` |
| `selectPlaceholder` | `string` | `Seleccioná una opción` |
| `selectSearch` | `string` | `Buscar...` |
| `selectSearching` | `string` | `Buscando...` |
| `selectNoResults` | `string` | `Sin resultados` |
| `view` | `string` | `Ver` |
| `edit` | `string` | `Editar` |
| `delete` | `string` | `Eliminar` |
| `create` | `string` | `Crear` |
| `searchPlaceholder` | `string` | `Buscar...` |
| `export` | `string` | `Exportar` |
| `exportCsv` | `string` | `Exportar a CSV` |
| `exportExcel` | `string` | `Exportar a Excel` |
| `save` | `string` | `Guardar` |
| `saveAndContinue` | `string` | `Guardar y continuar` |
| `cancel` | `string` | `Cancelar` |
| `back` | `string` | `Volver` |
| `add` | `string` | `Agregar` |
| `remove` | `string` | `Quitar` |
| `noItems` | `string` | `Sin elementos agregados` |
| `confirm` | `string` | `Confirmar` |
| `deleteConfirm` | `(count, actionLabel) => string` | `¿Seguro que querés eliminar 3 elementos?` |
| `required` | `(field) => string` | `Título es requerido` |
| `invalidNumber` | `(field) => string` | `Cantidad debe ser un número` |
| `integer` | `(field) => string` | `Cantidad debe ser un número entero` |
| `min` | `(field, min) => string` | `Cantidad debe ser mayor o igual a 1` |
| `max` | `(field, max) => string` | `Cantidad debe ser menor o igual a 100` |
| `minLength` | `(field, min) => string` | `Notas debe tener al menos 3 caracteres` |
| `maxLength` | `(field, max) => string` | `Notas debe tener como máximo 200 caracteres` |
| `pattern` | `(field) => string` | `Código tiene un formato inválido` |
| `serverError` | `string` | `Error inesperado del servidor.` |

> [!NOTE]
> Defaults to Spanish because this was built in Argentina! 🇦🇷

### Bundled locales

| Import | Language |
| --- | --- |
| `es` | Spanish 🇦🇷 (default) |
| `en` | English 🇺🇸 |

---

## Icon System

Runeforge ships with a default icon set. To use Bootstrap Icons instead:

```ts
<script>
  import { setIconSet, bootstrapIcons } from 'runeforge';

  setIconSet(bootstrapIcons);
</script>
```

You can also provide a fully custom icon set by passing an object that satisfies the icon set interface.

---

## Running Tests

### Unit Tests

Unit tests cover utility functions (formatters, resolution helpers, misc utilities) and run with [Vitest](https://vitest.dev/).

```bash
# Single run
pnpm test:unit

# Watch mode
pnpm test:unit:watch
```

### End-to-End Tests

E2E tests cover table interactions (pagination, sorting, filtering) and run with [Playwright](https://playwright.dev/). The dev server starts automatically when running locally.

```bash
pnpm test:e2e
```

### Run All Tests

```bash
pnpm test
```

---

## Development

```bash
# Start the dev server
pnpm dev

# Type-check
pnpm check

# Lint and format
pnpm lint
pnpm format

# Build the library
pnpm build
```

---

## License

MIT
