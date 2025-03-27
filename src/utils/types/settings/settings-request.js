/**
 * @typedef {Object} RequestExt
 * @property {import('@models/GatewayAccount.class')} account - Gateway Account resolved by simplified account strategy
 * @property {import('@models/Service.class')} service - Service resolved by simplified account strategy
 * @property {import('@models/User.class')} user - User resolved by passport local auth strategy
 */

/**
 * @typedef {import('express').Request & RequestExt & { flash: import('connect-flash').Flash }} SettingsRequest
 */

module.exports = {}
