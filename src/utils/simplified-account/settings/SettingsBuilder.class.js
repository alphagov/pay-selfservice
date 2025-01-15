module.exports = class SettingsBuilder {
  constructor (account, service, currentUrl, permissions, pathFormatter) {
    this.categories = {}
    this.account = account
    this.service = service
    this.currentUrl = currentUrl
    this.permissions = permissions
    this.pathFormatter = pathFormatter
    this.currentCategory = null
  }

  category (name) {
    if (!this.categories[name]) {
      this.categories[name] = []
    }
    this.currentCategory = name
    return this
  }

  add ({ id, name, permission, path, alwaysViewable = false }) {
    if (!this.currentCategory) {
      throw new Error('Cannot add setting without category, use .category(name) first.')
    }

    const setting = {
      id,
      name,
      url: this.pathFormatter(
        path,
        this.service.externalId,
        this.account.type
      ),
      current: this.currentUrl.includes('simplified') && this.currentUrl.includes(`settings/${id}`),
      permitted: typeof permission === 'boolean' ? permission : this.permissions[permission],
      alwaysViewable // when true, this setting will appear on all account types
    }

    this.categories[this.currentCategory].push(setting)
    return this
  }

  build () {
    return this.categories
  }
}
