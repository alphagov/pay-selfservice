var Sequelize = require('sequelize');

const permission = {

  id: {
    type: Sequelize.INTEGER,
    primaryKey: true
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

  createdAt: {
    type: Sequelize.DATE
  },

  updatedAt: {
    type: Sequelize.DATE
  },
};

const role = {

  id: {
    type: Sequelize.INTEGER,
    primaryKey: true
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

  createdAt: {
    type: Sequelize.DATE
  },

  updatedAt: {
    type: Sequelize.DATE
  },
};

const rolePermission = {

  role_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    validate: {
      notEmpty: true
    },

    references: {
      model: 'roles',
      key: 'id'
    },
    onDelete: 'cascade'
  },

  permission_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    validate: {
      notEmpty: true
    },

    references: {
      model: 'permissions',
      key: 'id'
    },
    onDelete: 'cascade'
  },

  createdAt: {
    type: Sequelize.DATE
  },

  updatedAt: {
    type: Sequelize.DATE
  },
};

const userRole = {

  role_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    validate: {
      notEmpty: true
    },

    references: {
      model: 'roles',
      key: 'id'
    },
    onDelete: 'cascade'
  },

  user_id: {
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
  },

  createdAt: {
    type: Sequelize.DATE
  },

  updatedAt: {
    type: Sequelize.DATE
  },
};

module.exports = {
  up: function (queryInterface, Sequelize, done) {
    queryInterface.createTable('permissions', permission)
      .then(()=> { return queryInterface.createTable('roles', role) })
      .then(()=> { return queryInterface.createTable('role_permission', rolePermission) })
      .then(()=> { return queryInterface.createTable('user_role', userRole) })
      .then(()=> {
          return queryInterface.addIndex('role_permission', ['role_id', 'permission_id'], {
            indexName: 'rolePermissionIndex',
            indicesType: 'UNIQUE'
          }) })
      .then(()=> {
          return queryInterface.addIndex('user_role', ['user_id', 'role_id'], {
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
      .then(()=> { return queryInterface.dropTable('roles') })
      .then(()=> { return queryInterface.dropTable('permissions') })
      .then(()=> { done() });
  }
};
