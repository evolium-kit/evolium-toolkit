/*
 * API pública de @evolium-kit/toolkit/services
 *
 * Kernel de plugins e plugins built-in. O kernel não conhece nenhum plugin em
 * concreto — ver services/README.md para o contrato completo.
 */

// Kernel
export * from './lib/kernel/types';
export * from './lib/kernel/resource-map';
export * from './lib/kernel/evo-error';
export * from './lib/kernel/error-mapper';
export * from './lib/kernel/registry';
export * from './lib/kernel/sort-plugins';
export * from './lib/kernel/tokens';
export * from './lib/kernel/storage';
export * from './lib/kernel/event-bus';
export * from './lib/kernel/bootstrap';
export * from './lib/kernel/provide-evo-services';
export * from './lib/kernel/http/endpoint';
export * from './lib/kernel/http/evo-http';
export * from './lib/kernel/http/dispatch.interceptor';

// Plugins built-in
export * from './lib/plugins/auth';
