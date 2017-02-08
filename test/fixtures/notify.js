var nock        = require('nock');

createGovukNotifyToken = require('../test_helpers/jwt');


var notifyMock = nock(process.env.NOTIFY_BASE_URL);


module.exports = {
  mockSendForgottenPasswordEmail: (email, code) => {
    return notifyMock
    .post('/notifications/email', {
      template: process.env.NOTIFY_FORGOTTEN_PASSWORD_EMAIL_TEMPLATE_ID,
      to: email,
      personalisation: {code: `${process.env.SELFSERVICE_BASE}/reset-password/${code}`}
    })
    .reply(200);
  },

  mockSendTotpSms: (sms, code) => {
    return notifyMock
      .post('/notifications/sms')
      .reply(200);
  }
}

