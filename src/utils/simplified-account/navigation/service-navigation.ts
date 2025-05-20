import paths from '@root/paths'
import formatAccountPathsFor from '@utils/format-account-paths-for'
import { NavigationBuilder, NavigationCategories } from '@utils/simplified-account/navigation/NavigationBuilder.class'
import GatewayAccount from '@models/GatewayAccount.class'
import Service from '@models/Service.class'
import formatFutureStrategyAccountPathsFor from '@utils/format-future-strategy-account-paths-for'
import UserPermissions from '@models/user/permissions'

export = (account: GatewayAccount, service: Service, currentUrl: string, permissions: Record<string, boolean>) => {
  const navBuilder = new NavigationBuilder(currentUrl, permissions)
  const serviceNavigation = navBuilder
    .category('service menu', { displayCategoryName: false })
    .add({
      id: 'dashboard',
      name: 'dashboard',
      path: formatAccountPathsFor(paths.account.dashboard.index, account.externalId) as string,
      hasPermission: UserPermissions.any,
    })
    .add({
      id: 'transactions',
      name: 'transactions',
      path: formatAccountPathsFor(paths.account.transactions.index, account.externalId) as string,
      hasPermission: UserPermissions.transactions.transactionsRead,
    })
    .add({
      id: 'payment-links',
      name: 'payment links',
      path: formatAccountPathsFor(paths.account.paymentLinks.start, account.externalId) as string,
      hasPermission: UserPermissions.transactions.transactionsRead,
    })
    .add({
      id: 'agreements',
      name: 'agreements',
      path: formatFutureStrategyAccountPathsFor(
        paths.futureAccountStrategy.agreements.index,
        account.type,
        service.externalId,
        account.externalId
      ) as string,
      hasPermission: UserPermissions.agreements.agreementsRead,
      conditions: account.recurringEnabled,
      alwaysViewable: true,
    })

    .build()
  return getViewableNav(serviceNavigation)
}

const getViewableNav = (serviceNavigation: NavigationCategories) => {
  const viewableNavigation: NavigationCategories = {}

  for (const [category, details] of Object.entries(serviceNavigation)) {
    const viewableCategory = details.items.filter((item) => item.permitted)

    const hasActiveSetting = details.items.some((item) => item.current)

    if (viewableCategory.length > 0) {
      viewableNavigation[category] = {
        items: viewableCategory,
        settings: {
          displayCategoryName: details.settings.displayCategoryName,
          collapsible: details.settings.collapsible,
          defaultState: hasActiveSetting ? 'open' : 'closed',
        },
      }
    }
  }

  return viewableNavigation
}
