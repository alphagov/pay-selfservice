'use strict'

const generateRoute = require('./utils/generate-route')
const formattedPathFor = require('./utils/replace-params-in-path')

const keys = {
  ENVIRONMENT_ID: 'environmentId',
  SERVICE_EXTERNAL_ID: 'serviceExternalId',
  GATEWAY_ACCOUNT_EXTERNAL_ID: 'gatewayAccountExternalId'
}

module.exports = {
  keys,
  account: {
    root: `/account/:${keys.GATEWAY_ACCOUNT_EXTERNAL_ID}`,
    apiKeys: {
      index: '/api-keys',
      revoked: '/api-keys/revoked',
      create: '/api-keys/create',
      revoke: '/api-keys/revoke',
      update: '/api-keys/update'
    },
    credentials: {
      index: '/your-psp/:credentialId/credentials',
      edit: '/your-psp/:credentialId/credentials/edit'
    },
    dashboard: {
      index: '/dashboard'
    },
    defaultBillingAddressCountry: {
      index: '/default-billing-address-country'
    },
    digitalWallet: {
      applePay: '/digital-wallet/apple-pay',
      googlePay: '/digital-wallet/google-pay'
    },
    emailNotifications: {
      index: '/email-notifications',
      indexRefundTabEnabled: '/email-notifications-refund',
      edit: '/email-notifications/edit',
      confirm: '/email-notifications/confirm',
      update: '/email-notifications/update',
      off: '/email-notifications/off',
      collection: '/email-settings-collection',
      confirmation: '/email-settings-confirmation',
      refund: '/email-settings-refund'
    },
    kyc: {
      organisationUrl: '/kyc/:credentialId/organisation-url',
      governmentEntityDocument: '/kyc/:credentialId/government-entity-document'
    },
    notificationCredentials: {
      edit: '/your-psp/:credentialId/notification-credentials/edit',
      update: '/your-psp/:credentialId/notification-credentials'
    },
    paymentLinks: {
      start: '/create-payment-link',
      information: '/create-payment-link/information',
      webAddress: '/create-payment-link/web-address',
      reference: '/create-payment-link/reference',
      amount: '/create-payment-link/amount',
      review: '/create-payment-link/review',
      addMetadata: '/create-payment-link/add-reporting-column',
      editMetadata: '/create-payment-link/add-reporting-column/:metadataKey',
      deleteMetadata: '/create-payment-link/add-reporting-column/:metadataKey/delete',
      manage: {
        index: '/create-payment-link/manage',
        edit: '/create-payment-link/manage/edit/:productExternalId',
        disable: '/create-payment-link/manage/disable/:productExternalId',
        delete: '/create-payment-link/manage/delete/:productExternalId',
        editInformation: '/create-payment-link/manage/edit/information/:productExternalId',
        editReference: '/create-payment-link/manage/edit/reference/:productExternalId',
        editAmount: '/create-payment-link/manage/edit/amount/:productExternalId',
        addMetadata: '/create-payment-link/manage/:productExternalId/add-reporting-column',
        editMetadata: '/create-payment-link/manage/:productExternalId/add-reporting-column/:metadataKey',
        deleteMetadata: '/create-payment-link/manage/:productExternalId/add-reporting-column/:metadataKey/delete'
      }
    },
    paymentTypes: {
      index: '/payment-types'
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
        goToPaymentScreens: '/make-a-demo-payment/go-to-payment',
        goToTransaction: '/make-a-demo-payment/:productExternalId/go-to-transactions'
      }
    },
    settings: {
      index: '/settings'
    },
    stripe: {
      addPspAccountDetails: '/stripe/add-psp-account-details'
    },
    switchPSP: {
      index: '/switch-psp',
      flex: '/switch-psp/:credentialId/flex',
      credentialsWithGatewayCheck: '/switch-psp/:credentialId/credentials-with-gateway-check',
      verifyPSPIntegrationPayment: '/switch-psp/verify-psp-integration',
      receiveVerifyPSPIntegrationPayment: '/switch-psp/verify-psp-integration/callback',
      organisationUrl: '/switch-psp/:credentialId/organisation-url',
      stripeSetup: {
        bankDetails: '/switch-psp/:credentialId/bank-details',
        responsiblePerson: '/switch-psp/:credentialId/responsible-person',
        vatNumber: '/switch-psp/:credentialId/vat-number',
        companyNumber: '/switch-psp/:credentialId/company-number',
        director: '/switch-psp/:credentialId/director',
        checkOrgDetails: '/switch-psp/:credentialId/check-organisation-details',
        updateOrgDetails: '/switch-psp/:credentialId/update-organisation-details',
        governmentEntityDocument: '/switch-psp/:credentialId/government-entity-document'
      }
    },
    toggleBillingAddress: {
      index: '/billing-address'
    },
    toggleMotoMaskCardNumberAndSecurityCode: {
      cardNumber: '/moto-hide-card-number',
      securityCode: '/moto-hide-security-code'
    },
    transactions: {
      index: '/transactions',
      download: '/transactions/download',
      detail: '/transactions/:chargeId',
      refund: '/transactions/:chargeId/refund'
    },
    yourPsp: {
      index: '/your-psp/:credentialId',
      flex: '/your-psp/:credentialId/flex',
      worldpay3dsFlex: '/your-psp/:credentialId/worldpay-3ds-flex',
      credentialsWithGatewayCheck: '/your-psp/:credentialId/credentials-with-gateway-check',
      stripeSetup: {
        bankDetails: '/your-psp/:credentialId/bank-details',
        responsiblePerson: '/your-psp/:credentialId/responsible-person',
        vatNumber: '/your-psp/:credentialId/vat-number',
        companyNumber: '/your-psp/:credentialId/company-number',
        governmentEntityDocument: '/your-psp/:credentialId/government-entity-document',
        director: '/your-psp/:credentialId/director',
        checkOrgDetails: '/your-psp/:credentialId/check-organisation-details',
        updateOrgDetails: '/your-psp/:credentialId/update-organisation-details'
      }
    }
  },
  futureAccountStrategy: {
    // remove account when hybrid gateway account root no longer required
    // `/:${keys.ENVIRONMENT_ID}(test|live)/service/:${keys.SERVICE_EXTERNAL_ID}`,
    root: `/:${keys.ENVIRONMENT_ID}(test|live)/service/:${keys.SERVICE_EXTERNAL_ID}/account/:${keys.GATEWAY_ACCOUNT_EXTERNAL_ID}`,
    webhooks: {
      index: '/webhooks',
      detail: '/webhooks/:webhookId',
      update: '/webhooks/:webhookId/update',
      signingSecret: '/webhooks/:webhookId/signing-secret',
      toggleActive: '/webhooks/:webhookId/status',
      message: '/webhooks/:webhookId/message/:messageId',
      resendMessage: '/webhooks/:webhookId/message/:messageId/resend',
      create: '/webhooks/create'
    },
    agreements: {
      index: '/agreements',
      detail: '/agreements/:agreementId'
    }
  },
  service: {
    root: `/service/:${keys.SERVICE_EXTERNAL_ID}`,
    editServiceName: {
      index: '/edit-name',
      update: '/edit-name'
    },
    organisationDetails: {
      index: '/organisation-details',
      edit: '/organisation-details/edit'
    },
    redirects: {
      stripeSetupLiveDashboardRedirect: '/dashboard/live'
    },
    requestPspTestAccount: '/request-stripe-test-account',
    requestToGoLive: {
      index: '/request-to-go-live',
      organisationName: '/request-to-go-live/organisation-name',
      organisationAddress: '/request-to-go-live/organisation-address',
      chooseHowToProcessPayments: '/request-to-go-live/choose-how-to-process-payments',
      chooseTakesPaymentsOverPhone: '/request-to-go-live/choose-takes-payments-over-phone',
      agreement: '/request-to-go-live/agreement'
    },
    teamMembers: {
      index: '/team-members',
      show: '/team-member/:externalUserId',
      delete: '/team-member/:externalUserId/delete',
      permissions: '/team-member/:externalUserId/permissions',
      invite: '/team-members/invite'
    }
  },
  index: '/',
  allServiceTransactions: {
    index: '/all-service-transactions',
    indexStatusFilter: '/all-service-transactions/:statusFilter(test|live)',
    download: '/all-service-transactions/download',
    downloadStatusFilter: '/all-service-transactions/download/:statusFilter(test|live)',
    redirectDetail: '/redirect/transactions/:chargeId'
  },
  user: {
    logIn: '/login',
    otpLogIn: '/otp-login',
    otpSendAgain: '/otp-send-again',
    logOut: '/logout',
    callback: '/callback',
    noAccess: '/noaccess',
    forgottenPassword: '/reset-password',
    passwordRequested: '/reset-password-requested',
    forgottenPasswordReset: '/reset-password/:id',
    profile: {
      index: '/my-profile',
      phoneNumber: '/my-profile/phone-number',
      twoFactorAuth: {
        index: '/my-profile/two-factor-auth',
        phoneNumber: '/my-profile/two-factor-auth/phone-number',
        configure: '/my-profile/two-factor-auth/configure',
        resend: '/my-profile/two-factor-auth/resend'
      }
    }
  },
  serviceSwitcher: {
    index: '/my-services',
    switch: '/my-services/switch',
    create: '/my-services/create'
  },
  invite: {
    validateInvite: '/invites/:code',
    subscribeService: '/subscribe'
  },
  register: {
    email: '/register/email-address',
    checkEmail: '/register/check-email',
    password: '/register/password',
    securityCodes: '/register/get-security-codes',
    authenticatorApp: '/register/authenticator-app',
    phoneNumber: '/register/phone-number',
    smsCode: '/register/sms-code',
    resendCode: '/register/resend-code',
    success: '/register/success'
  },
  healthcheck: {
    path: '/healthcheck'
  },
  staticPaths: {
    naxsiError: '/request-denied'
  },
  feedback: '/feedback',
  generateRoute: generateRoute,
  formattedPathFor: formattedPathFor,
  policyPage: '/policy/:key',
  payouts: {
    list: '/payments-to-your-bank-account',
    listStatusFilter: '/payments-to-your-bank-account/:statusFilter(test|live)'
  },
  privacy: '/privacy',
  demoPaymentFwd: {
    goToTransaction: '/make-a-demo-payment/:productExternalId/go-to-transactions'
  }
}
