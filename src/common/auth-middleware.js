/**
 * Authentication and authorization middleware.
 */
const _ = require('lodash')
const createError = require('http-errors')
const helper = require('./helper')

/**
 * Check if the request is authenticated and authorized.
 *
 * @param {...String|Array<String>} allowedRoles the allowed roles
 * @returns {Function} the async auth middleware function
 */
function auth (...allowedRoles) {
  return async function authMiddleware (req, res, next) {
    let accessToken
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
      accessToken = req.headers.authorization.split(' ')[1]
    }

    if (!accessToken) {
      return next(createError.Unauthorized('Anonymous is not allowed to access'))
    }

    // Get user by access token
    let user
    try {
      user = helper.verifyToken(accessToken)
    } catch (err) {
      return next(err)
    }

    if (!user) {
      return next(createError.Unauthorized('Anonymous is not allowed to access'))
    }

    // Check role
    if (!_(allowedRoles).flatten().includes(user.role)) {
      return next(createError.Forbidden(`Action is not allowed for ${user.role} role`))
    }

    // Set user to the request
    req.user = user
    next()
  }
}

module.exports = auth
