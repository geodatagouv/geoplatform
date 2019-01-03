const {Router, json} = require('express')
const session = require('express-session')
const passport = require('passport')
const mongoose = require('mongoose')
const sessionMongo = require('connect-mongo')
const cors = require('cors')
const {omit} = require('lodash')
const {joinJobQueue} = require('bull-manager')

const sentry = require('../../lib/utils/sentry')

const {ensureLoggedIn} = require('./middlewares')
const jobs = require('./jobs/definition')

require('./models') // eslint-disable-line import/no-unassigned-import
require('./passport') // eslint-disable-line import/no-unassigned-import

const MongoStore = sessionMongo(session)

for (const job of jobs) {
  joinJobQueue(job.name, job.options)
}

const router = new Router()

router.use(sentry.Handlers.requestHandler())
router.use(cors({origin: true, credentials: true}))
router.use(json())

router.use(session({
  secret: process.env.COOKIE_SECRET,
  name: 'sid',
  saveUninitialized: false,
  resave: false,
  store: new MongoStore({
    mongooseConnection: mongoose.connection
  })
}))

router.use(passport.initialize())
router.use(passport.session())

const extractRedirectUrl = (req, res, next) => {
  req.session.redirectTo = req.query.redirect
  next()
}

router.get('/login', extractRedirectUrl, passport.authenticate('udata', {scope: 'default'}))

router.get('/logout', extractRedirectUrl, (req, res) => {
  req.logout()
  res.redirect(req.session.redirectTo)
  req.session.redirectTo = undefined
})

router.get('/oauth/callback', (req, res) => {
  passport.authenticate('udata', {
    successRedirect: req.session.redirectTo,
    failureRedirect: '/'
  })(req, res)
  req.session.redirectTo = undefined
})

router.use('/proxy-api', require('./udata-proxy'))

router.use('/api', require('./routes/producers'))
router.use('/api', require('./routes/organizations'))
router.use('/api', require('./routes/datasets'))

router.get('/api/me', ensureLoggedIn, (req, res) => {
  res.send(omit(req.user, 'accessToken'))
})

router.use(sentry.Handlers.errorHandler())
router.use((error, req, res, next) => { // eslint-disable-line no-unused-vars
  const {statusCode = 500} = error

  if (typeof error.toJSON === 'function') {
    return res.status(statusCode).send(error.toJSON())
  }

  res.status(statusCode).send({
    code: statusCode,
    sentry: res.sentry,
    error: 'An unexpected error happened'
  })
})

module.exports = router
