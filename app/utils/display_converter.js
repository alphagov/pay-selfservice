let _ = require('lodash');

const hideNavBarTemplates = [
  'services/index',
  'services/team_members',
  'services/team_member_details',
  'services/team_member_profile',
  'services/team_member_permissions'
];

/**
 * converts users permission array of form
 *
 * [
 * 'permission-type:operation',
 * ...
 *
 * ]
 *
 * to object of form
 *
 * {
 *   'permission_type_operation': true,
 *   ...
 *
 * }
 *
 * @param user
 * @returns {object}
 */
const getPermissions = user => {
  let permissionMap = {};
  let userPermissions;
  if (user && user.permissions) {
    userPermissions = _.clone(user.permissions);
    _.forEach(userPermissions, x => {
      permissionMap[x.replace(/[-:]/g, '_')] = true;
    });
  }
  return permissionMap;
};

const showNavigationBar = template => {
  return hideNavBarTemplates.indexOf(template) === -1;
};

const addGatewayAccountProviderDisplayNames = data => {
  let gatewayAccounts = _.get(data, 'gatewayAccounts', null);
  if(gatewayAccounts) {

    let convertedGateWayAccounts =  gatewayAccounts.map(gatewayAccount => {
      if (gatewayAccount.payment_provider) {
        gatewayAccount.payment_provider_display_name = _.startCase(gatewayAccount.payment_provider);
      }
      return gatewayAccount;
    });
    data.gatewayAccounts = convertedGateWayAccounts;

  }

};

const getAccount = account => {
  if(account) {
    account.full_type = account.type === 'test' ?
      [account.payment_provider, account.type].join(' ') :
      account.type;
  }

  return account;
};

const getCurrentServiceName = user => {
  if(user) {
      return user.serviceName;
  }
};

module.exports = function(user, data, template, account) {
  let convertedData = _.clone(data);
  convertedData.permissions = getPermissions(user);
  convertedData.navigation = showNavigationBar(template);
  addGatewayAccountProviderDisplayNames(convertedData);
  convertedData.currentGatewayAccount = getAccount(account);
  convertedData.currentServiceName = getCurrentServiceName(user);

  return convertedData;
};
