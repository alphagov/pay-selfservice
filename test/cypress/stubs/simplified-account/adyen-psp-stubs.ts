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
