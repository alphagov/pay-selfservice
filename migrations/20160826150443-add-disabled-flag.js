'use strict';
var Sequel = require('sequelize');

module.exports = {
  up: function (queryInterface) {
    return queryInterface.addColumn(
      'users',
      'disabled',
      {
        type: Sequel.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
  },

  down: function (queryInterface) {
    return queryInterface.removeColumn('users', 'disabled');
  }
};
