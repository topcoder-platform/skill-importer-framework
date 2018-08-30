/**
 * The service to fetch events from GitLab.
 */
const _ = require('lodash')
const {inspect} = require('util')
const config = require('config')
const cherio = require('cherio')
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
  retries: 10,
  retryDelay: (retryCount) => {
    logger.debug(`Retry #${retryCount} to fetch data from GitLab`)
    return retryCount * 10000
  },
  retryCondition: () => true // Always retry
})

/**
 * Get user commit events.
 * @param {String} userId the userId
 * @returns {Array} the results
 * @private
 */
async function getCommits (userId) {
  const { data: pushEvents } = await axios(`users/${userId}/events`, { params: { action: 'pushed' } })

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
 * @returns {Array} the results
 * @private
 */
async function getMergeRequests (userId) {
  const { data: mergeEvents } = await axios(`users/${userId}/events`, { params: { action: 'created', target_type: 'merge_request' } })

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
 * @returns {Array} the results
 * @private
 */
async function getMergeRequestReviews (userId) {
  const { data: mergeEvents } = await axios(`users/${userId}/events`, { params: { action: 'merged', target_type: 'merge_request' } })

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
 * @returns {Object} the project (repo) language map and name map
 * @private
 */
async function getProjectNamesAndLanguages (projectIds, normalizedSkillNames) {
  const projectLanguages = {}
  const projectNames = {}
  for (let id of projectIds) {
    // First it is necessary to retrieve the web_url and name for the project
    const { data: projectInfo } = await axios(`projects/${id}`)
    const webURL = projectInfo.web_url
    const projectName = projectInfo.name

    projectNames[id] = projectName

    // Now we can load the 'languages' chart for the project and scrape the page
    // for the list of detected languages.
    const { data: languagesPage } = await axios(`graphs/master/charts`, { baseURL: webURL })

    const $ = cherio.load(languagesPage)
    const languages = $('ul.bordered-list li').get().map(li => $(li).text().trim().split('\n')[0])

    logger.debug(`Project (repo) ${projectName} languages: ${inspect(languages)}`)

    if (!_.isEmpty(languages)) {
      const language = languages[0]

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
  }

  logger.debug('All project/repo languages:')
  logger.debug(_.groupBy(projectNames, id => projectLanguages[id]))

  return { projectNames, projectLanguages }
}

/**
 * Fetch events from the website.
 * @param {Object} account the account
 * @param {Array} normalizedSkillNames the normalized skill names
 * @returns {Array} the array of events
 */
async function execute (account, normalizedSkillNames) {
  // Retrieve User Info using stored username
  const { data: userInfo } = await axios(`/users`, { params: { username: account.username } })
  const userId = userInfo[0].id

  logger.debug(`Found GitLab User: ${inspect(userInfo)}`)

  // Retrieve events to search for skill data
  const commits = await getCommits(userId)
  logger.debug(`Found ${commits.length} Commits`)

  const mergeRequests = await getMergeRequests(userId)
  logger.debug(`Found ${mergeRequests.length} Merge Requests`)

  const mergeRequestReviews = await getMergeRequestReviews(userId)
  logger.debug(`Found ${mergeRequestReviews.length} Merge Request Reviews`)

  let events = _.union(commits, mergeRequests, mergeRequestReviews)
  logger.debug(`Found ${events.length} events`)

  // Get unique repo names
  const projectIds = _.uniq(_.map(events, 'projectId'))
  const { projectNames, projectLanguages } = await getProjectNamesAndLanguages(projectIds, normalizedSkillNames)

  // Filter only events with language
  events = _.filter(events, (event) => projectLanguages[event.projectId])

  _.each(events, (event) => {
    // Map the skill name
    const projectName = projectNames[event.projectId]
    event.affectedSkillName = projectLanguages[event.projectId]
    event.text = event.finishText(projectName)

    delete event.finishText
    delete event.projectId

    return event
  })

  logger.debug(`Found ${events.length} events (matching NormalizedSkillNames)`)
  return events
}

module.exports = {
  execute
}

helper.buildService(module.exports, 'ImportGitLabService')