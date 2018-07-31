/**
 * User schema.
 */
const _ = require('lodash')
const uuid = require('uuid/v4')
const {Schema} = require('dynamoose')
const {Roles} = require('../constants')

const schema = new Schema({
  uid: {type: String, hashKey: true, index: {global: true}, required: true, default: uuid},
  username: {type: String, required: true, index: {global: true}},
  passwordHash: {type: String, required: true},
  name: {type: String, required: true, index: {global: true}},
  role: {type: String, required: true, index: {global: true}, enum: _.values(Roles), default: Roles.MEMBER},

  // Additional field for searching easier
  skillNames: [String]
})

module.exports = schema
