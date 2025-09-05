import { BaseClient } from '@services/clients/base/Client.class'
import UserData from '@models/user/dto/User.dto'
import User from '@models/user/User.class'

const SERVICE_NAME = 'adminusers'
const SERVICE_BASE_URL = process.env.ADMINUSERS_URL!

class AdminUsersClient extends BaseClient {
  public users
  constructor() {
    super(SERVICE_BASE_URL, SERVICE_NAME)
    this.users = this.usersClient
  }

  private get usersClient() {
    return {
      getByExternalId: async (externalId: string) => {
        const path = '/v1/api/users/{externalId}'
          .replace('{externalId}', encodeURIComponent(externalId))
        const response = await this.get<UserData>(path, 'get a product')
        return new User(response.data)
      }
    }
  }
}

export default AdminUsersClient
