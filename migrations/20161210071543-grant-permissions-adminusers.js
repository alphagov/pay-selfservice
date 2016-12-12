'use strict';

module.exports = {
  up: function (queryInterface, Sequelize, done) {
    return queryInterface.sequelize.query(
      'GRANT ALL PRIVILEGES ON TABLE roles TO adminusers;', {logging: console.log}
    ).then(queryInterface.sequelize.query(
      'GRANT ALL PRIVILEGES ON TABLE permissions TO adminusers;',{logging: console.log}))
      .then(queryInterface.sequelize.query(
        'GRANT ALL PRIVILEGES ON TABLE role_permission TO adminusers;',{logging: console.log}))
      .then(queryInterface.sequelize.query(
        'GRANT ALL PRIVILEGES ON TABLE users TO adminusers;',{logging: console.log}))
      .then(queryInterface.sequelize.query(
        'GRANT ALL PRIVILEGES ON TABLE user_role TO adminusers;',{logging: console.log}))
      .then(queryInterface.sequelize.query(
        'GRANT ALL PRIVILEGES ON TABLE forgotten_passwords TO adminusers;',{logging: console.log}))
      .then(queryInterface.sequelize.query(
        'GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO adminusers;',{logging: console.log}))
      .then(() => done());
  },

  down: function (queryInterface, Sequelize, done) {
    return queryInterface.sequelize.query(
      'REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM adminusers;', {logging: console.log}
    ).then(queryInterface.sequelize.query(
      'REVOKE ALL PRIVILEGES ON  TABLE forgotten_passwords FROM adminusers;',{logging: console.log}))
      .then(queryInterface.sequelize.query(
      'REVOKE ALL PRIVILEGES ON  TABLE user_role FROM adminusers;',{logging: console.log}))
      .then(queryInterface.sequelize.query(
        'REVOKE ALL PRIVILEGES ON  TABLE users FROM adminusers;',{logging: console.log}))
      .then(queryInterface.sequelize.query(
        'REVOKE ALL PRIVILEGES ON  TABLE role_permission FROM adminusers;',{logging: console.log}))
      .then(queryInterface.sequelize.query(
        'REVOKE ALL PRIVILEGES ON  TABLE permissions FROM adminusers;',{logging: console.log}))
      .then(queryInterface.sequelize.query(
        'REVOKE ALL PRIVILEGES ON  TABLE roles FROM adminusers;',{logging: console.log}))
      .then(() => done());
  }
};
