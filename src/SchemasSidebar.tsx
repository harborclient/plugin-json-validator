import { useState } from '@harborclient/sdk/react';
import { Button, EmptyState, RowActionsMenu } from '@harborclient/sdk/components';
import { openAddModal, openEditModal, useModalState } from './modalSignal';
import { removeSchema, useSchemas } from './store';
import { SchemaModal } from './SchemaModal';

/** Tailwind classes matching HarborClient sidebar source rows (Collections, Environments). */
const SIDEBAR_ROW_CLASS =
  'group flex items-center gap-1 rounded-md px-1.5 py-0.5 hover:bg-selection/60 app-no-drag';

/**
 * Header action button that opens the add-schema modal.
 *
 * The modal is rendered here (not in the section body) so it stays mounted when the
 * section is collapsed and can portal to document.body outside the sidebar overflow.
 */
export function SchemasHeaderActions() {
  const modal = useModalState();

  return (
    <>
      <Button
        type="button"
        variant="toolbar"
        aria-label="Add JSON Schema"
        title="Add JSON Schema"
        className="inline-flex min-w-[28px] items-center justify-center text-[14px] font-medium"
        onClick={openAddModal}
      >
        +
      </Button>
      {modal.open ? <SchemaModal editingId={modal.editingId} onClose={() => undefined} /> : null}
    </>
  );
}

/**
 * Sidebar section body listing JSON Schemas with edit and delete actions.
 */
export function SchemasSidebar() {
  const schemas = useSchemas();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

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
                    openEditModal(entry.id);
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
