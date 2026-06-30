import { useEffect, useState } from '@harborclient/sdk/react';
import { syncOnWindowFocus } from '@harborclient/sdk/store';
import { Button, EmptyState, RowActionsMenu } from '@harborclient/sdk/components';
import {
  getSchemasStore,
  getSelectionsStore,
  removeSchema,
  requirePluginContext,
  useSchemas
} from './store';

/** Tailwind classes matching HarborClient sidebar source rows (Collections, Environments). */
const SIDEBAR_ROW_CLASS =
  'group flex items-center gap-1 rounded-md px-1.5 py-0.5 hover:bg-selection/60 app-no-drag';

/**
 * Header action button that opens the add-schema modal in the host overlay.
 */
export function SchemasHeaderActions() {
  /**
   * Opens the schema editor modal for a new entry.
   */
  const handleAdd = (): void => {
    requirePluginContext().ui.openModal('schema-editor', { editingId: null });
  };

  return (
    <Button
      type="button"
      variant="toolbar"
      aria-label="Add JSON Schema"
      title="Add JSON Schema"
      className="inline-flex min-w-[28px] items-center justify-center text-[14px] font-medium"
      onClick={handleAdd}
    >
      +
    </Button>
  );
}

/**
 * Sidebar section body listing JSON Schemas with edit and delete actions.
 */
export function SchemasSidebar() {
  const schemas = useSchemas();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  /**
   * Reloads schema data when this webview regains focus so saves from the modal
   * overlay appear without a full app restart.
   */
  useEffect(() => {
    const syncDisposable = syncOnWindowFocus([getSchemasStore(), getSelectionsStore()]);
    return () => {
      syncDisposable.dispose();
    };
  }, []);

  if (schemas.length === 0) {
    return (
      <EmptyState>
        No JSON Schemas yet. Add one with the + button above, then assign it on a request&apos;s
        JSON Schema tab.
      </EmptyState>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      {schemas.map((entry) => (
        <div key={entry.id} className={SIDEBAR_ROW_CLASS}>
          <span className="min-w-0 flex-1 truncate py-0.5 text-[14px]">{entry.name}</span>
          <RowActionsMenu
            menuId={`schema-${entry.id}`}
            openMenuId={openMenuId}
            onOpenChange={setOpenMenuId}
            groups={[
              [
                {
                  label: 'Edit',
                  onSelect: () => {
                    requirePluginContext().ui.openModal('schema-editor', { editingId: entry.id });
                  }
                }
              ],
              [
                {
                  label: 'Delete',
                  variant: 'danger',
                  onSelect: () => {
                    void removeSchema(entry.id);
                  }
                }
              ]
            ]}
          />
        </div>
      ))}
    </div>
  );
}
