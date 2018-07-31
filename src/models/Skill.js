/**
 * Skill schema.
 */
const {Schema} = require('dynamoose')
const uuid = require('uuid/v4')

const schema = new Schema({
  id: { type: String, hashKey: true, index: { global: true }, required: true, default: uuid },
  name: {type: String, require: true, index: { global: true }},
  pointType: {type: String, require: true, index: {global: true}},
  points: {type: Number, require: true},
  accountId: {type: String, require: true, index: {global: true}},

  // For searching easier
  userUid: {type: String, require: true, index: {global: true}}
})

module.exports = schema
