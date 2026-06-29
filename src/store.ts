import { useSyncExternalStore } from '@harborclient/sdk/react';
import type { PluginContext } from '@harborclient/sdk';
import type { SchemaEntry, Selections } from './types';

const SCHEMAS_KEY = 'schemas';
const SELECTIONS_KEY = 'selections';

let hc: PluginContext | null = null;
let schemas: SchemaEntry[] = [];
let selections: Selections = {};
const listeners = new Set<() => void>();

/**
 * Notifies all store subscribers of a state change.
 */
function notify(): void {
  for (const listener of listeners) {
    listener();
  }
}

/**
 * Persists the current schema library to plugin storage.
 */
async function persistSchemas(): Promise<void> {
  if (!hc) {
    return;
  }
  await hc.storage.set(SCHEMAS_KEY, schemas);
}

/**
 * Persists the current request-to-schema selections to plugin storage.
 */
async function persistSelections(): Promise<void> {
  if (!hc) {
    return;
  }
  await hc.storage.set(SELECTIONS_KEY, selections);
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
  const [storedSchemas, storedSelections] = await Promise.all([
    hc.storage.get<SchemaEntry[]>(SCHEMAS_KEY),
    hc.storage.get<Selections>(SELECTIONS_KEY)
  ]);
  schemas = Array.isArray(storedSchemas) ? storedSchemas : [];
  selections =
    storedSelections && typeof storedSelections === 'object' ? { ...storedSelections } : {};
  notify();
}

/**
 * Returns the plugin context when the store has been initialized.
 */
export function getPluginContext(): PluginContext | null {
  return hc;
}

/**
 * Reloads schema and selection data from persisted plugin storage.
 *
 * Separate plugin webviews do not share in-memory state; call this after another
 * surface writes storage (for example when a modal overlay saves a schema).
 */
export async function reloadFromStorage(): Promise<void> {
  if (!hc) {
    return;
  }
  const [storedSchemas, storedSelections] = await Promise.all([
    hc.storage.get<SchemaEntry[]>(SCHEMAS_KEY),
    hc.storage.get<Selections>(SELECTIONS_KEY)
  ]);
  schemas = Array.isArray(storedSchemas) ? storedSchemas : [];
  selections =
    storedSelections && typeof storedSelections === 'object' ? { ...storedSelections } : {};
  notify();
}

/**
 * Subscribes to store changes for useSyncExternalStore.
 *
 * @param listener - Callback invoked when store state changes.
 */
export function subscribeStore(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Returns the current schema library snapshot.
 */
export function getSchemasSnapshot(): SchemaEntry[] {
  return schemas;
}

/**
 * Returns the current selections snapshot.
 */
export function getSelectionsSnapshot(): Selections {
  return selections;
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
  schemas = [...schemas, entry];
  notify();
  await persistSchemas();
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
  schemas = schemas.map((entry) =>
    entry.id === id ? { ...entry, name: name.trim(), schema } : entry
  );
  notify();
  await persistSchemas();
}

/**
 * Removes a schema and clears any selections that referenced it.
 *
 * @param id - Schema id to remove.
 */
export async function removeSchema(id: string): Promise<void> {
  schemas = schemas.filter((entry) => entry.id !== id);
  const nextSelections: Selections = {};
  for (const [key, schemaId] of Object.entries(selections)) {
    if (schemaId !== id) {
      nextSelections[key] = schemaId;
    }
  }
  selections = nextSelections;
  notify();
  await Promise.all([persistSchemas(), persistSelections()]);
}

/**
 * Sets or clears the schema selection for a request key.
 *
 * @param key - Request key from {@link requestKey}.
 * @param schemaId - Selected schema id, or empty string to clear.
 */
export async function setSelection(key: string, schemaId: string): Promise<void> {
  const next = { ...selections };
  if (!schemaId) {
    delete next[key];
  } else {
    next[key] = schemaId;
  }
  selections = next;
  notify();
  await persistSelections();
}

/**
 * React hook returning the current schema library.
 */
export function useSchemas(): SchemaEntry[] {
  return useSyncExternalStore(subscribeStore, getSchemasSnapshot, getSchemasSnapshot);
}

/**
 * React hook returning the selected schema id for a request key.
 *
 * @param key - Request key from {@link requestKey}.
 */
export function useSelection(key: string): string {
  return useSyncExternalStore(
    subscribeStore,
    () => getSelectionsSnapshot()[key] ?? '',
    () => ''
  );
}

/**
 * Returns a schema entry by id from the current snapshot.
 *
 * @param id - Schema id to look up.
 */
export function getSchemaById(id: string): SchemaEntry | undefined {
  return schemas.find((entry) => entry.id === id);
}
