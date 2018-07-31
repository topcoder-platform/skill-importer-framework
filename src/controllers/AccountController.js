/**
 * Controller for account endpoints.
 */
const AccountService = require('../services/AccountService')

/**
 * Search accounts.
 *
 * @param {Object} req the request
 * @returns {Object} the search results
 */
async function search (req) {
  return AccountService.search(req.query)
}

/**
 * Delete an account.
 *
 * @param {Object} req the request
 */
async function remove (req) {
  await AccountService.remove(req.params.id, req.user)
}

/**
 * Get an account's importing status.
 *
 * @param {Object} req the request
 */
async function getImportingStatus (req) {
  return AccountService.getImportingStatus(req.params.id)
}

module.exports = {
  search,
  remove,
  getImportingStatus
}
