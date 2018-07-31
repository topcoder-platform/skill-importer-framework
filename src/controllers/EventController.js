/**
 * Controller for event endpoints.
 */
const createError = require('http-errors')
const EventService = require('../services/EventService')
const {Roles} = require('../constants')

/**
 * Create a new Event.
 *
 * @param {Object} req the request
 * @returns {Object} the created NormalizedEventName
 */
async function create (req) {
  return EventService.create(req.body)
}

/**
 * Search Events.
 *
 * @returns {Array} the search results
 */
async function search (req) {
  if (req.user.role !== Roles.ADMIN && req.query.userUid !== req.user.uid) {
    throw createError.Forbidden('You are not allowed to view other user\'s events')
  }
  return EventService.search(req.query)
}

/**
 * Delete an Event.
 *
 * @param {Object} req the request
 */
async function remove (req) {
  await EventService.remove(req.params.id)
}

module.exports = {
  create,
  search,
  remove
}
