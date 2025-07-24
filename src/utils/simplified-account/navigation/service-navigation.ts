import paths from '@root/paths'
import { NavigationBuilder, NavigationCategories } from '@utils/simplified-account/navigation/NavigationBuilder.class'
import GatewayAccount from '@models/gateway-account/GatewayAccount.class'
import Service from '@models/service/Service.class'
import UserPermissions from '@models/user/permissions'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'

export = (account: GatewayAccount, service: Service, currentUrl: string, permissions: Record<string, boolean>) => {
  const navBuilder = new NavigationBuilder(currentUrl, permissions)
  const serviceNavigation = navBuilder
    .category('service navigation', { displayCategoryName: false })
    .add({
      id: 'dashboard',
      name: 'dashboard',
      path: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.dashboard.index,
        service.externalId,
        account.type
      ),
      hasPermission: UserPermissions.any,
    })
    .add({
      id: 'payment-links',
      name: 'payment links',
      path: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.paymentLinks.index,
        service.externalId,
        account.type
      ),
      hasPermission: UserPermissions.any,
    })
    .add({
      id: 'agreements',
      name: 'agreements',
      path: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.agreements.index,
        service.externalId,
        account.type
      ),
      hasPermission: UserPermissions.agreements.agreementsRead,
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
