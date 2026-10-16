/*
 * API pública de @evolium-kit/toolkit/crud
 *
 * CRUD sobre TanStack Query (`@tanstack/angular-query-experimental`, peer
 * opcional — só quem importa este entry point o precisa de instalar).
 * Depende de /services (kernel, `crudPlugin()`) e de /components (modais).
 * Ver crud/README.md.
 */

export * from './lib/crud.types';
export * from './lib/crud.adapters';
export type { EvoCrudHookError, EvoCrudHookName } from './lib/crud.hooks';
export * from './lib/crud.plugin';
export { EVO_CRUD_DEFAULT_ERROR, EVO_CRUD_FIELDS_ERROR } from './lib/form-errors';
export { injectCrudResource } from './lib/inject-crud-resource';
export { injectCrudController, EVO_CRUD_CONFIRM_REMOVE } from './lib/inject-crud-controller';
export * from './lib/inject-crud-page';
export * from './lib/inject-crud-form';

// Hooks prontos
export * from './lib/hooks/crud-toasts';
export * from './lib/hooks/crud-soft-delete';
export * from './lib/hooks/crud-invalidate';
