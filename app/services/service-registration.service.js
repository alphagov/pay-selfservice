'use strict'

const getAdminUsersClient = require('./clients/adminusers.client')

const adminUsersClient = getAdminUsersClient()

function submitRegistration (email, phoneNumber, password) {
  return adminUsersClient.submitServiceRegistration(email, phoneNumber, password)
}

function submitServiceInviteOtpCode (code, otpCode) {
  return adminUsersClient.verifyOtpForInvite(code, otpCode)
}

async function completeInvite (inviteCode) {
  const completeInviteResponse = await adminUsersClient.completeInvite(inviteCode)
  return completeInviteResponse.user_external_id
}

function generateServiceInviteOtpCode (inviteCode) {
  return adminUsersClient.generateInviteOtpCode(inviteCode, null, null)
}

function resendOtpCode (code, phoneNumber) {
  return adminUsersClient.resendOtpCode(code, phoneNumber)
}

module.exports = {
  submitRegistration,
  submitServiceInviteOtpCode,
  completeInvite,
  generateServiceInviteOtpCode,
  resendOtpCode
}
