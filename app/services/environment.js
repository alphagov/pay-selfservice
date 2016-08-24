/* jshint strict: false */

const PRODUCTION = "production";
const DEVELOPMENT = "development";

module.exports = {
	/**
	 * Is the app running in production?
	 * @return {Boolean}
	 */
	isProduction: function () {
		return process.env.NODE_ENV === PRODUCTION;
	},

	/**
	 * Is the app running in development?
	 * @return {Boolean}
	 */
	isDevelopment: function () {
		return process.env.NODE_ENV === DEVELOPMENT;
	},

	/**
	 * Number of node workers in cluster
	 * @return {Number} 
	 */
	getWorkerCount: function () {
		return process.env.NODE_WORKER_COUNT || 1;
	}
};
