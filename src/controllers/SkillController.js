/**
 * Controller for skill endpoints.
 */
const SkillService = require('../services/SkillService')

/**
 * Create a new Skill.
 *
 * @param {Object} req the request
 * @returns {Object} the created NormalizedSkillName
 */
async function create (req) {
  req.body.accountId = req.params.accountId
  return SkillService.create(req.body)
}

/**
 * Get all user skills.
 *
 * @returns {Array} the search results
 */
async function getUserSkills (req) {
  return SkillService.getUserSkills(req.params.uid)
}

/**
 * Get all account skills.
 *
 * @returns {Array} the search results
 */
async function getAccountSkills (req) {
  return SkillService.getAccountSkills(req.params.accountId)
}

/**
 * Update a Skill.
 *
 * @param {Object} req the request
 * @returns {Object} the updated Skill
 */
async function update (req) {
  return SkillService.update(req.params.accountId, req.params.skillId, req.body)
}

/**
 * Delete a Skill.
 *
 * @param {Object} req the request
 */
async function remove (req) {
  await SkillService.remove(req.params.accountId, req.params.skillId)
}

module.exports = {
  create,
  getUserSkills,
  getAccountSkills,
  update,
  remove
}
