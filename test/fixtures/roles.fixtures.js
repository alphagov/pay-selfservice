module.exports = {
  'view-only': {
    name: 'view-only',
    description: 'View only',
    permissions: [
      {
        name: 'toggle-billing-address:read',
        description: 'View Billing Address setting'
      },
      {
        name: 'transactions-description:read',
        description: 'Viewtransactiondescription'
      },
      {
        name: 'transactions-by-fields:read',
        description: 'Searchtransactionsbypaymentfields'
      },
      {
        name: 'service-name:read',
        description: 'Viewservicename'
      },
      {
        name: 'moto-mask-input:read',
        description: 'View MOTO mask input settings'
      },
      {
        name: 'payouts:read',
        description: 'View Payouts'
      },
      {
        name: 'transactions-email:read',
        description: 'Viewtransactionemail'
      },
      {
        name: 'transactions-by-date:read',
        description: 'Searchtransactionsbydate'
      },
      {
        name: 'toggle-3ds:read',
        description: 'View 3D Secure setting'
      },
      {
        name: 'agreements:read',
        description: 'View agreements'
      },
      {
        name: 'transactions-details:read',
        description: 'Viewtransactiondetails'
      },
      {
        name: 'email-notification-template:read',
        description: 'Viewemailnotificationstemplate'
      },
      {
        name: 'transactions:read',
        description: 'Viewtransactionslist'
      },
      {
        name: 'transactions-download:read',
        description: 'Downloadtransactions'
      },
      {
        name: 'transactions-events:read',
        description: 'Viewtransactionevents'
      },
      {
        name: 'transactions-amount:read',
        description: 'Viewtransactionamounts'
      },
      {
        name: 'transactions-card-type:read',
        description: 'Viewtransactioncardtype'
      },
      {
        name: 'payment-types:read',
        description: 'Viewpaymenttypes'
      }
    ]
  },
  'super-admin': {
    name: 'super-admin',
    description: 'Super Admin',
    permissions: [
      {
        name: 'connected-gocardless-account:update',
        description: 'Update Connected Go Cardless Account'
      },
      {
        name: 'webhooks:read',
        description: 'View webhooks'
      },
      {
        name: 'tokens-revoked:read',
        description: 'Viewrevokedkeys'
      },
      {
        name: 'agreements:read',
        description: 'View agreements'
      },
      {
        name: 'transactions-details:read',
        description: 'Viewtransactiondetails'
      },
      {
        name: 'tokens:read',
        description: 'View keys'
      },
      {
        name: 'stripe-government-entity-document:update',
        description: 'Stripe - Upload government entity document '
      },
      {
        name: 'email-notification-toggle:update',
        description: 'Turnemailnotificationson/off'
      },
      {
        name: 'gateway-credentials:read',
        description: 'Viewgatewayaccountcredentials'
      },
      {
        name: 'email-notification-template:read',
        description: 'Viewemailnotificationstemplate'
      },
      {
        name: 'toggle-billing-address:read',
        description: 'View Billing Address setting'
      },
      {
        name: 'transactions-download:read',
        description: 'Downloadtransactions'
      },
      {
        name: 'service-name:read',
        description: 'Viewservicename'
      },
      {
        name: 'moto-mask-input:update',
        description: 'Update MOTO mask input settings'
      },
      {
        name: 'transactions-by-date:read',
        description: 'Searchtransactionsbydate'
      },
      {
        name: 'transactions-events:read',
        description: 'Viewtransactionevents'
      },
      {
        name: 'agreements:update',
        description: 'Update agreements'
      },
      {
        name: 'tokens-active:read',
        description: 'Viewactivekeys'
      },
      {
        name: 'webhooks:update',
        description: 'Update webhooks'
      },
      {
        name: 'transactions-card-type:read',
        description: 'Viewtransactioncardtype'
      },
      {
        name: 'stripe-director:read',
        description: 'View Stripe director'
      },
      {
        name: 'users-global:create',
        description: 'Createuserinanyservice'
      },
      {
        name: 'merchant-details:read',
        description: 'View Merchant Details setting'
      },
      {
        name: 'stripe-organisation-details:read',
        description: 'View Organisation details on Stripe'
      },
      {
        name: 'users-service:read',
        description: 'Viewusersinservice'
      },
      {
        name: 'toggle-3ds:read',
        description: 'View 3D Secure setting'
      },
      {
        name: 'stripe-organisation-details:update',
        description: 'Update Organisation details on Stripe'
      },
      {
        name: 'payouts:read',
        description: 'View Payouts'
      },
      {
        name: 'gateway-credentials:update',
        description: 'Editgatewayaccountcredentials'
      },
      {
        name: 'moto-mask-input:read',
        description: 'View MOTO mask input settings'
      },
      {
        name: 'psp-test-account-stage:update',
        description: 'Update PSP Test Account stage'
      },
      {
        name: 'payment-types:update',
        description: 'Editpaymenttypes'
      },
      {
        name: 'users-service:create',
        description: 'Createuserinthisservice'
      },
      {
        name: 'stripe-bank-details:update',
        description: 'Update Stripe bank details'
      },
      {
        name: 'tokens:delete',
        description: 'Revokekey'
      },
      {
        name: 'transactions-by-fields:read',
        description: 'Searchtransactionsbypaymentfields'
      },
      {
        name: 'stripe-vat-number-company-number:update',
        description: 'Update Stripe vat number company number'
      },
      {
        name: 'go-live-stage:update',
        description: 'Update Go Live stage'
      },
      {
        name: 'transactions-amount:read',
        description: 'Viewtransactionamounts'
      },
      {
        name: 'stripe-responsible-person:read',
        description: 'View Stripe responsible person'
      },
      {
        name: 'users-service:delete',
        description: 'Remove user from a service'
      },
      {
        name: 'merchant-details:update',
        description: 'Edit Merchant Details setting'
      },
      {
        name: 'payment-types:read',
        description: 'Viewpaymenttypes'
      },
      {
        name: 'go-live-stage:read',
        description: 'View Go Live stage'
      },
      {
        name: 'stripe-director:update',
        description: 'Update Stripe director'
      },
      {
        name: 'transactions:read',
        description: 'Viewtransactionslist'
      },
      {
        name: 'stripe-account-details:update',
        description: 'UpdateStripeAccountDetails'
      },
      {
        name: 'connected-gocardless-account:read',
        description: 'View Connected Go Cardless Account'
      },
      {
        name: 'stripe-bank-details:read',
        description: 'View Stripe bank details'
      },
      {
        name: 'stripe-responsible-person:update',
        description: 'Update Stripe responsible person'
      },
      {
        name: 'stripe-vat-number-company-number:read',
        description: 'View Stripe vat number company number'
      }
    ]
  },
  admin: {
    name: 'admin',
    description: 'Administrator',
    permissions: [
      {
        name: 'psp-test-account-stage:update',
        description: 'Update PSP Test Account stage'
      },
      {
        name: 'tokens:create',
        description: 'Generatekey'
      },
      {
        name: 'stripe-responsible-person:read',
        description: 'View Stripe responsible person'
      },
      {
        name: 'agent-initiated-moto:create',
        description: 'Create payment from agent-initiated MOTO product'
      },
      {
        name: 'transactions-by-date:read',
        description: 'Searchtransactionsbydate'
      },
      {
        name: 'transactions-download:read',
        description: 'Downloadtransactions'
      },
      {
        name: 'merchant-details:read',
        description: 'View Merchant Details setting'
      },
      {
        name: 'toggle-billing-address:update',
        description: 'Edit Billing Address setting'
      },
      {
        name: 'toggle-3ds:update',
        description: 'Edit 3D Secure setting'
      },
      {
        name: 'moto-mask-input:update',
        description: 'Update MOTO mask input settings'
      },
      {
        name: 'stripe-government-entity-document:update',
        description: 'Stripe - Upload government entity document '
      },
      {
        name: 'transactions-description:read',
        description: 'Viewtransactiondescription'
      },
      {
        name: 'email-notification-template:read',
        description: 'Viewemailnotificationstemplate'
      },
      {
        name: 'users-service:delete',
        description: 'Remove user from a service'
      },
      {
        name: 'payouts:read',
        description: 'View Payouts'
      },
      {
        name: 'connected-gocardless-account:read',
        description: 'View Connected Go Cardless Account'
      },
      {
        name: 'tokens:update',
        description: 'Generatekey'
      },
      {
        name: 'tokens:delete',
        description: 'Revokekey'
      },
      {
        name: 'transactions-events:read',
        description: 'Viewtransactionevents'
      },
      {
        name: 'refunds:create',
        description: 'Issuerefund'
      },
      {
        name: 'tokens:read',
        description: 'View keys'
      },
      {
        name: 'transactions:read',
        description: 'Viewtransactionslist'
      },
      {
        name: 'stripe-director:update',
        description: 'Update Stripe director'
      },
      {
        name: 'agreements:update',
        description: 'Update agreements'
      },
      {
        name: 'stripe-account-details:update',
        description: 'UpdateStripeAccountDetails'
      },
      {
        name: 'transactions-by-fields:read',
        description: 'Searchtransactionsbypaymentfields'
      },
      {
        name: 'transactions-card-type:read',
        description: 'Viewtransactioncardtype'
      },
      {
        name: 'email-notification-toggle:update',
        description: 'Turnemailnotificationson/off'
      },
      {
        name: 'connected-gocardless-account:update',
        description: 'Update Connected Go Cardless Account'
      },
      {
        name: 'tokens-revoked:read',
        description: 'Viewrevokedkeys'
      },
      {
        name: 'webhooks:update',
        description: 'Update webhooks'
      },
      {
        name: 'gateway-credentials:read',
        description: 'Viewgatewayaccountcredentials'
      },
      {
        name: 'toggle-3ds:read',
        description: 'View 3D Secure setting'
      },
      {
        name: 'email-notification-paragraph:update',
        description: 'Editemailnotificationsparagraph'
      },
      {
        name: 'go-live-stage:read',
        description: 'View Go Live stage'
      },
      {
        name: 'stripe-bank-details:update',
        description: 'Update Stripe bank details'
      },
      {
        name: 'stripe-director:read',
        description: 'View Stripe director'
      },
      {
        name: 'stripe-vat-number-company-number:read',
        description: 'View Stripe vat number company number'
      },
      {
        name: 'payment-types:read',
        description: 'Viewpaymenttypes'
      },
      {
        name: 'service-name:read',
        description: 'Viewservicename'
      },
      {
        name: 'merchant-details:update',
        description: 'Edit Merchant Details setting'
      },
      {
        name: 'stripe-bank-details:read',
        description: 'View Stripe bank details'
      },
      {
        name: 'transactions-amount:read',
        description: 'Viewtransactionamounts'
      },
      {
        name: 'tokens-active:read',
        description: 'Viewactivekeys'
      },
      {
        name: 'users-service:read',
        description: 'Viewusersinservice'
      },
      {
        name: 'go-live-stage:update',
        description: 'Update Go Live stage'
      },
      {
        name: 'moto-mask-input:read',
        description: 'View MOTO mask input settings'
      },
      {
        name: 'transactions-email:read',
        description: 'Viewtransactionemail'
      },
      {
        name: 'gateway-credentials:update',
        description: 'Editgatewayaccountcredentials'
      },
      {
        name: 'payment-types:update',
        description: 'Editpaymenttypes'
      },
      {
        name: 'users-service:create',
        description: 'Createuserinthisservice'
      },
      {
        name: 'service-name:update',
        description: 'Editservicename'
      },
      {
        name: 'stripe-responsible-person:update',
        description: 'Update Stripe responsible person'
      },
      {
        name: 'toggle-billing-address:read',
        description: 'View Billing Address setting'
      },
      {
        name: 'stripe-organisation-details:update',
        description: 'Update Organisation details on Stripe'
      },
      {
        name: 'stripe-vat-number-company-number:update',
        description: 'Update Stripe vat number company number'
      },
      {
        name: 'agreements:read',
        description: 'View agreements'
      },
      {
        name: 'transactions-details:read',
        description: 'Viewtransactiondetails'
      },
      {
        name: 'stripe-organisation-details:read',
        description: 'View Organisation details on Stripe'
      },
      {
        name: 'webhooks:read',
        description: 'View webhooks'
      }
    ]
  },
  'view-and-refund': {
    name: 'view-and-refund',
    description: 'View and Refund',
    permissions: [
      {
        name: 'transactions-card-type:read',
        description: 'Viewtransactioncardtype'
      },
      {
        name: 'transactions-amount:read',
        description: 'Viewtransactionamounts'
      },
      {
        name: 'payouts:read',
        description: 'View Payouts'
      },
      {
        name: 'transactions-download:read',
        description: 'Downloadtransactions'
      },
      {
        name: 'email-notification-template:read',
        description: 'Viewemailnotificationstemplate'
      },
      {
        name: 'transactions-by-fields:read',
        description: 'Searchtransactionsbypaymentfields'
      },
      {
        name: 'service-name:read',
        description: 'Viewservicename'
      },
      {
        name: 'transactions-description:read',
        description: 'Viewtransactiondescription'
      },
      {
        name: 'transactions-details:read',
        description: 'Viewtransactiondetails'
      },
      {
        name: 'payment-types:read',
        description: 'Viewpaymenttypes'
      },
      {
        name: 'transactions-by-date:read',
        description: 'Searchtransactionsbydate'
      },
      {
        name: 'toggle-3ds:read',
        description: 'View 3D Secure setting'
      },
      {
        name: 'transactions-events:read',
        description: 'Viewtransactionevents'
      },
      {
        name: 'toggle-billing-address:read',
        description: 'View Billing Address setting'
      },
      {
        name: 'agreements:read',
        description: 'View agreements'
      },
      {
        name: 'transactions:read',
        description: 'Viewtransactionslist'
      },
      {
        name: 'transactions-email:read',
        description: 'Viewtransactionemail'
      },
      {
        name: 'refunds:create',
        description: 'Issuerefund'
      },
      {
        name: 'moto-mask-input:read',
        description: 'View MOTO mask input settings'
      }
    ]
  },
  'view-and-initiate-moto': {
    name: 'view-and-initiate-moto',
    description: 'View and create MOTO payments',
    permissions: [
      {
        name: 'transactions-card-type:read',
        description: 'Viewtransactioncardtype'
      },
      {
        name: 'transactions-amount:read',
        description: 'Viewtransactionamounts'
      },
      {
        name: 'payouts:read',
        description: 'View Payouts'
      },
      {
        name: 'transactions-download:read',
        description: 'Downloadtransactions'
      },
      {
        name: 'email-notification-template:read',
        description: 'Viewemailnotificationstemplate'
      },
      {
        name: 'transactions-by-fields:read',
        description: 'Searchtransactionsbypaymentfields'
      },
      {
        name: 'service-name:read',
        description: 'Viewservicename'
      },
      {
        name: 'transactions-description:read',
        description: 'Viewtransactiondescription'
      },
      {
        name: 'agent-initiated-moto:create',
        description: 'Create payment from agent-initiated MOTO product'
      },
      {
        name: 'transactions-details:read',
        description: 'Viewtransactiondetails'
      },
      {
        name: 'payment-types:read',
        description: 'Viewpaymenttypes'
      },
      {
        name: 'transactions-by-date:read',
        description: 'Searchtransactionsbydate'
      },
      {
        name: 'toggle-3ds:read',
        description: 'View 3D Secure setting'
      },
      {
        name: 'transactions-events:read',
        description: 'Viewtransactionevents'
      },
      {
        name: 'toggle-billing-address:read',
        description: 'View Billing Address setting'
      },
      {
        name: 'agreements:read',
        description: 'View agreements'
      },
      {
        name: 'transactions:read',
        description: 'Viewtransactionslist'
      },
      {
        name: 'transactions-email:read',
        description: 'Viewtransactionemail'
      },
      {
        name: 'moto-mask-input:read',
        description: 'View MOTO mask input settings'
      }
    ]
  },
  'view-refund-and-initiate-moto': {
    name: 'view-refund-and-initiate-moto',
    description: 'View, refund and create MOTO payments',
    permissions: [
      {
        name: 'email-notification-template:read',
        description: 'Viewemailnotificationstemplate'
      },
      {
        name: 'toggle-billing-address:read',
        description: 'View Billing Address setting'
      },
      {
        name: 'payouts:read',
        description: 'View Payouts'
      },
      {
        name: 'transactions-events:read',
        description: 'Viewtransactionevents'
      },
      {
        name: 'payment-types:read',
        description: 'Viewpaymenttypes'
      },
      {
        name: 'service-name:read',
        description: 'Viewservicename'
      },
      {
        name: 'transactions-by-fields:read',
        description: 'Searchtransactionsbypaymentfields'
      },
      {
        name: 'transactions:read',
        description: 'Viewtransactionslist'
      },
      {
        name: 'agreements:read',
        description: 'View agreements'
      },
      {
        name: 'transactions-details:read',
        description: 'Viewtransactiondetails'
      },
      {
        name: 'refunds:create',
        description: 'Issuerefund'
      },
      {
        name: 'transactions-amount:read',
        description: 'Viewtransactionamounts'
      },
      {
        name: 'agent-initiated-moto:create',
        description: 'Create payment from agent-initiated MOTO product'
      },
      {
        name: 'transactions-card-type:read',
        description: 'Viewtransactioncardtype'
      },
      {
        name: 'moto-mask-input:read',
        description: 'View MOTO mask input settings'
      },
      {
        name: 'transactions-download:read',
        description: 'Downloadtransactions'
      },
      {
        name: 'transactions-by-date:read',
        description: 'Searchtransactionsbydate'
      },
      {
        name: 'transactions-email:read',
        description: 'Viewtransactionemail'
      },
      {
        name: 'toggle-3ds:read',
        description: 'View 3D Secure setting'
      },
      {
        name: 'transactions-description:read',
        description: 'Viewtransactiondescription'
      }
    ]
  }
}
