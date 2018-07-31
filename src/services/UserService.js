/**
 * This service provides operations to manage User.
 */
const Joi = require('joi')
const createError = require('http-errors')
const _ = require('lodash')

const helper = require('../common/helper')
const constants = require('../constants')
const { User } = require('../models')

/**
 * Ensure that the specified user is not duplicated.
 *
 * @param {Object} user the user
 * @private
 */
async function ensureNotDuplicate (user) {
  const criteria = {
    username: { eq: user.username }
  }
  await helper.ensureNotExist(User, criteria, {}, 'username already registered')
}

/**
 * Create a new user.
 *
 * @param {Object} payload the payload
 * @returns {Object} the created user
 */
async function create (payload) {
  await ensureNotDuplicate(payload)

  payload.passwordHash = helper.hashPassword(payload.password)

  const user = new User(payload)
  return user.save()
}

create.schema = {
  payload: Joi.object().keys({
    username: Joi.string().required(),
    password: Joi.string().required(),
    name: Joi.string().required(),
    role: Joi.string().allow(_.values(constants.Roles)).default(constants.Roles.MEMBER)
  })
}

/**
 * Search users.
 *
 * @param {Object} criteria the search criteria
 * @returns {Object} the search result
 */
async function search (criteria) {
  const filterExpressions = []
  const expressionAttributeNames = {}
  const expressionAttributeValues = {}

  // username LIKE '%xxx%'
  if (criteria.username) {
    filterExpressions.push('contains (username, :username)')
    expressionAttributeValues[':username'] = criteria.username
  }

  // role = 'xxx'
  if (criteria.role) {
    filterExpressions.push('#role = :role')
    expressionAttributeNames['#role'] = 'role'
    expressionAttributeValues[':role'] = criteria.role
  }

  // name LIKE '%xxx%'
  if (criteria.name) {
    filterExpressions.push('contains (#name, :name)')
    expressionAttributeNames['#name'] = 'name'
    expressionAttributeValues[':name'] = criteria.name
  }

  // Matching a skill set
  _.forEach(criteria.skills, (skill, index) => {
    filterExpressions.push(`contains (skillNames, :skill${index})`)
    expressionAttributeValues[`:skill${index}`] = skill
  })

  // Build the filter
  const filter = {}
  if (!_.isEmpty(filterExpressions)) {
    filter.FilterExpression = _.join(filterExpressions, ' and ')
    filter.ExpressionAttributeNames = expressionAttributeNames
    filter.ExpressionAttributeValues = expressionAttributeValues
  }

  // Search
  const result = await helper.findAll(User, filter, criteria)

  result.items = _.map(
    result.items,
    item => _.omit(
      JSON.parse(JSON.stringify(item)), 'passwordHash', 'skills', 'skillNames')
  )

  return result
}

search.schema = {
  criteria: Joi.object().keys({
    limit: Joi.number().integer().min(1),
    offset: Joi.number().integer().min(0).default(0),
    sortBy: Joi.string().valid('username', 'name').default('username'),
    sortDirection: Joi.string().valid('asc', 'desc').default('asc'),
    role: Joi.string().valid(_.values(constants.Roles)),
    username: Joi.string(),
    name: Joi.string(),
    skills: Joi.array().items(Joi.string())
  })
}

/**
 * Login using username and password.
 *
 * @param {String} username the username
 * @param {String} password the password
 * @returns {Object} the user
 */
async function login (username, password) {
  const user = await User.queryOne({ username: { eq: username } }).exec()

  if (user) {
    helper.checkPassword(password, user.passwordHash)
    const userJson = _.omit(JSON.parse(JSON.stringify(user)), 'passwordHash', 'skills', 'skillNames')
    userJson.accessToken = await helper.signToken(userJson)
    return userJson
  }

  throw createError.Unauthorized('username or password is incorrect')
}

login.schema = {
  username: Joi.string().required(),
  password: Joi.string().required()
}

/**
 * Change password for the specified user.
 *
 * @param {String} uid the user uid
 * @param {Object} request the request
 */
async function changePassword (uid, request) {
  const user = await helper.ensureExist(User, { uid })

  helper.checkPassword(request.currentPassword, user.passwordHash, 'The current password is not correct')

  user.passwordHash = helper.hashPassword(request.newPassword)
  await user.save()
}

changePassword.schema = {
  uid: Joi.string().uuid().required(),
  request: Joi.object().keys({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().required()
  })
}

module.exports = {
  create,
  search,
  login,
  changePassword
}

helper.buildService(module.exports)
