import type { PluginContext, SidebarSectionContribution } from '@harborclient/sdk';
import { initStore, resetStore } from './store';
import { SchemasHeaderActions, SchemasSidebar } from './SchemasSidebar';
import { SchemaModal } from './SchemaModal';
import { SchemaSelectTab } from './SchemaSelectTab';
import { ValidationTab } from './ValidationTab';

/**
 * Registers JSON Schema sidebar, request tab, and response validation tab.
 *
 * @param hc - SDK surface from HarborClient.
 */
export function activate(hc: PluginContext): void {
  void initStore(hc);

  hc.subscriptions.push({ dispose: resetStore });
  hc.subscriptions.push(
    hc.ui.registerSidebarSection({
      id: 'schemas',
      title: 'JSON Schemas',
      order: 20,
      headerActions: SchemasHeaderActions,
      Component: SchemasSidebar
    } as SidebarSectionContribution),
    hc.ui.registerModal({
      id: 'schema-editor',
      title: 'Add JSON Schema',
      Component: SchemaModal
    }),
    hc.ui.registerRequestTab({
      id: 'schema',
      title: 'JSON Schema',
      order: 50,
      Component: ({ context }) => <SchemaSelectTab context={context} />
    }),
    hc.ui.registerResponseTab({
      id: 'validation',
      title: 'JSON Validation',
      order: 50,
      Component: ({ context }) => <ValidationTab context={context} />
    })
  );
}
