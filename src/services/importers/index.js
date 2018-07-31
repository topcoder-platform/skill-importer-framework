/**
 * The importer job.
 */
const requireDir = require('require-dir')
const _ = require('lodash')
const { inspect } = require('util')
const logger = require('../../common/logger')
const helper = require('../../common/helper')
const SkillService = require('../SkillService')
const { Account, NormalizedSkillName, Skill, Event } = require('../../models')
const { ImportingStatuses } = require('../../constants')

const importerServices = requireDir('.')

/**
 * Update skills and events for the account and fetched events.
 * @param {Object} account the account
 * @param {Array} events the events
 */
async function updateSkillsAndEvents (account, events) {
  const skills = await helper.findAll(Skill, { accountId: account.id })
  let dbEvents = await helper.findAll(Event, { accountId: account.id })
  dbEvents = _.filter(dbEvents, (dbEvent) => !dbEvent.deletedAt)

  for (let event of events) {
    event.accountId = account.id
    event.userUid = account.userUid

    // Get the skill
    let skill = _.find(skills, {
      name: event.affectedSkillName,
      pointType: event.affectedPointType
    })

    // Create a new skill if not exist
    if (!skill) {
      skill = await SkillService.create({
        name: event.affectedSkillName,
        pointType: event.affectedPointType,
        points: 0,
        accountId: account.id
      })
      skills.push(skill)

      logger.debug(`Created a new skill ${inspect(skill)}`)
    }

    event.skillId = skill.id

    // Check if the event exists in DB
    const dbEvent = _.find(dbEvents, event)

    if (dbEvent) {
      // Existed, do nothing
      _.remove(dbEvents, { id: dbEvent.id })
    } else {
      // Not existed, create
      const newEvent = await Event.create(event)
      logger.debug(`Created a new event ${inspect(newEvent)}`)

      // Increase Skill points
      skill.points = skill.points + event.affectedPoints
      await skill.save()
    }
  }

  // Soft delete all the dbEvents which don't exist anymore
  await _.map(dbEvents, (dbEvent) => {
    logger.debug(`Deleted event ${inspect(dbEvent)}`)

    dbEvent.deletedAt = new Date()
    return dbEvent.save()
      .then(() => {
        // Decrease points
        const skill = _.find(skills, { id: dbEvent.skillId })
        skill.points = Math.max(skill.points - dbEvent.affectedPoints, 0)
        return skill.save()
      })
  })

  // Update user skill names
  await SkillService.updateUserSkillNames(account.userUid)
}

/**
 * Run the importer job.
 * @param {String} accountId the optional account id, null to run for all accounts
 */
async function run (accountId) {
  let accounts
  if (accountId) {
    accounts = await helper.findAll(Account, { id: accountId })
  } else {
    // Get all accounts
    accounts = await helper.findAll(Account, {})
  }

  // Get all NormalizedSkillNames
  const normalizedSkillNames = await helper.findAll(NormalizedSkillName, {})

  // Run for each account
  for (let account of accounts) {
    const importerServiceName = `Import${account.website}Service`
    const importerService = importerServices[importerServiceName]

    if (!importerService) {
      logger.info(`${importerServiceName} is not defined. Skipped for account ${account.id}`)
      continue
    }

    if (helper.isImporting(account)) {
      logger.info(`The importing has been started. Skipped for account ${account.id}`)
      continue
    }

    // Set the last run starts at
    account.importingStatus = ImportingStatuses.RUNNING
    account.importingStartsAt = new Date()
    await account.save()

    await importerService
      .execute(account, normalizedSkillNames)
      .then((events) => updateSkillsAndEvents(account, events))
      .then(() => {
        account.importingStatus = ImportingStatuses.COMPLETED
      })
      .catch(err => {
        logger.error(`Failed to import skills for account ${account.id}: ${err.message}`)
        logger.error(err)

        account.importingStatus = ImportingStatuses.FAILED
      })

    // Set the last run completes at (both successful and failed)
    account.importingCompletesAt = new Date()
    await account.save()
  }
}

module.exports = {
  run
}

helper.buildService(module.exports)
