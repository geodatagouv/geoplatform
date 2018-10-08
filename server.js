require('dotenv').config()

require('./lib/init') // eslint-disable-line import/no-unassigned-import

const app = require('./lib/express')

const port = process.env.PORT || 5000

app.listen(port, () => {
  console.log('Now listening on port %d', port)
})
