const {MongoClient, ObjectID} = require('mongodb')

class Mongo {
  async connect() {
    this.client = await MongoClient.connect(process.env.MONGO_URL || 'mongodb://localhost:27017', {
      reconnectTries: 1
    })
    this.db = this.client.db(process.env.MONGO_DB || 'geop')
  }

  disconnect(force) {
    return this.client.close(force)
  }
}

module.exports = new Mongo()
module.exports.ObjectID = ObjectID
