export type NavigationCategories = Record<
  string,
  {
    items: {
      id: string
      name: string
      url: string
      current: boolean
      permitted: boolean
      alwaysViewable: boolean
    }[]
    settings: {
      displayCategoryName: boolean
      collapsible: boolean
      defaultState: 'closed' | 'open'
    }
  }
>

interface NavItemProps {
  id: string | string[]
  altId?: string | string[]
  name: string
  permission: string | boolean
  path: string
  alwaysViewable?: boolean
}

export class NavigationBuilder {
  private categories: NavigationCategories
  private currentUrl: string
  private permissions: Record<string, boolean>
  private currentCategory: undefined | string

  constructor(currentUrl: string, permissions: Record<string, boolean>) {
    this.categories = {}
    this.currentUrl = currentUrl
    this.permissions = permissions
    this.currentCategory = undefined
  }

  category(name: string, { collapsible = false, displayCategoryName = true }) {
    if (!this.categories[name]) {
      this.categories[name] = {
        items: [],
        settings: {
          displayCategoryName,
          collapsible,
          defaultState: 'closed',
        },
      }
    }
    this.currentCategory = name
    return this
  }

  add({ id, altId, name, permission, path, alwaysViewable = false }: NavItemProps) {
    if (!this.currentCategory) {
      throw new Error('Cannot add setting without category, use .category(name) first.')
    }
    const urlParts = [Array.isArray(id) ? id.join('/') : id]
    const altUrlParts = [Array.isArray(altId) ? altId.join('/') : `${altId}`]
    const item = {
      id: Array.isArray(id) ? id[id.length - 1] : id,
      name,
      url: path,
      current:
        urlParts.every((part) => this.currentUrl.includes(part)) ||
        altUrlParts.every((part) => this.currentUrl.includes(part)),
      permitted: typeof permission === 'boolean' ? permission : this.permissions[permission],
      alwaysViewable, // when true, this setting will appear on all account types
    }

    this.categories[this.currentCategory].items.push(item)
    return this
  }

  build() {
    return this.categories
  }
}
