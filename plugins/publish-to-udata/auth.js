const OAuth2Strategy = require('passport-oauth2').Strategy
const dgv = require('./udata')

const {DATAGOUV_URL, DATAGOUV_CLIENT_ID, DATAGOUV_CLIENT_SECRET, ROOT_URL} = process.env

const strategy = new OAuth2Strategy({
  authorizationURL: `${DATAGOUV_URL}/oauth/authorize`,
  tokenURL: `${DATAGOUV_URL}/oauth/token`,
  clientID: DATAGOUV_CLIENT_ID,
  clientSecret: DATAGOUV_CLIENT_SECRET,
  callbackURL: `${ROOT_URL}/dgv/oauth/callback`
}, (async (accessToken, refreshToken, profile, done) => {
  try {
    const profile = await dgv.getProfile(accessToken)
    profile.accessToken = accessToken

    done(null, profile)
  } catch (error) {
    done(error)
  }
}))

module.exports = {strategy}
