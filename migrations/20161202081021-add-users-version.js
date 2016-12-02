'use strict';
var Sequel = require('sequelize');

module.exports = {
  up: function (queryInterface) {
    return queryInterface.addColumn(
      'users',
      'version',
      {
        type: Sequel.INTEGER,
        allowNull: false,
        defaultValue: 0
      });
  },

  down: function (queryInterface) {
    return queryInterface.removeColumn('users', 'version');
  }
};
