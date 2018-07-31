/**
 * Event schema.
 */
const {Schema} = require('dynamoose')
const uuid = require('uuid/v4')

const schema = new Schema({
  id: { type: String, hashKey: true, index: { global: true }, required: true, default: uuid },
  date: { type: Date, index: { global: true }, required: true },
  text: { type: String, required: true },

  skillId: {type: String, require: true, index: {global: true}},
  affectedPoints: { type: Number, required: true },
  deletedAt: { type: Date },

  // For searching easier
  affectedSkillName: { type: String, required: true },
  affectedPointType: { type: String, required: true },
  accountId: {type: String, require: true, index: {global: true}},
  userUid: {type: String, require: true, index: {global: true}}
})

module.exports = schema
