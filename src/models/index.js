/**
 * Initializ all model schemas.
 */
const _ = require('lodash')
const config = require('config')
const dynamoose = require('dynamoose')
const requireDir = require('require-dir')

dynamoose.AWS.config.update(config.AWS_DYNAMODB_CONFIG)
const schemas = requireDir()

_.forEach(_.values(schemas), (schema) => {
  // Static function to find all documents
  schema.statics.findAll = async (filter) => {
    let results = await this.scan(filter).exec()
    while (results.lastKey) {
      results = await this.scan(filter).startKey(results.startKey).exec()
    }
    return results
  }
})

const models = {
  User: dynamoose.model('User', schemas.User, {create: true, update: true}),
  Account: dynamoose.model('Account', schemas.Account, {create: true, update: true}),
  NormalizedSkillName: dynamoose.model('NormalizedSkillName', schemas.NormalizedSkillName, {create: true, update: true}),
  Event: dynamoose.model('Event', schemas.Event, {create: true, update: true}),
  Skill: dynamoose.model('Skill', schemas.Skill, {create: true, update: true})
}

module.exports = models
