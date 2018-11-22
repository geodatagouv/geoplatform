const {Router} = require('express')

const got = require('./got')

const baseUrl = process.env.DATAGOUV_URL + '/api'

const router = new Router({
  strict: true
})

router.all('*', async (req, res) => {
  const options = {
    baseUrl,
    method: req.method,
    throwHttpErrors: false,
    json: true,
    body: req.body
  }

  if (req.user) {
    options.headers = {
      authorization: `Bearer ${req.user.accessToken}`
    }
  }

  const response = await got(req.url, options)

  res.status(response.statusCode)
  res.send(response.body)
})

module.exports = router
