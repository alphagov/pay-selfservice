import { stubBuilder } from '../stub-builder'

export function createLegalEntity() {
  const path = `/lem/v4/legalEntities`

  return {
    success: function (legalEntity: { id: string }) {
      return stubBuilder('POST', path, 200, {
        response: legalEntity,
      })
    },
  }
}

export function getLegalEntity(legalEntityId: string) {
  const path = `/lem/v4/legalEntities/${legalEntityId}`

  return {
    success: function (legalEntity: { id: string; entityAssociations?: object[] }) {
      return stubBuilder('GET', path, 200, {
        response: legalEntity,
      })
    },
  }
}

export function updateLegalEntity(legalEntityId: string) {
  const path = `/lem/v4/legalEntities/${legalEntityId}`

  return {
    success: function (legalEntity: { id: string }) {
      return stubBuilder('PATCH', path, 200, {
        response: legalEntity,
      })
    },
  }
}

export function createTransferInstrument() {
  const path = `/lem/v4/transferInstruments`

  return {
    success: function (transferInstrument: { id: string }) {
      return stubBuilder('POST', path, 200, {
        response: transferInstrument,
      })
    },
  }
}

export function createAccountHolder() {
  const path = `/bcl/v2/accountHolders`

  return {
    success: function (accountHolder: { id: string; legalEntityId: string }) {
      return stubBuilder('POST', path, 200, {
        response: accountHolder,
      })
    },
  }
}

export function createBalanceAccount() {
  const path = `/bcl/v2/balanceAccounts`

  return {
    success: function (balanceAccount: { id: string; accountHolderId: string }) {
      return stubBuilder('POST', path, 200, {
        response: balanceAccount,
      })
    },
  }
}
