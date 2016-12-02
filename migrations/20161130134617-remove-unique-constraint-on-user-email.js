'use strict';

module.exports = {
  up: function (queryInterface, Sequelize, done) {
    return queryInterface.sequelize.query(
      'ALTER TABLE users DROP CONSTRAINT users_email_key;', {logging: console.log}
    ).then(() => queryInterface.removeIndex(
        'users',
        'users_email_key',
        {
          indicesType: 'UNIQUE',
          logging: console.log
        }
      )
    ).then(() => queryInterface.addIndex('users', ['email'], {indexName: "users_email_key", logging: console.log})
    ).then(() => done());
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.removeIndex(
        'users',
        'users_email_key',
        {
          logging: console.log
        }
      ).then(() => queryInterface.addIndex(
        'users',
        ['email'],
        {
          indexName: "users_email_key",
          indicesType: 'UNIQUE',
          logging: console.log
        }
      )).then(() => queryInterface.sequelize.query(
        'ALTER TABLE users ADD CONSTRAINT users_email_key unique using index users_email_key', {logging: console.log}
      ));
  }
};
