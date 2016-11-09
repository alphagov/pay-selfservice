/**
 * Function to be called after require!
 * @param {array} permissions User permissions that have authorization for the view.
 *            If undefined, any permission can check the view.
 */
var permissions = function (permissions) {
    return function (req, res, next) {
      var options = req.app.get('permissions') || {};

      /**
       * Setting default values if options are not set.
       * @define {string} permission User's property name describing his permission.
       */
      var permission = options.permission || 'permission';

      /**
       * notAuthorized implement this interface.
       * Interface contains 4 properties.
       * @property {string} flashType 1st argument of req.flash() (flash)
       * @property {string} message 2nd argument of req.flash() (flash)
       * @property {string} redirect Path argument of req.redirect() (express)
       * @property {number} status 1st argument of req.status() (express)
       *
       * @define {Object} notAuthorized Defines properties when user is not authorized.
       */
      var notAuthorized = options.notAuthorized || {status: 403, redirect: null};

      /**
       * Function to be called after permission is done with checking ACL.
       * @enum {string} authorizedStatus : notAuthorized, authorized.
       */
      var after = options.after || function (req, res, next, authorizedStatus) {
          if (authorizedStatus === permission.AUTHORIZED) {
            next();
          } else {
            var state = notAuthorized;

            if (state.redirect) {
              state.message && req.flash(state.flashType, state.message);
              res.redirect(state.redirect);
            }
            else {
              res.status(state.status).send(null);
            }
          }
        };

      if (!req.user[permission]) {
        throw new Error("User doesn't have property named: " + permission)
      }

      if (!permissions || permissions.indexOf(req.user[permission]) > -1) {
        after(req, res, next, permission.AUTHORIZED);
      } else {
        after(req, res, next, permission.NOT_AUTHORIZED);
      }
    }
  };

Object.defineProperty(permissions, 'AUTHORIZED', {value: 'authorized'});
Object.defineProperty(permissions, 'NOT_AUTHORIZED', {value: 'notAuthorized'});

module.exports = permissions;
