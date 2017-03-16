var response              = require('../utils/response.js').response;
var auth                  = require('../services/auth_service.js');
var router                = require('../routes.js');
var userService           = require('../services/user_service.js');
var renderErrorView       = require('../utils/response.js').renderErrorView;
var CORRELATION_HEADER    = require('../utils/correlation_header.js').CORRELATION_HEADER;


let process_users_to_user_roles = function (users, currentUser) {
   let user_roles_map = {'admin' : [],'view-only': [] , 'view-and-refund': []};
   users.map ( (user)=> {
      if (user.role.name in user_roles_map) {
        new_username =   {username: user.username};
        if (currentUser.email == user.email) {
          new_username.is_current = true
        }

        user_roles_map[user.role.name].push( new_username);

      }
   });
   return user_roles_map;

};

module.exports.index = function (req, res) {

  let correlationId = req.headers[CORRELATION_HEADER] ||'';

  let init = function () {
    return userService.getServiceUsers(req.user.serviceIds[0], correlationId)
      .then(onSuccess)
      .catch(onError);
  };

  let onSuccess = function (data) {
    let team_members = process_users_to_user_roles(data,req.user);
    let model = {
      team_members: team_members,
      number_active_members : team_members.admin.length + team_members['view-only'].length + team_members['view-and-refund'].length,
      number_admin_members : team_members.admin.length,
      'number_view-only_members':  team_members['view-only'].length,
      'number_view-and-refund_members': team_members['view-and-refund'].length
    };
    response(req, res, 'service_switcher/team_members', model);
  };

  let onError = function (err) {
    renderErrorView(req, res, 'Unable to retrieve the services users.');
  };

  return init();
};
