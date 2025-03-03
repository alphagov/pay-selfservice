'use strict'

const generateRoute = require('./utils/generate-route')
const formattedPathFor = require('./utils/replace-params-in-path')

const keys = {
  ENVIRONMENT_ID: 'environmentId',
  SERVICE_EXTERNAL_ID: 'serviceExternalId',
  GATEWAY_ACCOUNT_EXTERNAL_ID: 'gatewayAccountExternalId',
  ACCOUNT_TYPE: 'accountType'
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
      worldpayCredentialsWithGatewayCheck: '/your-psp/:credentialId/credentials-with-gateway-check/:merchantDetailsKey',
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
      detail: '/agreements/:agreementId',
      cancel: '/agreements/:agreementId/cancel'
    }
  },
  simplifiedAccount: {
    root: `/simplified/service/:${keys.SERVICE_EXTERNAL_ID}/account/:${keys.ACCOUNT_TYPE}`,
    settings: {
      index: '/settings',
      serviceName: {
        index: '/settings/service-name',
        edit: '/settings/service-name/edit',
        removeCy: '/settings/service-name/cy/remove'
      },
      emailNotifications: {
        index: '/settings/email-notifications',
        emailCollectionMode: '/settings/email-notifications/email-collection-mode',
        refundEmailToggle: '/settings/email-notifications/refund-email-toggle',
        paymentConfirmationEmailToggle: '/settings/email-notifications/payment-confirmation-email-toggle',
        templates: '/settings/email-notifications/templates',
        customParagraph: '/settings/email-notifications/templates/custom-paragraph',
        removeCustomParagraph: '/settings/email-notifications/templates/custom-paragraph/remove'
      },
      teamMembers: {
        index: '/settings/team-members',
        delete: '/settings/team-members/:externalUserId/delete',
        permission: '/settings/team-members/:externalUserId/permission',
        invite: '/settings/team-members/invite'
      },
      organisationDetails: {
        index: '/settings/organisation-details',
        edit: '/settings/organisation-details/edit'
      },
      stripeDetails: {
        index: '/settings/stripe-details',
        accountDetails: '/settings/stripe-details/account',
        bankDetails: '/settings/stripe-details/bank-details',
        responsiblePerson: {
          index: '/settings/stripe-details/responsible-person',
          homeAddress: '/settings/stripe-details/responsible-person/home-address',
          contactDetails: '/settings/stripe-details/responsible-person/contact-details',
          checkYourAnswers: '/settings/stripe-details/responsible-person/check-your-answers'
        },
        vatNumber: '/settings/stripe-details/vat-number',
        companyNumber: '/settings/stripe-details/company-number',
        director: '/settings/stripe-details/director',
        governmentEntityDocument: '/settings/stripe-details/government-entity-document',
        organisationDetails: {
          index: '/settings/stripe-details/organisation-details/index',
          update: '/settings/stripe-details/organisation-details/update'
        }
      },
      worldpayDetails: {
        index: '/settings/worldpay-details',
        flexCredentials: '/settings/worldpay-details/flex-credentials',
        oneOffCustomerInitiated: '/settings/worldpay-details/one-off-customer-initiated',
        recurringCustomerInitiated: '/settings/worldpay-details/recurring-customer-initiated',
        recurringMerchantInitiated: '/settings/worldpay-details/recurring-merchant-initiated'
      },
      cardPayments: {
        index: '/settings/card-payments',
        collectBillingAddress: '/settings/card-payments/collect-billing-address',
        defaultBillingAddressCountry: '/settings/card-payments/default-billing-address-country',
        applePay: '/settings/card-payments/apple-pay',
        googlePay: '/settings/card-payments/google-pay'
      },
      cardTypes: {
        index: '/settings/card-types'
      },
      apiKeys: {
        index: '/settings/api-keys',
        create: '/settings/api-keys/create',
        changeName: '/settings/api-keys/change-name/:tokenLink',
        revoke: '/settings/api-keys/revoke/:tokenLink',
        revokedKeys: '/settings/api-keys/revoked'
      },
      webhooks: {
        index: '/settings/webhooks',
        create: '/settings/webhooks/create',
        detail: '/settings/webhooks/:webhookExternalId',
        update: '/settings/webhooks/:webhookExternalId/update',
        toggle: '/settings/webhooks/:webhookExternalId/toggle',
        event: '/settings/webhooks/:webhookExternalId/event/:eventId'
      },
      switchPsp: {
        switchToWorldpay: {
          index: '/settings/switch-psp/switch-to-worldpay',
          oneOffCustomerInitiated: '/settings/switch-psp/switch-to-worldpay/worldpay-details/one-off-customer-initiated',
          flexCredentials: '/settings/switch-psp/switch-to-worldpay/worldpay-details/flex-credentials',
          makeTestPayment: {
            outbound: '/settings/switch-psp/switch-to-worldpay/worldpay-details/make-a-payment',
            inbound: '/settings/switch-psp/switch-to-worldpay/worldpay-details/make-a-payment/verify'
          }
        }
      }
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
  services: {
    index: '/my-services',
    create: {
      index: '/services/create',
      selectOrgType: '/services/create/select-org-type'
    }
  },
  index: '/',
  allServiceTransactions: {
    index: '/all-service-transactions',
    indexStatusFilter: '/all-service-transactions/:statusFilter(test|live)',
    indexStatusFilterWithoutSearch: '/all-service-transactions/nosearch/:statusFilter(test|live)',
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
      degateway: '/my-profile/degateway',
      twoFactorAuth: {
        index: '/my-profile/two-factor-auth',
        phoneNumber: '/my-profile/two-factor-auth/phone-number',
        configure: '/my-profile/two-factor-auth/configure',
        resend: '/my-profile/two-factor-auth/resend'
      }
    }
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
  generateRoute,
  formattedPathFor,
  stripeTermsAndConditions: '/policy/stripe-terms-and-conditions',
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
