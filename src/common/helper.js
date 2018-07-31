/**
 * This file defines helper methods.
 */
const util = require('util')
const _ = require('lodash')
const Joi = require('joi')
const getParams = require('get-parameter-names')
const config = require('config')
const createError = require('http-errors')
const bcrypt = require('bcrypt-nodejs')
const jwt = require('jsonwebtoken')
const { ImportingStatuses } = require('../constants')
const logger = require('./logger')

/**
 * Remove sensitive properties from the object and hide long arrays.
 *
 * @param {Object} obj the object
 * @returns {Object} the new object with removed properties
 * @private
 */
function sanitizeObject (obj) {
  try {
    return JSON.parse(JSON.stringify(obj, (name, value) => {
      // Array of property names that should not be logged
      const removeFields = [
        'password',
        'currentPassword',
        'newPassword',
        'token',
        'accessToken',
        'passwordHash'
      ]
      if (_.includes(removeFields, name)) {
        return '<removed>'
      }
      if (_.isArray(value) && value.length > 30) {
        return `Array(${value.length})`
      }
      return value
    }))
  } catch (e) {
    return obj
  }
}

/**
 * Convert array with arguments to object.
 *
 * @param {Array} params the name of parameters
 * @param {Array} arr the array with values
 * @returns {Object} the combined object
 * @private
 */
function combineObject (params, arr) {
  const ret = {}
  _.forEach(arr, (arg, i) => {
    ret[params[i]] = arg
  })
  return ret
}

/**
 * Decorate all functions of a service and log debug information if DEBUG is enabled.
 *
 * @param {Object} service the service
 * @param {String} serviceName the service name
 * @private
 */
function decorateWithLogging (service, serviceName) {
  if (config.LOG_LEVEL !== 'debug') {
    return
  }
  _.forEach(service, (method, name) => {
    const params = method.params || getParams(method)
    service[name] = async function serviceMethodWithLogging (...args) {
      const methodSignature = `${serviceName ? serviceName + '#' : ''}${name}`
      logger.debug(`ENTER ${methodSignature}`)
      logger.debug('input arguments')
      logger.debug(util.inspect(sanitizeObject(combineObject(params, args))))
      const result = await method.apply(this, args)
      logger.debug(`EXIT ${methodSignature}`)
      logger.debug('output arguments')
      logger.debug(util.inspect(sanitizeObject(result)))
      return result
    }
  })
}

/**
 * Decorate all functions of a service and validate input values
 * and replace input arguments with sanitized result = require('Joi.
 * Service method must have a `schema` property with Joi schema.
 *
 * @param {Object} service the service
 * @param {String} serviceName the service name
 * @private
 */
function decorateWithValidator (service) {
  _.forEach(service, (method, name) => {
    if (!method.schema) {
      return
    }
    const params = getParams(method)
    service[name] = async function serviceMethodWithValidation (...args) {
      const value = combineObject(params, args)
      const normalized = await Joi.validate(value, method.schema, { abortEarly: false })
      // Joi will normalize values
      // for example string number '1' to 1
      // if schema type is number
      const newArgs = _.map(params, (param) => normalized[param])
      return method.apply(this, newArgs)
    }
    service[name].params = params
  })
}

/**
 * Apply logger and validation decorators to the service.
 *
 * @param {Object} service the service to wrap
 * @param {String} serviceName the service name
 */
function buildService (service, serviceName) {
  decorateWithValidator(service)
  decorateWithLogging(service, serviceName)
}

/**
 * Check if a password is correct or not against a hashed value.
 *
 * @param {String} plainPassword the plain password to check
 * @param {String} hashedPassword the hashed password
 * @param {String} errorMessage the error message
 */
function checkPassword (plainPassword, hashedPassword, errorMessage) {
  if (!bcrypt.compareSync(plainPassword, hashedPassword)) {
    throw createError.Unauthorized(errorMessage || 'Wrong credentials')
  }
}

/**
 * Hash a password.
 *
 * @param {String} password the plain password to hash
 * @returns {String} the hashed password
 */
function hashPassword (password) {
  return bcrypt.hashSync(password)
}

/**
 * Sign the token.
 *
 * @param {Object} obj the object to sign
 * @param {String} expiresIn the token expiration
 * @returns {String} the token
 */
