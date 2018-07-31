/**
 * This service provides operations to manage Event.
 */
const Joi = require('joi')
const helper = require('../common/helper')
const { Event, Skill } = require('../models')

/**
 * Create a new Event.
 *
 * @param {Object} event the event to create
 * @returns {Object} the created event
 */
async function create (event) {
  const skill = await helper.ensureExist(Skill, {id: event.skillId})
  event.accountId = skill.accountId
  event.userUid = skill.userUid
  event.affectedSkillName = skill.name
  event.affectedPointType = skill.pointType

  // Increase Skill points
  skill.points = skill.points + event.affectedPoints
  await skill.save()

  return Event.create(event)
}

create.schema = {
  event: Joi.object().keys({
    date: Joi.date().required(),
    text: Joi.string().required(),
    skillId: Joi.string().uuid().required(),
    affectedPoints: Joi.number().required()
  })
}

/**
 * Search Events.
 *
 * @param {Object} criteria the search criteria
 * @returns {Array} the search result
 */
async function search (criteria) {
  if (!criteria.accountId) {
    delete criteria.accountId
  }
  return helper.findAll(Event, criteria)
}

search.schema = {
  criteria: Joi.object().keys({
    userUid: Joi.string().uuid().required(),
    accountId: Joi.string().uuid()
  })
}

/**
 * Delete an Event.
 *
 * @param {String} id the id
 */
async function remove (id) {
  const event = await helper.findOneAndRemove(Event, { id })

  // Decrease Skill points
  const skill = await helper.ensureExist(Skill, { id: event.skillId })
  skill.points = Math.max(skill.points - event.affectedPoints, 0)
  await skill.save()
}

remove.schema = {
  id: Joi.string().uuid().required()
}

module.exports = {
  create,
  search,
  remove
}

helper.buildService(module.exports)
