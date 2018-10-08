const {Router} = require('express')
const got = require('got')

const ALLOWED_METHODS = ['GET', 'HEAD', 'POST', 'PUT', 'DELETE']
const baseUrl = process.env.DATAGOUV_URL + '/api'

const router = new Router({
  strict: true
})

router.all('*', (req, res, next) => {
  if (!ALLOWED_METHODS.includes(req.method)) {
    return res.status(405).send()
  }

  const options = {
    baseUrl,
    body: req.body,
    method: req.method,
    throwHttpErrors: false
  }

  if (req.user) {
    options.headers = {
      authorization: `Bearer ${req.user.accessToken}`
    }
  }

  got
    .stream(req.path, options)
    .on('error', error => {
      next(error)
    })
    .pipe(res)
})

module.exports = router