function signToken (obj) {
  return jwt.sign(obj, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN })
}

/**
 * Verify the token.
 *
 * @param {String} token the token to verify
 * @returns {Object} the object decoded from the token
 */
function verifyToken (token) {
  if (!token) {
    throw createError.Unauthorized('Action is not allowed for anonymous')
  }

  let decoded
  try {
    decoded = jwt.verify(token, config.JWT_SECRET)
  } catch (err) {
    if (err.message === 'jwt expired') {
      throw createError.Unauthorized('Token has been expired')
    }
    throw createError.Unauthorized('Failed to verify token')
  }

  if (!decoded) {
    throw createError.Unauthorized('Failed to decode token')
  }

  return decoded
}

/**
 * Check if the importing is running on an account or not.
 * @param {Object} account the account
 * @returns {Boolean} true if the importing is running, otherwise false
 */
function isImporting (account) {
  const now = new Date()

  if (account.importingStatus === ImportingStatuses.RUNNING &&
    account.importingStartsAt &&
    (now.getTime() - account.importingStartsAt.getTime() < 1800000)) {
    // The importingStartsAt is set, and not before 30 minutes ago
    return true
  }

  return false
}

/**
 * Find an entity for given criteria.
 *
 * @param {Object} Model the model to query
 * @param {Object} keyCriteria the key criteria
 * @param {Object} filters the filters
 * @private
 */
async function findOne (Model, keyCriteria, filters) {
  const query = Model.queryOne(keyCriteria)
  _.each(filters, (value, key) => {
    query.filter(key).eq(value)
  })
  return query.exec()
}

/**
 * Ensure entity exists for given criteria. Throw error if no result.
 *
 * @param {Object} Model the model to query
 * @param {Object} keyCriteria the key criteria
 * @param {Object} filters the filters
 * @param {String} errorMessage the error message
 */
async function ensureExist (Model, keyCriteria, filters, errorMessage) {
  const result = await findOne(Model, keyCriteria, filters)
  if (!result) {
    throw createError.NotFound(errorMessage || `${Model.name.split('-')[1]} not found`)
  }
  return result
}

/**
 * Ensure entity does not exist for given criteria. Throw error if found.
 *
 * @param {Object} Model the model to query
 * @param {Object} keyCriteria the key criteria
 * @param {Object} filters the filters
 * @param {String} errorMessage the error message
 */
async function ensureNotExist (Model, keyCriteria, filters, errorMessage) {
  const result = await findOne(Model, keyCriteria, filters)
  if (result) {
    throw createError.BadRequest(errorMessage || `${Model.name.split('-')[1]} already exists`)
  }
}

/**
 * Find and remove entity.
 *
 * @param {Object} Model the model to query
 * @param {Object} keyCriteria the key criteria
 * @param {Object} filters the filters
 */
async function findOneAndRemove (Model, keyCriteria, filters) {
  let result = await ensureExist(Model, keyCriteria, filters)
  return result.delete()
}

/**
 * Find all entities.
 * @param {Object} Model the model to scan
 * @param {Object} filter the filter
 * @param {Number} pagingCriteria the paging criteria
 * @returns {Object} the results
 */
async function findAll (Model, filter, pagingCriteria) {
  // Scan all items
  let items = await Model.scan(filter).exec()
  while (items.lastKey) {
    items = await Model.scan(filter).startKey(items.startKey).exec()
  }

  // Apply paging
  if (pagingCriteria) {
    // Get the total
    const total = items.length

    // Sort
    items = _.orderBy(items, pagingCriteria.sortBy, pagingCriteria.sortDirection)

    // Take
    if (_.isInteger(pagingCriteria.limit)) {
      items = _(items).slice(pagingCriteria.offset).take(pagingCriteria.limit).value()
    } else {
      items = _(items).slice(pagingCriteria.offset).value()
    }

    return { total, items }
  }

  // Return all items without paging
  return items
}

module.exports = {
  buildService,
  checkPassword,
  hashPassword,
  signToken,
  verifyToken,
  isImporting,
  ensureExist,
  ensureNotExist,
  findOneAndRemove,
  findAll
}
