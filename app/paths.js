'use strict'

const path = require('path')

module.exports = {
  transactions: {
    index: '/transactions',
    download: '/transactions/download',
    detail: '/transactions/:chargeId',
    refund: '/transactions/:chargeId/refund'
  },
  credentials: {
    index: '/credentials',
    edit: '/credentials/edit',
    create: '/credentials'
  },
  notificationCredentials: {
    index: '/credentials',
    edit: '/notification-credentials/edit',
    update: '/notification-credentials'
  },
  user: {
    logIn: '/login',
    profile: '/my-profile',
    twoFactorAuth: {
      index: '/my-profile/two-factor-auth',
      configure: '/my-profile/two-factor-auth/configure',
      resend: '/my-profile/two-factor-auth/resend'
    },
    otpLogIn: '/otp-login',
    otpSendAgain: '/otp-send-again',
    logOut: '/logout',
    callback: '/callback',
    noAccess: '/noaccess',
    forgottenPassword: '/reset-password',
    passwordRequested: '/reset-password-requested',
    forgottenPasswordReset: '/reset-password/:id'
  },
  dashboard: {
    index: '/'
  },
  apiKeys: {
    index: '/api-keys',
    revoked: '/api-keys/revoked',
    create: '/api-keys/create',
    revoke: '/api-keys/revoke',
    update: '/api-keys/update'
  },
  paymentTypes: {
    selectType: '/card-types/manage-type',
    selectBrand: '/card-types/manage-brand',
    summary: '/card-types/summary'
  },
  emailNotifications: {
    index: '/email-notifications',
    edit: '/email-notifications/edit',
    confirm: '/email-notifications/confirm',
    update: '/email-notifications/update',
    off: '/email-notifications/off',
    offConfirm: '/email-notifications/off-confirm',
    on: '/email-notifications/on'
  },
  serviceSwitcher: {
    index: '/my-services',
    switch: '/my-services/switch',
    create: '/my-services/create'
  },
  editServiceName: {
    index: '/service/:externalServiceId/edit-name',
    update: '/service/:externalServiceId/edit-name'
  },
  merchantDetails: {
    index: '/organisation-details/:externalServiceId',
    edit: '/organisation-details/edit/:externalServiceId'
  },
  teamMembers: {
    index: '/service/:externalServiceId',
    show: '/service/:externalServiceId/team-member/:externalUserId',
    delete: '/service/:externalServiceId/team-member/:externalUserId/delete',
    permissions: '/service/:externalServiceId/team-member/:externalUserId/permissions',
    invite: '/service/:externalServiceId/team-members/invite'
  },
  inviteValidation: {
    validateInvite: '/invites/:code'
  },
  registerUser: {
    registration: '/register',
    subscribeService: '/subscribe',
    otpVerify: '/verify-otp',
    reVerifyPhone: '/re-verify-phone',
    logUserIn: '/proceed-to-login'
  },
  selfCreateService: {
    register: '/create-service/register',
    confirm: '/create-service/confirm',
    otpVerify: '/create-service/verify-otp',
    otpResend: '/create-service/resend-otp',
    logUserIn: '/create-service/proceed-to-login',
    serviceNaming: '/service/set-name'
  },
  toggle3ds: {
    index: '/3ds',
    onConfirm: '/3ds/confirm',
    on: '/3ds/on',
    off: '/3ds/off'
  },
  healthcheck: {
    path: '/healthcheck'
  },
  staticPaths: {
    naxsiError: '/request-denied'
  },
  prototyping: {
    demoService: {
      index: '/test-with-your-users',
      links: '/test-with-your-users/links',
      create: '/test-with-your-users/create',
      confirm: '/test-with-your-users/confirm',
      disable: '/test-with-your-users/links/disable/:productExternalId'
    },
    demoPayment: {
      index: '/make-a-demo-payment',
      editDescription: '/make-a-demo-payment/edit-description',
      editAmount: '/make-a-demo-payment/edit-amount',
      mockCardDetails: '/make-a-demo-payment/mock-card-numbers',
      goToPaymentScreens: '/make-a-demo-payment/go-to-payment'
    }
  },
  paymentLinks: {
    start: '/create-payment-link',
    information: '/create-payment-link/information',
    webAddress: '/create-payment-link/web-address',
    reference: '/create-payment-link/reference',
    amount: '/create-payment-link/amount',
    review: '/create-payment-link/review',
    manage: '/create-payment-link/manage',
    disable: '/create-payment-link/manage/disable/:productExternalId',
    delete: '/create-payment-link/manage/delete/:productExternalId',
    edit: '/create-payment-link/manage/edit/:productExternalId',
    editInformation: '/create-payment-link/manage/edit/information/:productExternalId',
    editAmount: '/create-payment-link/manage/edit/amount/:productExternalId'
  },
  feedback: '/feedback',
  gocardless: {
    linkAccount: '/link-account',
    oauthComplete: '/oauth/complete'
  },
  generateRoute: require(path.join(__dirname, '/utils/generate_route.js'))
}
