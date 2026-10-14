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
