import PaymentProviders from '@models/constants/payment-providers'
import User from '@models/user/User.class'
import { findGatewayAccountsByService } from '@services/gateway-accounts.service'
import { ViewModeLinksGenerator } from '@models/view-mode/ViewModeLinksGenerator.class'

export type ViewModeName = 'test' | 'live'

/*
For use on dashboard level routes where a view mode (test or live) can be specified
Determines whether the user has services in the given mode, and the complementary mode
 */
export class ViewMode {
  readonly modeName: ViewModeName
  readonly hasServicesInMode: boolean
  readonly oppositeModeName: ViewModeName
  readonly hasServicesInOppositeMode: boolean
  readonly gatewayAccountIds: number[]
  readonly paymentProviders: string[]
  readonly permission?: string

  readonly _locals: {
    links: ViewModeLinksGenerator
  }

  private constructor(
    modeName: ViewModeName,
    hasServicesInMode: boolean,
    oppositeModeName: ViewModeName,
    hasServicesInOppositeMode: boolean,
    gatewayAccountIds: number[],
    paymentProviders: string[],
    permission?: string
  ) {
    this.modeName = modeName
    this.hasServicesInMode = hasServicesInMode
    this.oppositeModeName = oppositeModeName
    this.hasServicesInOppositeMode = hasServicesInOppositeMode

    this.gatewayAccountIds = gatewayAccountIds
    this.paymentProviders = paymentProviders
    this.permission = permission

    this._locals = {
      links: new ViewModeLinksGenerator(this),
    }
  }

  // determines all services viewable in specified mode (test or live)
  // optionally for which user has a given permission
  static async forUser(user: User, modeFilter: ViewModeName, permission?: string): Promise<ViewMode> {
    const userServiceRoles = permission
      ? user.serviceRoles.filter((serviceRole) => serviceRole.hasPermission(permission))
      : user.serviceRoles

    const userServiceExternalIds = userServiceRoles
      .map((serviceRole) => serviceRole.service)
      .map((service) => service.externalId)
    if (!userServiceExternalIds.length) {
      return new ViewMode(modeFilter, false, oppositeModeNames[modeFilter], false, [], [], permission)
    }

    const allGatewayAccounts = await findGatewayAccountsByService(userServiceExternalIds)
    const gatewayAccountsForMode = allGatewayAccounts.filter((gatewayAccount) => gatewayAccount.type === modeFilter)
    const gatewayAccountIdsForMode = gatewayAccountsForMode.map((gatewayAccountData) => gatewayAccountData.id)

    const hasServicesInMode = gatewayAccountIdsForMode.length !== 0
    const hasServicesInOppositeMode = allGatewayAccounts.length > gatewayAccountsForMode.length

    const paymentProviders = Object.values(PaymentProviders).filter((pspName) => {
      gatewayAccountsForMode.some((gatewayAccount) => gatewayAccount.paymentProvider === pspName)
    })

    return new ViewMode(
      modeFilter,
      hasServicesInMode,
      oppositeModeNames[modeFilter],
      hasServicesInOppositeMode,
      gatewayAccountIdsForMode,
      paymentProviders,
      permission
    )
  }
}

const oppositeModeNames: Record<ViewModeName, ViewModeName> = {
  live: 'test',
  test: 'live',
}
