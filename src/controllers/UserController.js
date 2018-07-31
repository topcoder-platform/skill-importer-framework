/**
 * Controller for user endpoints.
 */
const UserService = require('../services/UserService')

/**
 * Logout a user.
 *
 * @param {Object} req the request
 */
async function logout (req) {
  req.logout()
}

/**
 * Search users.
 *
 * @param {Object} req the request
 * @returns {Object} the search results
 */
async function search (req) {
  return UserService.search(req.query)
}

/**
 * Change password for the current user.
 *
 * @param {Object} req the request
 */
async function changePassword (req) {
  await UserService.changePassword(req.user.uid, req.body)
}

module.exports = {
  logout,
  changePassword,
  search
}
