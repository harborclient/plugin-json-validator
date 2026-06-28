import { installReact } from '@harborclient/sdk';
import type { PluginContext, SidebarSectionContribution } from '@harborclient/sdk';
import { initStore } from './store';
import { SchemasHeaderActions, SchemasSidebar } from './SchemasSidebar';
import { SchemaSelectTab } from './SchemaSelectTab';
import { ValidationTab } from './ValidationTab';

/**
 * Registers JSON Schema sidebar, request tab, and response validation tab.
 *
 * @param hc - SDK surface from HarborClient.
 */
export function activate(hc: PluginContext): void {
  installReact(hc.react);

  void initStore(hc);

  hc.subscriptions.push(
    hc.ui.registerSidebarSection({
      id: 'schemas',
      title: 'JSON Schemas',
      order: 20,
      headerActions: SchemasHeaderActions,
      Component: SchemasSidebar
    } as SidebarSectionContribution),
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
