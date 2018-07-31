/**
 * This service provides operations to manage NormalizedSkillName.
 */
const Joi = require('joi')
const createError = require('http-errors')
const helper = require('../common/helper')
const { NormalizedSkillName } = require('../models')

/**
 * Create a new NormalizedSkillName.
 *
 * @param {Object} normalizedSkillName the NormalizedSkillName to create
 * @returns {Object} the created NormalizedSkillName
 */
async function create (normalizedSkillName) {
  await helper.ensureNotExist(NormalizedSkillName, { name: normalizedSkillName.name })

  // Validate regex
  try {
    RegExp(normalizedSkillName.regex)
  } catch (err) {
    throw createError.BadRequest('regex is not a valid regular expression')
  }

  return NormalizedSkillName.create(normalizedSkillName)
}

create.schema = {
  normalizedSkillName: Joi.object().keys({
    name: Joi.string().required(),
    regex: Joi.string().required()
  })
}

/**
 * Search NormalizedSkillNames.
 *
 * @returns {Array} the search result
 */
async function search () {
  return helper.findAll(NormalizedSkillName, {})
}

/**
 * Update a NormalizedSkillName.
 *
 * @param {String} name the name
 * @param {Object} normalizedSkillName the NormalizedSkillName to update
 * @returns {Object} the updated NormalizedSkillName
 */
async function update (name, normalizedSkillName) {
  const dbNormalizedSkillName = await helper.ensureExist(NormalizedSkillName, { name })

  // Validate regex
  try {
    RegExp(normalizedSkillName.regex)
  } catch (err) {
    throw createError.BadRequest('regex is not a valid regular expression')
  }

  dbNormalizedSkillName.regex = normalizedSkillName.regex

  return dbNormalizedSkillName.save()
}

update.schema = {
  name: Joi.string().required(),
  normalizedSkillName: Joi.object().keys({
    regex: Joi.string().required()
  })
}

/**
 * Delete a NormalizedSkillName by name.
 *
 * @param {String} name the name
 */
async function remove (name) {
  await helper.findOneAndRemove(NormalizedSkillName, { name })

  // TODO
  // Delete all Events, Skills and User.skillNames which are associated with this NormalizedSkillName
}

remove.schema = {
  name: Joi.string().required()
}

module.exports = {
  create,
  search,
  update,
  remove
}

helper.buildService(module.exports)
