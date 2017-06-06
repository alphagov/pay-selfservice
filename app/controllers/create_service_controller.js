const logger = require('winston');
let paths = require('../paths.js');

module.exports = {

  /**
   * display user registration data entry form
   * @param req
   * @param res
   */
  showRegistration: (req, res) => {
    res.render('self_create_service/index');
  },

  /**
   * display service creation requested page
   * @param req
   * @param res
   */
  showRequestedPage: (req, res) => {
    res.render('self_create_service/service_creation_requested');
  },

  /**
   * display OTP verify page
   * @param req
   * @param res
   */
  showOtpVerify: (req, res) => {
    res.render('self_create_service/service_creation_verify_otp');
  },

  /**
   * display name your service form
   * @param req
   * @param res
   */
  nameYourService: (req, res) => {
    res.render('self_create_service/name_your_service');
  },

  /**
   * display OTP resend page
   * @param req
   * @param res
   */
  showOtpResend: (req, res) => {
    res.render('self_create_service/service_creation_resend_otp');
  }
};
