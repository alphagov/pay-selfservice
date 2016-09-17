"use strict";
var logger = require('winston');
var _ = require('lodash');

module.exports = {
  user: (userContent) => {
    return {
      username: userContent.username,
      email: userContent.email,
      telephone_number: userContent.telephone_number,
      password: userContent.password,
      gateway_account_id: userContent.gateway_account_id,
    }
  }

};
