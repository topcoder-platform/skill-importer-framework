/**
 * NormalizedSkillName schema.
 */
const {Schema} = require('dynamoose')

const schema = new Schema({
  name: { type: String, hashKey: true, index: { global: true }, required: true },
  regex: { type: String, required: true }
})

module.exports = schema
