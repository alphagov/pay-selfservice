import { UserFixture } from '@test/fixtures/user/user.fixture'
import { stubBuilder } from '@test/cypress/stubs/stub-builder'

export function getUser(userExternalId: string) {
  const path = `/v1/api/users/${userExternalId}`

  return {
    success: function (user: UserFixture) {
      return stubBuilder('GET', path, 200, {
        response: user.toUserData(),
      })
    },
  }
}
