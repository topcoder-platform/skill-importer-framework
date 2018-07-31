/**
 * Generate admin users.
 */
const logger = require('../src/common/logger')
const UserService = require('../src/services/UserService')
const {Roles} = require('../src/constants')

/**
 * Generate data.
 */
async function generate () {
  logger.debug('Generating admin users')

  await UserService.create({
    username: 'admin1',
    password: 'password',
    name: 'admin 1',
    role: Roles.ADMIN
  })
  await UserService.create({
    username: 'admin2',
    password: 'password',
    name: 'admin 2',
    role: Roles.ADMIN
  })

  logger.debug('Generating admin users - Completed')
}

generate()
  .then(process.exit)
  .catch(logger.error)
