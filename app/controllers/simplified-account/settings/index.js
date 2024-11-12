module.exports.index = require('./index.controller')
module.exports.serviceName = require('./service-name/service-name.controller')
module.exports.emailNotifications = require('./email-notifications/email-notifications.controller')
module.exports.stripeDetails = require('./stripe-details/stripe-details.controller')
module.exports.teamMembers = require('./team-members/team-members.controller')

module.exports.organisationDetails = {
  index: require('./organisation-details/organisation-details.controller'),
  edit: require('./organisation-details/edit-organisation-details.controller')
}
