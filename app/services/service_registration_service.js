'use strict';

const getAdminUsersClient = require('./clients/adminusers_client');
const ConnectorClient = require('../services/clients/connector_client').ConnectorClient;
const connectorClient = () => new ConnectorClient(process.env.CONNECTOR_URL);
const paths = require(__dirname + '/../paths.js');
const userService = require('./user_service');

/**
 * Submit service creation
 * @param gatewayAccountIds
 * @param correlationId
 */
const submitCreateService = function (gatewayAccountIds, correlationId) {
  return getAdminUsersClient({correlationId}).createService(gatewayAccountIds);
};

const createGatewayAccount = function (params) {
  return connectorClient().createAccount(params);
};

module.exports = {

  /**
   * submit the user details for self registration of a service
   * @param email
   * @param phoneNumber
   * @param password
   * @param correlationId
   */
  submitRegistration: function (email, phoneNumber, password, correlationId) {
    return getAdminUsersClient({correlationId: correlationId}).submitServiceRegistration(email, phoneNumber, password);
  },


  /**
   * submit otp code for verification
   * @param code
   * @param otpCode
   * @param correlationId
   */
  submitServiceInviteOtpCode: function (code, otpCode, correlationId) {
    return getAdminUsersClient({correlationId}).verifyOtpForServiceInvite(code, otpCode);
  },


  /**
   * Submit gateway account creation
   *
   */
  submitCreateGatewayAccount: createGatewayAccount,

  /**
   * Submit service creation
   * @param gatewayAccountIds
   * @param correlationId
   */
  submitCreateService: submitCreateService,

  /**
   * Creates a service containing a sandbox gateway account and a user
   */
  createPopulatedService: (userData, correlationId) => {
    let gatewayAccountId;
    const connectorParams = {
      payload: {
        type: 'test'
      },
      correlationId
    };

    return createGatewayAccount(connectorParams)
      .then((gatewayAccount) => {
        gatewayAccountId = gatewayAccount.gateway_account_id;
        return submitCreateService([gatewayAccountId], correlationId);
      })
      .then((service) => {
        return userService.createUser(userData.email, [gatewayAccountId], [service.externalId], userData.role, userData.phoneNumber, correlationId)
      });
  }
};
