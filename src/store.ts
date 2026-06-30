import { useSyncExternalStore } from '@harborclient/sdk/react';
import type { PluginContext } from '@harborclient/sdk';
import { createStorageStore, type StorageStore } from '@harborclient/sdk/store';
import type { SchemaEntry, Selections } from './types';

const SCHEMAS_KEY = 'schemas';
const SELECTIONS_KEY = 'selections';

let hc: PluginContext | null = null;
let schemasStore: StorageStore<SchemaEntry[]> | null = null;
let selectionsStore: StorageStore<Selections> | null = null;

/**
 * Parses a raw storage value into the schema library snapshot.
 *
 * @param raw - Raw value from plugin storage.
 */
function parseSchemas(raw: unknown): SchemaEntry[] {
  return Array.isArray(raw) ? raw : [];
}

/**
 * Parses a raw storage value into request-to-schema selections.
 *
 * @param raw - Raw value from plugin storage.
 */
function parseSelections(raw: unknown): Selections {
  return raw && typeof raw === 'object' && !Array.isArray(raw) ? { ...(raw as Selections) } : {};
}

/**
 * Returns the initialized schemas store.
 */
function requireSchemasStore(): StorageStore<SchemaEntry[]> {
  if (!schemasStore) {
    throw new Error('JSON validator store is not initialized.');
  }
  return schemasStore;
}

/**
 * Returns the initialized selections store.
 */
function requireSelectionsStore(): StorageStore<Selections> {
  if (!selectionsStore) {
    throw new Error('JSON validator store is not initialized.');
  }
  return selectionsStore;
}

/**
 * Returns the initialized plugin context or throws when the store is unavailable.
 */
export function requirePluginContext(): PluginContext {
  if (!hc) {
    throw new Error('JSON validator store is not initialized.');
  }
  return hc;
}

/**
 * Generates a unique schema id.
 */
function createSchemaId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `schema-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Initializes the store with the plugin context and hydrates from storage.
 *
 * @param context - Renderer plugin context from HarborClient.
 */
export async function initStore(context: PluginContext): Promise<void> {
  hc = context;
  schemasStore = createStorageStore({
    storage: hc.storage,
    key: SCHEMAS_KEY,
    parse: parseSchemas
  });
  selectionsStore = createStorageStore({
    storage: hc.storage,
    key: SELECTIONS_KEY,
    parse: parseSelections
  });
  await Promise.all([schemasStore.reloadFromStorage(), selectionsStore.reloadFromStorage()]);
}

/**
 * Returns the plugin context when the store has been initialized.
 */
export function getPluginContext(): PluginContext | null {
  return hc;
}

/**
 * Clears module-level store state on plugin deactivation.
 *
 * Push onto {@link PluginContext.subscriptions} from {@link activate} so the host
 * tears down singletons when the plugin reloads or disables.
 */
export function resetStore(): void {
  hc = null;
  schemasStore = null;
  selectionsStore = null;
}

/**
 * Returns the storage-backed schemas store after {@link initStore}.
 */
export function getSchemasStore(): StorageStore<SchemaEntry[]> {
  return requireSchemasStore();
}

/**
 * Returns the storage-backed selections store after {@link initStore}.
 */
export function getSelectionsStore(): StorageStore<Selections> {
  return requireSelectionsStore();
}

/**
 * Reloads schema and selection data from persisted plugin storage.
 *
 * Separate plugin webviews do not share in-memory state; call this after another
 * surface writes storage (for example when a modal overlay saves a schema).
 */
export async function reloadFromStorage(): Promise<void> {
  await Promise.all([schemasStore?.reloadFromStorage(), selectionsStore?.reloadFromStorage()]);
}

/**
 * Returns the current schema library snapshot.
 */
export function getSchemasSnapshot(): SchemaEntry[] {
  return requireSchemasStore().getSnapshot();
}

/**
 * Returns the current selections snapshot.
 */
export function getSelectionsSnapshot(): Selections {
  return requireSelectionsStore().getSnapshot();
}

/**
 * Adds a new schema to the library and persists it.
 *
 * @param name - Display name for the schema.
 * @param schema - Raw JSON Schema text.
 */
export async function addSchema(name: string, schema: string): Promise<SchemaEntry> {
  const entry: SchemaEntry = {
    id: createSchemaId(),
    name: name.trim(),
    schema
  };
  const store = requireSchemasStore();
  await store.set([...store.getSnapshot(), entry]);
  return entry;
}

/**
 * Updates an existing schema entry and persists the library.
 *
 * @param id - Schema id to update.
 * @param name - Updated display name.
 * @param schema - Updated JSON Schema text.
 */
export async function updateSchema(id: string, name: string, schema: string): Promise<void> {
  const store = requireSchemasStore();
  await store.set(
    store
      .getSnapshot()
      .map((entry) => (entry.id === id ? { ...entry, name: name.trim(), schema } : entry))
  );
}

/**
 * Removes a schema and clears any selections that referenced it.
 *
 * @param id - Schema id to remove.
 */
export async function removeSchema(id: string): Promise<void> {
  const schemas = requireSchemasStore();
  const selections = requireSelectionsStore();
  await schemas.set(schemas.getSnapshot().filter((entry) => entry.id !== id));
  const nextSelections: Selections = {};
  for (const [key, schemaId] of Object.entries(selections.getSnapshot())) {
    if (schemaId !== id) {
      nextSelections[key] = schemaId;
    }
  }
  await selections.set(nextSelections);
}

/**
 * Sets or clears the schema selection for a request key.
 *
 * @param key - Request key from {@link RequestTabContext.requestKey}.
 * @param schemaId - Selected schema id, or empty string to clear.
 */
export async function setSelection(key: string, schemaId: string): Promise<void> {
  const store = requireSelectionsStore();
  const next = { ...store.getSnapshot() };
  if (!schemaId) {
    delete next[key];
  } else {
    next[key] = schemaId;
  }
  await store.set(next);
}

/**
 * React hook returning the current schema library.
 */
export function useSchemas(): SchemaEntry[] {
  return requireSchemasStore().useValue();
}

/**
 * React hook returning the selected schema id for a request key.
 *
 * @param key - Request key from {@link RequestTabContext.requestKey}.
 */
export function useSelection(key: string): string {
  const store = requireSelectionsStore();
  return useSyncExternalStore(
    store.subscribe,
    () => store.getSnapshot()[key] ?? '',
    () => ''
  );
}

/**
 * Returns a schema entry by id from the current snapshot.
 *
 * @param id - Schema id to look up.
 */
export function getSchemaById(id: string): SchemaEntry | undefined {
  return requireSchemasStore()
    .getSnapshot()
    .find((entry) => entry.id === id);
}
