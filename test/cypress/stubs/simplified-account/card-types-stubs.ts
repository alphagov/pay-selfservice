import { stubBuilder } from '@test/cypress/stubs/stub-builder'
import cardFixtures from '@test/fixtures/card.fixtures'

export function getAllCardTypes() {
  const path = `/v1/api/card-types`

  return {
    success: function () {
      return stubBuilder('GET', path, 200, {
        response: cardFixtures.validCardTypesResponse(),
      })
    },
  }
}
