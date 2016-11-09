var Sequelize = require('sequelize');

const permission = {

  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  name: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },

  description: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
};

const role = {

  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  description: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
};

const rolePermission = {

  roleId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    validate: {
      notEmpty: true
    },

    references: {
      model: 'role',
      key: 'id'
    },
    onDelete: 'cascade'
  },

  permissionId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    validate: {
      notEmpty: true
    },

    references: {
      model: 'permission',
      key: 'id'
    },
    onDelete: 'cascade'
  }
};

const userRole = {

  roleId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    validate: {
      notEmpty: true
    },

    references: {
      model: 'permission',
      key: 'id'
    },
    onDelete: 'cascade'
  },

  userId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    validate: {
      notEmpty: true
    },

    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'cascade'
  }
};

module.exports = {
  up: function (queryInterface, Sequelize, done) {
    queryInterface.createTable('permission', permission)
      .then(()=> { return queryInterface.createTable('role', role) })
      .then(()=> { return queryInterface.createTable('role_permission', rolePermission) })
      .then(()=> { return queryInterface.createTable('user_role', userRole) })
      .then(()=> {
          return queryInterface.addIndex('role_permission', ['roleId', 'permissionId'], {
            indexName: 'rolePermissionIndex',
            indicesType: 'UNIQUE'
          }) })
      .then(()=> {
          return queryInterface.addIndex('user_role', ['userId', 'roleId'], {
            indexName: 'userRoleIndex',
            indicesType: 'UNIQUE'
          }) })
      .then(()=> {done() });
  },

  down: function (queryInterface, Sequelize, done) {
    queryInterface
      .removeIndex('user_role', 'userRoleIndex')
      .then(()=> { return queryInterface.removeIndex('role_permission', 'rolePermissionIndex')})
      .then(()=> { return queryInterface.dropTable('user_role') })
      .then(()=> { return queryInterface.dropTable('role_permission') })
      .then(()=> { return queryInterface.dropTable('role') })
      .then(()=> { return queryInterface.dropTable('permission') })
      .then(()=> { done() });
  }
};
