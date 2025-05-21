import { response } from '@utils/response'
import secondFactorMethod from '@models/constants/second-factor-method'
import paths from '@root/paths'
import UserRequest from "@utils/types/express/UserRequest";
import {ServiceResponse} from "@utils/types/express";

function get (req: UserRequest, res: ServiceResponse) {
  return response(req, res, 'user/my-profile', {
    secondFactorMethod,
    email: req.user.email,
    telephone_number: req.user.telephoneNumber,
    two_factor_auth: req.user.secondFactor,
    two_factor_auth_link: paths.user.profile.twoFactorAuth.index
  })
}

export = {
  get
}
