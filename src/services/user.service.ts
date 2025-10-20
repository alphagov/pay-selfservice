import AdminUsersClient from '@services/clients/pay/AdminUsersClient.class'
import { CreateInviteRequest } from '@models/service/CreateInviteRequest.class'
const adminUsersClient = new AdminUsersClient()

const authenticate = (email: string, submittedPassword: string) => {
  if (!email || !submittedPassword) {
    return Promise.reject(new Error('Failed to authenticate'))
  }
  return adminUsersClient.users.authenticate(email, submittedPassword)
}

const authenticateSecondFactor = (userExternalId: string, code: string) => {
  if (!userExternalId || !code) {
    return Promise.reject(new Error('Failed to authenticate second factor'))
  }

  return adminUsersClient.users.authenticateSecondFactor(userExternalId, code)
}

const findByExternalId = (userExternalId: string) => {
  return adminUsersClient.users.findByExternalId(userExternalId)
}

const findMultipleByExternalIds = (userExternalIds: string[]) => {
  return adminUsersClient.users.findMultipleByExternalIds(userExternalIds)
}

const sendOTP = (userExternalId: string) => {
  return adminUsersClient.users.sendOTP(userExternalId, false)
}

const sendProvisionalOTP = (userExternalId: string) => {
  return adminUsersClient.users.sendOTP(userExternalId, true)
}

const sendPasswordResetToken = (email: string) => {
  return adminUsersClient.users.createForgottenPassword(email)
}

const findByResetToken = (token: string) => {
  return adminUsersClient.users.getForgottenPassword(token)
}

const logOut = (userExternalId: string) => {
  return adminUsersClient.users.incrementSessionVersion(userExternalId)
}

const getServiceUsers = (serviceExternalId: string) => {
  return adminUsersClient.services.getUsers(serviceExternalId)
}

const updatePassword = (token: string, newPassword: string) => {
  return adminUsersClient.users.updatePassword(token, newPassword)
}

const updateServiceRole = (userExternalId: string, roleName: string, serviceExternalId: string) => {
  return adminUsersClient.users.updateServiceRole(userExternalId, serviceExternalId, roleName)
}

const assignServiceRole = (userExternalId: string, serviceExternalId: string, roleName: string) => {
  return adminUsersClient.users.assignServiceRole(userExternalId, serviceExternalId, roleName)
}

const createInviteToJoinService = (
  inviteeEmailAddress: string,
  senderUserExternalId: string,
  serviceExternalId: string,
  roleName: string
) => {
  return adminUsersClient.invites.createInviteToJoinService(
    new CreateInviteRequest()
      .withInviteeEmailAddress(inviteeEmailAddress)
      .withSenderUserExternalId(senderUserExternalId)
      .withServiceExternalId(serviceExternalId)
      .withRoleName(roleName)
  )
}

const getInvitedUsers = (serviceExternalId: string) => {
  return adminUsersClient.invites.getInvitedUsers(serviceExternalId)
}

const deleteUser = (serviceExternalId: string, removerExternalId: string, userExternalId: string) => {
  return adminUsersClient.services.deleteUser(serviceExternalId, userExternalId, removerExternalId)
}

const provisionNewOtpKey = (userExternalId: string) => {
  return adminUsersClient.users.provisionNewOtpKey(userExternalId)
}

const configureNewOtpKey = (userExternalId: string, code: string, secondFactor: string) => {
  return adminUsersClient.users.configureNewOtpKey(userExternalId, code, secondFactor)
}

const updatePhoneNumber = (userExternalId: string, newPhoneNumber: string) => {
  return adminUsersClient.users.updatePhoneNumber(userExternalId, newPhoneNumber)
}

const updateFeatures = (userExternalId: string, features: string) => {
  return adminUsersClient.users.updateFeatures(userExternalId, features)
}

export = {
  authenticate,
  authenticateSecondFactor,
  findByExternalId,
  findMultipleByExternalIds,
  sendOTP,
  sendProvisionalOTP,
  sendPasswordResetToken,
  findByResetToken,
  logOut,
  getServiceUsers,
  updatePassword,
  updateServiceRole,
  assignServiceRole,
  createInviteToJoinService,
  getInvitedUsers,
  deleteUser,
  provisionNewOtpKey,
  configureNewOtpKey,
  updatePhoneNumber,
  updateFeatures,
}
