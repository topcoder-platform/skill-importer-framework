/**
 * The service to fetch events from GitLab.
 */
const _ = require('lodash')
const {inspect} = require('util')
const config = require('config')
const Axios = require('axios')
const axiosRetry = require('axios-retry')
const moment = require('moment')
const pluralize = require('pluralize')
const helper = require('../../common/helper')
const logger = require('../../common/logger')

// The Axios instance to make calls to GitLab website and API
const axios = Axios.create({
  headers: {
    'Private-Token': `${config.GITLAB_ADMIN_TOKEN}`
  },
  baseURL: 'https://gitlab.com/api/v4/'
})
axiosRetry(axios, {
  retries: 3,
  retryDelay: (retryCount) => {
    logger.debug(`Retry #${retryCount} to fetch data from GitLab`)
    return retryCount * 10000
  },
  retryCondition: () => true // Always retry
})

/**
 * Get user commit events.
 * @param {String} userId the userId
 * @param {String} Authorization Auth credentials for importing private repos
 * @returns {Array} the results
 * @private
 */
async function getCommits (userId, Authorization) {
  const { data: pushEvents } = await axios(`users/${userId}/events`, { headers: { Authorization }, params: { action: 'pushed' } })

  return _.map(pushEvents, (event) => {
    const projectId = event.project_id
    const commitCount = _.get(event, 'push_data.commit_count') || 0
    return {
      affectedPoints: commitCount,
      affectedPointType: 'Commit',
      date: moment(event.created_at).toDate(),
      projectId,
      // Delay setting text until we have the project name resolved
      finishText: projectName => `Created ${pluralize('commit', commitCount, true)} in ${projectName}`
    }
  })
}

/**
 * Get user open/create merge request events.
 * @param {String} userId the userId
 * @param {String} Authorization Auth credentials for importing private repos
 * @returns {Array} the results
 * @private
 */
async function getMergeRequests (userId, Authorization) {
  const { data: mergeEvents } = await axios(`users/${userId}/events`, { headers: { Authorization }, params: { action: 'created', target_type: 'merge_request' } })

  return _.map(mergeEvents, (event) => {
    const projectId = event.project_id
    return {
      affectedPoints: 1,
      affectedPointType: 'PullRequest',
      date: moment(event.created_at).toDate(),
      projectId,
      // Delay setting text until we have the project name resolved
      finishText: projectName => `Created merge request "${event.target_title}" in ${projectName}`
    }
  })
}

/**
 * Get user approve/review merge request events.
 * @param {String} userId the userId
 * @param {String} Authorization Auth credentials for importing private repos
 * @returns {Array} the results
 * @private
 */
async function getMergeRequestReviews (userId, Authorization) {
  const { data: mergeEvents } = await axios(`users/${userId}/events`, { headers: { Authorization }, params: { action: 'merged', target_type: 'merge_request' } })

  return _.map(mergeEvents, (event) => {
    const projectId = event.project_id
    return {
      affectedPoints: 1,
      affectedPointType: 'PullRequestReview',
      date: moment(event.created_at).toDate(),
      projectId,
      // Delay setting text until we have the project name resolved
      finishText: projectName => `Reviewed merge request "${event.target_title}" in ${projectName}`
    }
  })
}

/**
 * Get main language of the projects (repos) and their text names.
 * GitLab does not provide an API endpoint for languages, but does implement
 * a human-readable html page where this data can be scraped.
 * @param {Array} projectIds the project IDs
 * @param {Array} normalizedSkillNames the normalized skill names
 * @param {String} Authorization Auth credentials for importing private repos
 * @returns {Object} the project (repo) language map and name map and visibility map (public or private)
 * @private
 */
async function getProjectNamesAndLanguages (projectIds, normalizedSkillNames, Authorization) {
  const projectLanguages = {}
  const projectNames = {}
  const privateProjects = {}

  for (let id of projectIds) {
    try {
      // First it is necessary to retrieve the web_url and name for the project
      const { data: projectInfo } = await axios(`projects/${id}`, { headers: { Authorization } })
      const projectName = projectInfo.name

      projectNames[id] = projectName

      if (projectInfo.visibility === 'private') {
        privateProjects[id] = true
      }

      const { data: languages } = await axios(`projects/${id}/languages`, { headers: { Authorization } })

      logger.debug(`Project (repo) ${projectName} languages: ${inspect(languages)}`)

      if (!_.isEmpty(languages)) {
        const language = _.keys(languages)[0]

        // Normalize it
        for (let normalizedSkillName of normalizedSkillNames) {
          const regex = RegExp(normalizedSkillName.regex, 'i')
          if (regex.test(language)) {
            projectLanguages[id] = normalizedSkillName.name
            logger.debug(`Language ${language} is mapped to skill name ${normalizedSkillName.name}`)
            break
          }
        }

        if (!projectLanguages[id]) {
          logger.info(`Language ${language} is not mapped with any skill name`)
        }
      }
    } catch (error) {
      logger.error(`Error getting details/languages for project: ${id}`)
    }
  }

  logger.debug('All project/repo languages:')
  logger.debug(_.map(projectIds, id => `${projectNames[id]}${privateProjects[id] ? ' (private)' : ''}: ${projectLanguages[id]}`))

  return { projectNames, projectLanguages, privateProjects }
}

/**
 * Fetch events from the website.
 * @param {Object} account the account
 * @param {Array} normalizedSkillNames the normalized skill names
 * @param {String} accessToken Optional OAuth token to allow import from private repositories.
 * @returns {Array} the array of events
 */
async function execute (account, normalizedSkillNames, accessToken) {
  // Retrieve User Info using stored username
  const Authorization = accessToken ? `Bearer ${accessToken}` : null
  const { data: userInfo } = await axios(`/users`, { headers: { Authorization }, params: { username: account.username } })
  const userId = userInfo[0].id

  logger.debug(`Found GitLab User: ${inspect(userInfo)}`)

  // Retrieve events to search for skill data
  const commits = await getCommits(userId, Authorization)
  logger.debug(`Found ${commits.length} Commits`)

  const mergeRequests = await getMergeRequests(userId, Authorization)
  logger.debug(`Found ${mergeRequests.length} Merge Requests`)

  const mergeRequestReviews = await getMergeRequestReviews(userId, Authorization)
  logger.debug(`Found ${mergeRequestReviews.length} Merge Request Reviews`)

  let events = _.union(commits, mergeRequests, mergeRequestReviews)
  logger.debug(`Found ${events.length} events`)

  // Get unique repo names
  const projectIds = _.uniq(_.map(events, 'projectId'))
  const { projectNames, projectLanguages, privateProjects } = await getProjectNamesAndLanguages(projectIds, normalizedSkillNames, Authorization)

  // Filter only events with language
  events = _.filter(events, (event) => projectLanguages[event.projectId])

  _.each(events, (event) => {
    // Map the skill name
    const projectName = projectNames[event.projectId]
    event.affectedSkillName = projectLanguages[event.projectId]
    event.isPrivateRepo = !!privateProjects[event.projectId]
    event.text = event.finishText(projectName)

    delete event.finishText
    delete event.projectId

    return event
  })

  logger.debug(`Found ${events.length} events (${_.size(privateProjects)} private) matching NormalizedSkillNames`)
  return events
}

module.exports = {
  execute
}

helper.buildService(module.exports, 'ImportGitLabService')
