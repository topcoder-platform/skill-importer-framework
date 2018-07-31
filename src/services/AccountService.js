/**
 * This service provides operations to manage Account.
 */
const Joi = require('joi')
const _ = require('lodash')
const createError = require('http-errors')
const helper = require('../common/helper')
const { Websites, Roles, ImportingStatuses } = require('../constants')
const { Account, User } = require('../models')

/**
 * Ensure that the specified account is not duplicated.
 *
 * @param {Object} account the account
 * @private
 */
async function ensureNotDuplicate (account) {
  // User can connect only one account for each external website
  let dupAccounts = await Account
    .query('website').eq(account.website)
    .filter('userUid').eq(account.userUid)
    .exec()
  if (!_.isEmpty(dupAccounts)) {
    throw createError.BadRequest(`your account has been connected to website ${account.website} already`)
  }

  // User cannot connect to an external website account
  // which has been connected to another user
  dupAccounts = await Account
    .query('website').eq(account.website)
    .filter('username').eq(account.username)
    .exec()
  if (!_.isEmpty(dupAccounts)) {
    throw createError.BadRequest(`username ${account.username} of website ${account.website} has been connected to another member already`)
  }
}

/**
 * Create a new account.
 *
 * @param {Object} account the account to create
 * @returns {Object} the created account
 */
async function create (account) {
  await ensureNotDuplicate(account)

  return Account.create(account)
}

create.schema = {
  account: Joi.object().keys({
    userUid: Joi.string().uuid().required(),
    username: Joi.string().required(),
    website: Joi.string().valid(_.values(Websites)).required()
  })
}

/**
 * Search accounts.
 *
 * @param {Object} criteria the search criteria
 * @returns {Object} the search result
 */
async function search (criteria) {
  await helper.ensureExist(User, { uid: criteria.userUid })

  return helper.findAll(Account, criteria)
}

search.schema = {
  criteria: Joi.object().keys({
    userUid: Joi.string().uuid().required()
  })
}

/**
 * Delete an account by id.
 *
 * @param {String} id the id
 * @param {Object} currentUser the current logged in user
 */
async function remove (id, currentUser) {
  const account = await helper.ensureExist(Account, { id })

  if (currentUser.role !== Roles.ADMIN && account.userUid !== currentUser.uid) {
    throw createError.Forbidden('You are not allowed to delete account of another user')
  }

  await account.delete()

  // TODO
  // Delete all Skills, Events, User.skillNames which are associated with this account
}

remove.schema = {
  id: Joi.string().uuid().required(),
  currentUser: Joi.object()
}

/**
 * Get an account's importing status.
 *
 * @param {String} id the id
 * @returns {Object} the importing status
 */
async function getImportingStatus (id) {
  const account = await helper.ensureExist(Account, { id })

  let importingStatus = account.importingStatus
  let timestamp = account.importingCompletesAt || null

  // In case the app crashes during the importing
  if (importingStatus === ImportingStatuses.RUNNING && !helper.isImporting(account)) {
    importingStatus = ImportingStatuses.FAILED
    timestamp = account.importingStartsAt
  }

  return {
    importingStatus,
    timestamp
  }
}

getImportingStatus.schema = {
  id: Joi.string().uuid().required()
}

module.exports = {
  create,
  search,
  remove,
  getImportingStatus
}

helper.buildService(module.exports)
