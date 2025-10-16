import { BaseClient } from '@services/clients/base/Client.class'
import UserData from '@models/user/dto/User.dto'
import User from '@models/user/User.class'
import { ForgottenPasswordData } from '@models/user/dto/ForgottenPassword.dto'
import { ForgottenPassword } from '@models/user/ForgottenPassword.class'
import { UpdateUserRequestData } from '@models/user/dto/UpdateUserRequest.dto'
import { CreateInviteRequest } from '@models/service/CreateInviteRequest.class'
import { CreateInviteRequestData } from '@models/service/dto/CreateInviteRequest.dto'
import { InviteData } from '@models/service/dto/Invite.dto'
import { Invite } from '@models/service/Invite.class'

const SERVICE_NAME = 'adminusers'
const SERVICE_BASE_URL = process.env.ADMINUSERS_URL!
const HEADER_USER_CONTEXT = 'GovUkPay-User-Context'

class AdminUsersClient extends BaseClient {
  public users
  public services
  public invites

  constructor() {
    super(SERVICE_BASE_URL, SERVICE_NAME)
    this.users = this.usersClient
    this.services = this.servicesClient
    this.invites = this.invitesClient
  }

  private get usersClient() {
    return {
      findByExternalId: async (userExternalId: string) => {
        const path = '/v1/api/users/{userExternalId}'.replace('{userExternalId}', encodeURIComponent(userExternalId))
        const response = await this.get<UserData>(path, 'find a user')
        return new User(response.data)
      },

      authenticate: async (email: string, password: string) => {
        const path = '/v1/api/users/authenticate'
        const response = await this.post<{ email: string; password: string }, UserData>(
          path,
          { email, password },
          'find a user'
        )
        return new User(response.data)
      },

      authenticateSecondFactor: async (userExternalId: string, code: string) => {
        const path = '/v1/api/users/{userExternalId}/second-factor/authenticate'.replace(
          '{userExternalId}',
          encodeURIComponent(userExternalId)
        )
        const response = await this.post<{ code: string }, UserData>(
          path,
          { code },
          'authenticate a second factor auth token entered by user'
        )
        return new User(response.data)
      },

      findMultipleByExternalIds: async (userExternalIds: string[]) => {
        const path = '/v1/api/users'
        const response = await this.get<UserData[]>(path, 'find multiple users', {
          params: { ids: userExternalIds },
        })
        return response.data.map((userData) => new User(userData))
      },

      sendOTP: async (userExternalId: string, isProvisional: boolean) => {
        const path = '/v1/api/users/{userExternalId}/second-factor'.replace(
          '{userExternalId}',
          encodeURIComponent(userExternalId)
        )
        await this.post<{ provisional: boolean }, void>(
          path,
          { provisional: isProvisional },
          'post a second factor auth token to the user'
        )
      },

      createForgottenPassword: async (email: string) => {
        const path = '/v1/api/forgotten-passwords'
        await this.post<{ username: string }, void>(path, { username: email }, 'create a forgotten password for a user')
      },

      getForgottenPassword: async (code: string) => {
        const path = '/v1/api/forgotten-passwords/{code}'.replace('{code}', encodeURIComponent(code))
        const response = await this.get<ForgottenPasswordData>(path, 'get a forgotten password')
        return new ForgottenPassword(response.data)
      },

      incrementSessionVersion: async (userExternalId: string) => {
        const path = '/v1/api/users/{userExternalId}'.replace('{userExternalId}', encodeURIComponent(userExternalId))
        const patchRequest = {
          op: 'append',
          path: 'sessionVersion',
          value: 1,
        }
        const response = await this.patch<UpdateUserRequestData, UserData>(
          path,
          patchRequest,
          'increment session version for a user'
        )
        return new User(response.data)
      },

      updatePassword: async (forgottenPasswordCode: string, password: string) => {
        const path = '/v1/api/reset-password'
        await this.post<{ forgotten_password_code: string; new_password: string }, void>(
          path,
          { forgotten_password_code: forgottenPasswordCode, new_password: password },
          'update a password for a user'
        )
      },

      updateServiceRole: async (userExternalId: string, serviceExternalId: string, roleName: string) => {
        const path = '/v1/api/users/{userExternalId}/services/{serviceExternalId}'
          .replace('{userExternalId}', encodeURIComponent(userExternalId))
          .replace('{serviceExternalId}', serviceExternalId)
        const response = await this.put<{ role_name: string }, UserData>(
          path,
          { role_name: roleName },
          'update user role on a service'
        )
        return new User(response.data)
      },

      assignServiceRole: async (userExternalId: string, serviceExternalId: string, roleName: string) => {
        const path = '/v1/api/users/{userExternalId}/services'.replace(
          '{userExternalId}',
          encodeURIComponent(userExternalId)
        )
        const response = await this.post<{ service_external_id: string; role_name: string }, UserData>(
          path,
          { service_external_id: serviceExternalId, role_name: roleName },
          'assign user to new service with role'
        )
        return new User(response.data)
      },

      provisionNewOtpKey: async (userExternalId: string) => {
        const path = '/v1/api/users/{userExternalId}/second-factor/provision'.replace(
          '{userExternalId}',
          encodeURIComponent(userExternalId)
        )
        const response = await this.post<void, UserData>(path, undefined, 'create a new 2FA provisional OTP key')
        return new User(response.data)
      },

      configureNewOtpKey: async (userExternalId: string, code: string, secondFactor: string) => {
        const path = '/v1/api/users/{userExternalId}/second-factor/activate'.replace(
          '{userExternalId}',
          encodeURIComponent(userExternalId)
        )
        await this.post<{ code: string; second_factor: string }, UserData>(
          path,
          {
            code,
            second_factor: secondFactor,
          },
          'configure a new OTP key and method'
        )
      },

      updatePhoneNumber: async (userExternalId: string, phoneNumber: string) => {
        const path = '/v1/api/users/{userExternalId}'.replace('{userExternalId}', encodeURIComponent(userExternalId))
        const patchRequest = {
          op: 'replace',
          path: 'telephone_number',
          value: phoneNumber,
        }
        await this.patch<UpdateUserRequestData, UserData>(path, patchRequest, 'update a phone number for a user')
      },

      updateFeatures: async (userExternalId: string, features: string) => {
        const path = '/v1/api/users/{userExternalId}'.replace('{userExternalId}', encodeURIComponent(userExternalId))
        const patchRequest = {
          op: 'replace',
          path: 'features',
          value: features,
        }
        const response = await this.patch<UpdateUserRequestData, UserData>(
          path,
          patchRequest,
          'update features for a user'
        )
        return new User(response.data)
      },
    }
  }

