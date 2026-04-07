import type { CommandResultDisplay } from '../../commands.js'

export type PluginSettingsProps = {
  onComplete: (result?: string, options?: { display?: CommandResultDisplay }) => void
  targetPlugin?: string
  targetMarketplace?: string
  action?: 'enable' | 'disable' | 'uninstall' | 'add' | 'remove'
}

export type ViewState =
  | { type: 'menu' }
  | { type: 'help' }
  | { type: 'discover-plugins'; targetPlugin?: string }
  | { type: 'manage-plugins'; targetPlugin?: string; targetMarketplace?: string; action?: 'enable' | 'disable' | 'uninstall' }
  | { type: 'manage-marketplaces'; targetMarketplace?: string; action?: 'add' | 'remove' | 'update' }
  | { type: 'browse-marketplace'; targetMarketplace?: string; targetPlugin?: string }
  | { type: 'add-marketplace'; initialValue?: string }
  | { type: 'validate'; path: string }
  | { type: 'marketplace-menu' }
  | { type: 'marketplace-list' }
  | { type: 'errors' }
