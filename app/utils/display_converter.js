let _ = require('lodash');

const hideNavBarTemplates = [
  'service_switcher/index'
];

const testHasMultipleGatewayAccounts = user => {
  return user.gatewayAccountIds && user.gatewayAccountIds.length > 1;
};

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
const getPermissionsForView = user => {
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

module.exports = function(user, data, template) {
  let convertedData = _.clone(data);

  convertedData.permissions = getPermissionsForView(user);

  let hasMultipleGatewayAccounts = testHasMultipleGatewayAccounts(user);
  if (hasMultipleGatewayAccounts) {
    convertedData.multipleGatewayAccounts = true;
  }
  convertedData.navigation = showNavigationBar(template);
  addGatewayAccountProviderDisplayNames(convertedData);
  return convertedData;
};