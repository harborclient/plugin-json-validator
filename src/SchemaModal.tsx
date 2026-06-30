import { useEffect, useId, useState, type JSX } from '@harborclient/sdk/react';
import {
  Button,
  CodeEditor,
  FieldError,
  FormGroup,
  Input,
  Modal,
  ModalFooter
} from '@harborclient/sdk/components';
import { addSchema, getSchemaById, requirePluginContext, updateSchema } from './store';

interface SchemaEditorContext {
  editingId?: string | null;
}

interface Props {
  /**
   * Host-provided context from {@link PluginUi.openModal}.
   */
  context?: SchemaEditorContext;
}

const DEFAULT_SCHEMA = '{\n  "type": "object",\n  "properties": {}\n}';

const MODAL_PANEL_CLASS = 'json-schema-validator-modal-panel';

/**
 * Injects sizing rules for the schema modal panel.
 *
 * Tailwind arbitrary utilities from plugin bundles are not scanned by the host app,
 * so viewport sizing is applied with a dedicated class and inline CSS.
 */
function SchemaModalStyles() {
  /**
   * Adds viewport-sized modal styles and removes them on unmount.
   */
  useEffect(() => {
    const style = document.createElement('style');
    style.setAttribute('data-json-schema-validator-modal', 'true');
    style.textContent = `
      .${MODAL_PANEL_CLASS} {
        width: 80vw !important;
        height: 80vh !important;
        max-width: 80vw !important;
        max-height: 80vh !important;
      }
      .${MODAL_PANEL_CLASS} .json-schema-validator-editor {
        min-height: calc(80vh - 220px);
        height: calc(80vh - 220px);
      }
    `;
    document.head.appendChild(style);
    return () => {
      style.remove();
    };
  }, []);

  return null;
}

/**
 * Closes the host modal overlay for the schema editor.
 */
function closeSchemaModal(): void {
  requirePluginContext().ui.closeModal('schema-editor');
}

/**
 * Modal for adding or editing a JSON Schema in the plugin library.
 */
export function SchemaModal({ context }: Props): JSX.Element {
  const editingId = context?.editingId ?? null;
  const titleId = useId();
  const nameId = useId();
  const schemaLabelId = useId();
  const nameErrorId = useId();
  const schemaErrorId = useId();

  const existing = editingId ? getSchemaById(editingId) : undefined;

  const [name, setName] = useState(existing?.name ?? '');
  const [schema, setSchema] = useState(existing?.schema ?? DEFAULT_SCHEMA);
  const [nameError, setNameError] = useState<string | null>(null);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  /**
   * Resets form fields when the edited schema changes.
   */
  useEffect(() => {
    setName(existing?.name ?? '');
    setSchema(existing?.schema ?? DEFAULT_SCHEMA);
    setNameError(null);
    setSchemaError(null);
  }, [existing?.name, existing?.schema, editingId]);

  /**
   * Validates and saves the schema entry.
   */
  const handleSave = async (): Promise<void> => {
    setNameError(null);
    setSchemaError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError('Name is required');
      return;
    }

    try {
      JSON.parse(schema);
    } catch {
      setSchemaError('Schema must be valid JSON');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await updateSchema(editingId, trimmedName, schema);
      } else {
        await addSchema(trimmedName, schema);
      }
      closeSchemaModal();
    } finally {
      setSaving(false);
    }
  };

  const modalTitle = editingId ? 'Edit JSON Schema' : 'Add JSON Schema';

  return (
    <>
      <SchemaModalStyles />
      <Modal
        labelledBy={titleId}
        onClose={closeSchemaModal}
        overlayClassName="z-[1000]"
        className={`${MODAL_PANEL_CLASS} flex flex-col overflow-hidden`}
        title={modalTitle}
      >
        <div className="flex min-h-0 flex-1 flex-col gap-4 mb-4">
          <FormGroup label="Name" htmlFor={nameId}>
            <Input
              id={nameId}
              value={name}
              onChange={(event) => {
                setName(event.target.value);
              }}
              aria-invalid={nameError ? true : undefined}
              aria-describedby={nameError ? nameErrorId : undefined}
              placeholder="User response"
            />
            <FieldError id={nameErrorId} roleAlert>
              {nameError}
            </FieldError>
          </FormGroup>

          <FormGroup
            label="Schema"
            htmlFor={schemaLabelId}
            className="flex min-h-0 flex-1 flex-col"
          >
            <CodeEditor
              id={schemaLabelId}
              value={schema}
              onChange={setSchema}
              language="json"
              className="json-schema-validator-editor min-h-0 flex-1"
              aria-labelledby={schemaLabelId}
              aria-invalid={schemaError ? true : undefined}
              aria-describedby={schemaError ? schemaErrorId : undefined}
            />
            <FieldError id={schemaErrorId} roleAlert>
              {schemaError}
            </FieldError>
          </FormGroup>
        </div>

        <ModalFooter>
          <Button type="button" variant="secondary" onClick={closeSchemaModal}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={saving}
            onClick={() => {
              void handleSave();
            }}
          >
            Save
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
