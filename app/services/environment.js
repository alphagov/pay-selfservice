/* jshint strict: false */

module.exports = {
	/**
	 * Number of node workers in cluster
	 * @return {Number}
	 */
	getWorkerCount: function () {
		return process.env.NODE_WORKER_COUNT || 1;
	}
};
