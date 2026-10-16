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
