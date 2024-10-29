const paths = require('../../../../paths')
const formatSimplifiedAccountPathsFor = require('../../../../utils/simplified-account/format/format-simplified-account-paths-for')
const { response, renderErrorView } = require('../../../../utils/response')
const { getServiceUsers, getInvitedUsers, findByExternalId } = require('../../../../services/user.service')
const { mapTeamMembersByRoles, mapInvitedTeamMembersByRoles } = require('../../../../utils/simplified-account/format/arrange-users-by-role')
const { roles } = require('../../../../utils/roles')
const userService = require('../../../../services/user.service')

async function get (req, res, next) {
  const externalServiceId = req.service.externalId
  const accountType = req.account.type
  try {
    const [serviceUsers, invitedUsers] = await Promise.all([
      getServiceUsers(externalServiceId),
      getInvitedUsers(externalServiceId)
    ])
    const teamMembers = mapTeamMembersByRoles(serviceUsers, externalServiceId, accountType, req.user)
    const invitedTeamMembers = mapInvitedTeamMembersByRoles(invitedUsers)
    const inviteTeamMemberLink = formatSimplifiedAccountPathsFor(paths.service.teamMembers.invite, externalServiceId, accountType)
    const numberInvitedMembers = invitedUsers.length
    const isServiceAdmin = req.user.isAdminUserForService(externalServiceId)

    response(req, res, 'simplified-account/settings/team-members/index', {
      teamMembers,
      inviteTeamMemberLink,
      invitedTeamMembers,
      numberInvitedMembers,
      isServiceAdmin,
      roles
    })
  } catch (err) {
    next(err)
  }
}

async function getRemoveUser (req, res, next) {
  const externalServiceId = req.service.externalId
  const accountType = req.account.type
  try {
    const { externalId, email } = await findByExternalId(req.params.externalUserId)
    response(req, res, 'simplified-account/settings/team-members/removeUser',
      {
        externalId,
        email,
        backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.teamMembers.index, externalServiceId, accountType)
  })}
  catch (err) {
    next(err)
  }
}

async function postRemoveUser (req, res, next) {
  console.log(req)
  const userToRemoveExternalId = req.params.externalUserId
  const removerExternalId = req.user.externalId
  const externalServiceId = req.service.externalId
  const accountType = req.account.type

  if (req.body.confirmRemoveUser === 'no') {
    //redirect to team members page
    res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.teamMembers.index, externalServiceId, accountType))
  }
  if (req.body.confirmRemoveUser === 'yes') {
    if (userToRemoveExternalId === removerExternalId) {
      renderErrorView(req, res, 'It is not possible to remove yourself from a service', 403)
      return
    }
    //remove the user
    try {
      const userToRemove = await userService.findByExternalId(userToRemoveExternalId)
      await userService.delete(externalServiceId, removerExternalId, userToRemoveExternalId)
      req.flash('generic', userToRemove.email + ' was successfully removed')
      res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.teamMembers.index, externalServiceId, accountType))
    } catch (err) {
      if (err.errorCode === 404) {
        const messageUserHasBeenDeleted = {
          error: {
            title: 'This person has already been removed',
            message: 'This person has already been removed by another administrator.'
          },
          link: {
            link: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.teamMembers.index, externalServiceId, accountType),
            text: 'View all team members'
          },
          enable_link: true
        }
        response(req, res, 'error-with-link', messageUserHasBeenDeleted)
      } else {
        next(err)
      }
    }
  }
}

async function getChangePermission (req, res, next) {
  // TODO implement change permission page
}

module.exports = {
  get,
  getRemoveUser,
  postRemoveUser,
  getChangePermission
}
