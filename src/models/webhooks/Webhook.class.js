class Webhook {
  /**
   *
   * @param callbackUrl {String}
   * @returns Webhook
   */
  withCallbackUrl (callbackUrl) {
    this.callbackUrl = callbackUrl
    return this
  }

  /**
   *
   * @param createdDate {String}
   * @returns Webhook
   */
  withCreatedDate (createdDate) {
    this.createdDate = createdDate
    return this
  }

  /**
   *
   * @param description {String}
   * @returns Webhook
   */
  withDescription (description) {
    this.description = description
    return this
  }

  /**
   *
   * @param externalId {String}
   * @returns Webhook
   */
  withExternalId (externalId) {
    this.externalId = externalId
    return this
  }

  /**
   *
   * @param gatewayAccountId {String}
   * @returns Webhook
   */
  withGatewayAccountId (gatewayAccountId) {
    this.gatewayAccountId = gatewayAccountId
    return this
  }

  /**
   *
   * @param live {boolean}
   * @returns Webhook
   */
  withLive (live) {
    this.live = live
    return this
  }

  /**
   *
   * @param serviceExternalId {String}
   * @returns Webhook
   */
  withServiceExternalId (serviceExternalId) {
    this.serviceExternalId = serviceExternalId
    return this
  }

  /**
   *
   * @param status {WebhookStatus}
   * @returns Webhook
   */
  withStatus (status) {
    this.status = status
    return this
  }

  /**
   *
   * @param subscriptions {[WebhookSubscription]}
   * @returns Webhook
   */
  withSubscriptions (subscriptions) {
    this.subscriptions = subscriptions
    return this
  }

  /**
   * @deprecated
   * @param rawResponse {Object}
   * @returns {Webhook}
   */
  withRawResponse (rawResponse) {
    this.rawResponse = rawResponse
    return this
  }

  /**
   *
   * @param data
   * @returns {Webhook}
   */
  static fromJson (data) {
    return new Webhook()
      .withCallbackUrl(data?.callback_url)
      .withCreatedDate(data?.created_date)
      .withDescription(data?.description)
      .withExternalId(data?.external_id)
      .withGatewayAccountId(data?.gateway_account_id)
      .withLive(data?.live)
      .withServiceExternalId(data?.service_id)
      .withStatus(data?.status)
      .withSubscriptions(data?.subscriptions)
      .withRawResponse(data)
  }
}

/**
 * @readonly
 * @enum {String}
 */
const WebhookStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE'
}

/**
 * @readonly
 * @enum {String}
 */
const WebhookSubscription = {
  CARD_PAYMENT_STARTED: 'card_payment_started',
  CARD_PAYMENT_SUCCEEDED: 'card_payment_succeeded',
  CARD_PAYMENT_CAPTURED: 'card_payment_captured',
  CARD_PAYMENT_REFUNDED: 'card_payment_refunded',
  CARD_PAYMENT_FAILED: 'card_payment_failed',
  CARD_PAYMENT_EXPIRED: 'card_payment_expired'
}

module.exports = {
  Webhook,
  WebhookStatus,
  WebhookSubscription
}
