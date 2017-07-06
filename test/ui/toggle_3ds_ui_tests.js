const path = require('path')
const should = require('chai').should()   // eslint-disable-line
const renderTemplate = require(path.join(__dirname, '/../test_helpers/html_assertions.js')).render

describe('The toggle 3D Secure page when 3D Secure is off', function () {
  it('should say that 3D Secure is off but not show the toggle button if the user only has read permission', function () {
    let templateData = {
      'requires3ds': false,
      permissions: {
        toggle_3ds_read: true
      }
    }

    let body = renderTemplate('3d_secure/index', templateData)

    body.should.containSelector('#3ds-status').withExactText('3D Secure is off')
    body.should.containNoSelector('#3ds-on-button')
    body.should.containNoSelector('#3ds-off-button')
  })

  it('should say not that 3D Secure is off if the user does not have read permission', function () {
    let templateData = {
      'requires3ds': false,
      permissions: {
        toggle_3ds_read: false
      }
    }

    let body = renderTemplate('3d_secure/index', templateData)

    body.should.containNoSelector('#3ds-status')
  })

  it('should show the toggle button if the user also has update permission', function () {
    let templateData = {
      'requires3ds': false,
      permissions: {
        toggle_3ds_read: true,
        toggle_3ds_update: true
      }
    }

    let body = renderTemplate('3d_secure/index', templateData)

    body.should.containSelector('#3ds-on-button')
    body.should.containNoSelector('#3ds-off-button')
  })

  it('should show the highlight if the permission has just been toggled and the user has read permission', function () {
    let templateData = {
      'requires3ds': false,
      'justToggled': true,
      permissions: {
        toggle_3ds_read: true
      }
    }

    let body = renderTemplate('3d_secure/index', templateData)

    body.should.containSelector('#3ds-toggled').withText('3D Secure is turned off for this service')
  })

  it('should not show the highlight if the permission has just been toggled and the user does not has read permission', function () {
    let templateData = {
      'requires3ds': false,
      'justToggled': true,
      permissions: {
        toggle_3ds_read: false
      }
    }

    let body = renderTemplate('3d_secure/index', templateData)

    body.should.containNoSelector('#3ds-toggled')
  })

  it('should not show the highlight if the permission has not been toggled and the user has read permission', function () {
    let templateData = {
      'requires3ds': false,
      'justToggled': false,
      permissions: {
        toggle_3ds_read: true
      }
    }

    let body = renderTemplate('3d_secure/index', templateData)

    body.should.containNoSelector('#3ds-toggled')
  })
})

describe('The toggle 3D Secure page when 3D Secure is on', function () {
  it('should say that 3D Secure is on but not show the toggle button if the user only has read permission', function () {
    let templateData = {
      'requires3ds': true,
      permissions: {
        toggle_3ds_read: true
      }
    }

    let body = renderTemplate('3d_secure/index', templateData)

    body.should.containSelector('#3ds-status').withExactText('3D Secure is activated')
    body.should.containNoSelector('#3ds-turn-on')
    body.should.containNoSelector('#3ds-turn-off')
  })

  it('should say not that 3D Secure is on if the user does not have read permission', function () {
    let templateData = {
      'requires3ds': true,
      permissions: {
        toggle_3ds_read: false
      }
    }

    let body = renderTemplate('3d_secure/index', templateData)

    body.should.containNoSelector('#3ds-status')
  })

  it('should show the toggle button if the user also has update permission', function () {
    let templateData = {
      'requires3ds': true,
      permissions: {
        toggle_3ds_read: true,
        toggle_3ds_update: true
      }
    }

    let body = renderTemplate('3d_secure/index', templateData)

    body.should.containSelector('#3ds-off-button')
    body.should.containNoSelector('#3ds-on-button')
  })

  it('should show the highlight if the permission has just been toggled and the user has read permission', function () {
    let templateData = {
      'requires3ds': true,
      'justToggled': true,
      permissions: {
        toggle_3ds_read: true
      }
    }

    let body = renderTemplate('3d_secure/index', templateData)

    body.should.containSelector('#3ds-toggled').withText('3D Secure is turned on for this service')
  })

  it('should not show the highlight if the permission has just been toggled and the user does not has read permission', function () {
    let templateData = {
      'requires3ds': true,
      'justToggled': true,
      permissions: {
        toggle_3ds_read: false
      }
    }

    let body = renderTemplate('3d_secure/index', templateData)

    body.should.containNoSelector('#3ds-toggled')
  })

  it('should not show the highlight if the permission has not been toggled and the user has read permission', function () {
    let templateData = {
      'requires3ds': true,
      'justToggled': false,
      permissions: {
        toggle_3ds_read: true
      }
    }

    let body = renderTemplate('3d_secure/index', templateData)

    body.should.containNoSelector('#3ds-toggled')
  })
})

describe('The turn 3D Secure on confirmation page', function () {
  it('should show the button if the user has edit permission', function () {
    let templateData = {
      permissions: {
        toggle_3ds_read: true,
        toggle_3ds_update: true
      }
    }

    let body = renderTemplate('3d_secure/on_confirm', templateData)

    body.should.containSelector('#3ds-confirm-on-button')
  })

  it('should not show the button if the user has does not have  permission', function () {
    let templateData = {
      permissions: {
        toggle_3ds_read: true,
        toggle_3ds_update: false
      }
    }

    let body = renderTemplate('3d_secure/on_confirm', templateData)

    body.should.containNoSelector('#3ds-confirm-on-button')
  })
})
