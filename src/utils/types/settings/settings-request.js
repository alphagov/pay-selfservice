/**
 * @typedef {Object} RequestExt
 * @property {import('@models/gateway-account/GatewayAccount.class')} account - Gateway Account resolved by simplified account strategy
 * @property {import('@models/service/Service.class')} service - Service resolved by simplified account strategy
 * @property {import('@models/user/User.class')} user - User resolved by passport local auth strategy
 */

/**
 * @deprecated convert file to typescript instead of using this
 * @typedef {import('express').Request & RequestExt & { flash: import('connect-flash').Flash }} SettingsRequest
 */

module.exports = {}