  private get servicesClient() {
    return {
      getUsers: async (serviceExternalId: string) => {
        const path = '/v1/api/services/{serviceExternalId}/users'.replace(
          '{serviceExternalId}',
          encodeURIComponent(serviceExternalId)
        )
        const response = await this.get<UserData[]>(path, 'get users for a service')
        return response.data.map((userData) => new User(userData))
      },

      deleteUser: async (serviceExternalId: string, userExternalId: string, removerUserExternalId: string) => {
        const path = '/v1/api/services/{serviceExternalId}/users/{userExternalId}'
          .replace('{serviceExternalId}', encodeURIComponent(serviceExternalId))
          .replace('{userExternalId}', encodeURIComponent(userExternalId))

        await this.delete<void>(path, 'delete a user from a service', {
          headers: {
            [HEADER_USER_CONTEXT]: removerUserExternalId,
          },
          data: {
            userDelete: userExternalId,
            userRemover: removerUserExternalId,
          },
        })
      },
    }
  }

  private get invitesClient() {
    return {
      createInviteToJoinService: async (createInviteRequest: CreateInviteRequest) => {
        const path = 'v1/api/invites/create-invite-to-join-service'
        const response = await this.post<CreateInviteRequestData, InviteData>(
          path,
          createInviteRequest.toJson(),
          'invite a user to join a service'
        )
        return new Invite(response.data)
      },

      getInvitedUsers: async (serviceExternalId: string) => {
        const path = 'v1/api/invites'
        const response = await this.get<InviteData[]>(path, 'get invited users for a service', {
          params: {
            serviceId: serviceExternalId,
          },
        })
        return response.data.map((inviteData) => new Invite(inviteData))
      },

      sendOTP: async (inviteCode: string) => {
        const path = '/v1/api/invites/{inviteCode}/second-otp'.replace('{inviteCode}', encodeURIComponent(inviteCode))
        const response = await this.post<void, UserData>(path, undefined, 'find a user')
        return new User(response.data)
      },
    }
  }
}

export default AdminUsersClient
