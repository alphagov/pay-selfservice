import { response } from '@utils/response'
import secondFactorMethod from '@models/constants/second-factor-method'
import paths from '@root/paths'
import User from '@models/user/User.class'

function get(req: Request & { user: User }, res: Response) {
  return response(req, res, 'user/my-profile', {
    secondFactorMethod,
    email: req.user.email,
    telephone_number: req.user.telephoneNumber,
    two_factor_auth: req.user.secondFactor,
    two_factor_auth_link: paths.user.profile.twoFactorAuth.index,
  })
}

export = {
  get,
}
