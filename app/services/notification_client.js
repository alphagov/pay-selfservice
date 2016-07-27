var q = require('q'),
  NotifyClient = require('notifications-node-client').NotifyClient,
  notifyClient = !!process.env.NOTIFICATIONS_ENABLED && new NotifyClient(
    process.env.NOTIFY_BASE_URL,
    process.env.NOTIFY_SERVICE_ID,
    process.env.NOTIFY_SECRET
  );

module.exports = {
  /**
   * @param {String} templateId
   * @param {String} emailAddress
   * @param {Object} personalisation
   *
   * @returns {Promise}
   */
  sendEmail: function(templateId, emailAddress, personalisation) {
    var deferred = q.defer();
    if (!!notifyClient) {
      return notifyClient.sendEmail(templateId, emailAddress, personalisation)
    } else {
      deferred.reject('Notification sending not enabled');
      return deferred.promise;
    }
  },

  /**
   * @param {String} templateId
   * @param {String} phoneNumber
   * @param {Object} personalisation
   *
   * @returns {Promise}
   */
  sendSms: function(templateId, phoneNumber, personalisation) {
    var deferred = q.defer();
    if (!!notifyClient) {
      console.log(templateId, phoneNumber, personalisation)
      return notifyClient.sendSms(templateId, phoneNumber, personalisation)
    } else {
      deferred.reject('Notification sending not enabled');
      return deferred.promise;
    }
  }
};
