const UserPermissions = {
  any: 'any', // any user can access, admintool only, not returned as part of User permissions set
  agreements: {
    agreementsRead: 'agreements_read',
    agreementsUpdate: 'agreements_update',
  },
  transactions: {
    transactionsByDateRead: 'transactions_by_date_read',
    transactionsDownloadRead: 'transactions_download_read',
    transactionsEventsRead: 'transactions_events_read',
    transactionsRead: 'transactions_read',
    transactionsByFieldsRead: 'transactions_by_fields_read',
    transactionsCardTypeRead: 'transactions_card_type_read',
    transactionsDescriptionRead: 'transactions_description_read',
    transactionsAmountRead: 'transactions_amount_read',
    transactionsEmailRead: 'transactions_email_read',
    transactionsDetailsRead: 'transactions_details_read',
  },
  settings: {
    merchantDetails: {
      merchantDetailsRead: 'merchant_details_read',
      merchantDetailsUpdate: 'merchant_details_update',
    },
    paymentTypes: {
      paymentTypesRead: 'payment_types_read',
      paymentTypesUpdate: 'payment_types_update',
    },
    gatewayCredentials: {
      gatewayCredentialsRead: 'gateway_credentials_read',
      gatewayCredentialsUpdate: 'gateway_credentials_update',
    },
    emailNotifications: {
      emailNotificationToggleUpdate: 'email_notification_toggle_update',
      emailNotificationTemplateRead: 'email_notification_template_read',
      emailNotificationParagraphUpdate: 'email_notification_paragraph_update',
    },
    cardPayments: {
      toggleBillingAddressRead: 'toggle_billing_address_read',
      toggleBillingAddressUpdate: 'toggle_billing_address_update',
      toggle3dsRead: 'toggle_3ds_read',
      toggle3dsUpdate: 'toggle_3ds_update',
      motoMaskInputRead: 'moto_mask_input_read',
      motoMaskInputUpdate: 'moto_mask_input_update',
    },
    serviceName: {
      serviceNameRead: 'service_name_read',
      serviceNameUpdate: 'service_name_update',
    },
    webhooks: {
      webhooksRead: 'webhooks_read',
      webhooksUpdate: 'webhooks_update',
    },
    tokens: {
      tokensRead: 'tokens_read',
      tokensActiveRead: 'tokens_active_read',
      tokensRevokedRead: 'tokens_revoked_read',
      tokensCreate: 'tokens_create',
      tokensUpdate: 'tokens_update',
      tokensDelete: 'tokens_delete',
    },
    stripe: {
      stripeOrganisationDetailsRead: 'stripe_organisation_details_read',
      stripeResponsiblePersonRead: 'stripe_responsible_person_read',
      stripeGovernmentEntityDocumentUpdate: 'stripe_government_entity_document_update',
      stripeDirectorUpdate: 'stripe_director_update',
      stripeAccountDetailsUpdate: 'stripe_account_details_update',
      stripeBankDetailsUpdate: 'stripe_bank_details_update',
      stripeDirectorRead: 'stripe_director_read',
      stripeVatNumberCompanyNumberRead: 'stripe_vat_number_company_number_read',
      stripeBankDetailsRead: 'stripe_bank_details_read',
      stripeResponsiblePersonUpdate: 'stripe_responsible_person_update',
      stripeOrganisationDetailsUpdate: 'stripe_organisation_details_update',
      stripeVatNumberCompanyNumberUpdate: 'stripe_vat_number_company_number_update',
    },
  },
  pspTestAccountStageUpdate: 'psp_test_account_stage_update',
  agentInitiatedMotoCreate: 'agent_initiated_moto_create',
  usersServiceDelete: 'users_service_delete',
  payoutsRead: 'payouts_read',
  connectedGocardlessAccountRead: 'connected_gocardless_account_read',
  connectedGocardlessAccountUpdate: 'connected_gocardless_account_update',
  refundsCreate: 'refunds_create',
  goLiveStageRead: 'go_live_stage_read',
  goLiveStageUpdate: 'go_live_stage_update',
  usersServiceRead: 'users_service_read',
  usersServiceCreate: 'users_service_create',
}

export = UserPermissions
