'use strict';
var Sequel = require('sequelize');

module.exports = {
  up: function (queryInterface) {
    return queryInterface.addColumn(
      'users',
      'login_counter',
      {
        type: Sequel.INTEGER,
        allowNull: false,
        defaultValue: 0
      });
  },

  down: function (queryInterface) {
    return queryInterface.removeColumn('users', 'login_counter');
  }
};
