var expect = require('chai').expect,
  fresh = require('fresh-require'),
  createGovukNotifyToken = require('../test_helpers/jwt'),
  nock = require('nock');

describe('notification client', function() {

  it('should send an email', function (done) {

    var email = 'dom@example.com',
      templateId = process.env.NOTIFY_RESET_PASSWORD_EMAIL_TEMPLATE_ID,
      personalisation = {foo: 'bar'},
      data = {
        template: templateId,
        to: email,
        personalisation: personalisation
      },
      notifyClient = fresh('../../app/services/notification_client', require);

    nock(process.env.NOTIFY_BASE_URL, {
      reqheaders: {
        'Authorization': 'Bearer ' + createGovukNotifyToken('POST', '/notifications/email', process.env.NOTIFY_SECRET, process.env.NOTIFY_SERVICE_ID)
      }
    })
      .post('/notifications/email', data)
      .reply(200, {"hooray": "bkbbk"});

    notifyClient.sendEmail(process.env.NOTIFY_RESET_PASSWORD_EMAIL_TEMPLATE_ID, email, personalisation)
      .then(function (response) {
        expect(response.statusCode).to.equal(200);
        done();
      });
  });

  it('should send an sms', function (done) {

    var phone = '0777777777',
      templateId = process.env.NOTIFY_RESET_PASSWORD_EMAIL_TEMPLATE_ID,
      personalisation = {foo: 'bar'},
      data = {
        template: templateId,
        to: phone,
        personalisation: personalisation
      },
      clientId = 123,
      secret = 'SECRET',
      notifyClient = fresh('../../app/services/notification_client', require);

    nock(process.env.NOTIFY_BASE_URL, {
      reqheaders: {
        'Authorization': 'Bearer ' + createGovukNotifyToken('POST', '/notifications/sms', process.env.NOTIFY_SECRET, process.env.NOTIFY_SERVICE_ID)
      }
    })
      .post('/notifications/sms', data)
      .reply(200, {"hooray": "bkbbk"});

    notifyClient.sendSms(process.env.NOTIFY_RESET_PASSWORD_EMAIL_TEMPLATE_ID, phone, personalisation)
      .then(function (response) {
        expect(response.statusCode).to.equal(200);
        done();
      });
  });

  it('should not send notifications when disabled', function (done) {
    var email = 'dom@example.com',
      personalisation = {foo: 'bar'},
      notifyClient, notificationsEnabled = process.env.NOTIFICATIONS_ENABLED;

    delete process.env.NOTIFICATIONS_ENABLED;
    notifyClient = fresh('../../app/services/notification_client', require);

    notifyClient.sendEmail(process.env.NOTIFY_RESET_PASSWORD_EMAIL_TEMPLATE_ID, email, personalisation)
      .then(function (response) {
        expect(response).to.equal('Notification sending not enabled');
        done();
        process.env.NOTIFICATIONS_ENABLED = notificationsEnabled;
      });
  });

  it('should not send throw error when email disabled and other required env vars not set', function (done) {
    var email = 'dom@example.com',
      personalisation = {foo: 'bar'},
      notifyClient, notificationsEnabled = process.env.NOTIFICATIONS_ENABLED,
      secret = process.env.NOTIFY_SECRET;

    delete process.env.NOTIFICATIONS_ENABLED;
    delete process.env.NOTIFY_SECRET;

    notifyClient = fresh('../../app/services/notification_client', require);

    notifyClient.sendEmail(process.env.NOTIFY_RESET_PASSWORD_EMAIL_TEMPLATE_ID, email, personalisation)
      .then(function (response) {
        expect(response).to.equal('Notification sending not enabled');
        done();
        process.env.NOTIFICATIONS_ENABLED = notificationsEnabled;
        process.env.NOTIFY_SECRET = secret;
      });
  });
});
