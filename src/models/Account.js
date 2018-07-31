/**
 * Account schema.
 */
const { Schema } = require('dynamoose')
const uuid = require('uuid/v4')
const _ = require('lodash')
const { Websites, ImportingStatuses } = require('../constants')

const schema = new Schema({
  id: { type: String, hashKey: true, index: { global: true }, required: true, default: uuid },
  username: { type: String, required: true, index: { global: true } },
  website: { type: String, required: true, enum: _.values(Websites), index: { global: true } },
  userUid: { type: String, required: true, index: { global: true } },
  importingStatus: { type: String, default: ImportingStatuses.NOT_STARTED },
  importingStartsAt: { type: Date },
  importingCompletesAt: { type: Date }
})

module.exports = schema
