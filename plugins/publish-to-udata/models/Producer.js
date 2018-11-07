const mongoose = require('mongoose')

const {Schema} = mongoose
const {ObjectId} = Schema.Types

const schema = new Schema({
  _id: String,
  associatedTo: {type: ObjectId, ref: 'Organization', index: true}
})

mongoose.model('Producer', schema)
