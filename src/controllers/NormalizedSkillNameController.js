/**
 * Controller for NormalizedSkillName endpoints.
 */
const NormalizedSkillNameService = require('../services/NormalizedSkillNameService')

/**
 * Create a new NormalizedSkillName.
 *
 * @param {Object} req the request
 * @returns {Object} the created NormalizedSkillName
 */
async function create (req) {
  return NormalizedSkillNameService.create(req.body)
}

/**
 * Search NormalizedSkillNames.
 *
 * @returns {Object} the search results
 */
async function search () {
  return NormalizedSkillNameService.search()
}

/**
 * Update a NormalizedSkillName.
 *
 * @param {Object} req the request
 * @returns {Object} the updated NormalizedSkillName
 */
async function update (req) {
  return NormalizedSkillNameService.update(req.params.name, req.body)
}

/**
 * Delete a NormalizedSkillName.
 *
 * @param {Object} req the request
 */
async function remove (req) {
  await NormalizedSkillNameService.remove(req.params.name)
}

module.exports = {
  create,
  search,
  update,
  remove
}
