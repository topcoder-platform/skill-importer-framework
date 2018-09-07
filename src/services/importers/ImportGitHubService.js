/**
 * The service to fetch events from GitHub.
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

// The Axios instance to make calls to GitHub website and API
const axios = Axios.create({
  headers: {
    'Authorization': `token ${config.GITHUB_ADMIN_TOKEN}`
  }
})
axiosRetry(axios, {
  retries: 3,
  retryDelay: (retryCount) => {
    logger.debug(`Retry #${retryCount} to fetch data from GitHub`)
    return retryCount * 10000
  },
  retryCondition: () => true // Always retry
})

// The date format used by GitHub
const dateFormat = 'YYYY-MM-DD'

/**
 * Fetch commits.
 * @param {String} username the username
 * @param {String} query the query
 * @returns {Array} the results
 * @private
 */
async function fetchCommits (username, query) {
  const url = `https://github.com/users/${username}/created_commits?${query}`
  logger.debug(`Requesting ${url}`)

  const response = await axios(url)
  const $ = cherio.load(response.data)
  return $('li a.muted-link')
    .get()
    .map(a => {
      const $a = $(a)
      const repo = $a.attr('href').split('/commits?')[0].substring(1) // e.g. abc/def
      const text = $a.text().trim() // e.g. 2 commits
      return {
        repo,
        text: `Created ${text} in ${repo}`,
        affectedPoints: parseInt(text.split(' ')[0], 10),
        affectedPointType: 'Commit'
      }
    })
}

/**
 * Fetch pull request reviews.
 * @param {String} username the username
 * @param {String} query the query
 * @returns {Array} the results
 * @private
 */
async function fetchPullRequestReviews (username, query) {
  const url = `https://github.com/users/${username}/created_pull_request_reviews?${query}`
  logger.debug(`Requesting ${url}`)

  const response = await axios(url)
  const $ = cherio.load(response.data)
  return $('li')
    .get()
    .map(li => {
      const $li = $(li)
      const date = moment($li.attr('id').slice(-10), dateFormat).toDate()
      const $a = $($li.find('a'))
      const text = $a.attr('href')
      const repo = text.split('/pull/')[0].substring(1)
      return {
        repo,
        date,
        text: `Reviewed pull request ${text}`,
        affectedPoints: 1,
        affectedPointType: 'PullRequestReview'
      }
    })
}

/**
 * Fetch pull requests.
 * @param {String} username the username
 * @param {String} query the query
 * @returns {Array} the results
 * @private
 */
async function fetchPullRequests (username, query) {
  const url = `https://github.com/users/${username}/created_pull_requests?${query}`
  logger.debug(`Requesting ${url}`)

  const response = await axios(url)
  const $ = cherio.load(response.data)
  return $('li')
    .get()
    .map(li => {
      const $li = $(li)
      const date = moment($li.attr('id').slice(-10), dateFormat).toDate()
      const $a = $($li.find('a'))
      const text = $a.attr('href')
      const repo = text.split('/pull/')[0].substring(1)
      return {
        repo,
        date,
        text: `Created pull request ${text}`,
        affectedPoints: 1,
        affectedPointType: 'PullRequest'
      }
    })
}

/**
 * Get main language of the repos.
 * @param {Array} repoNames the repo names
 * @param {Array} normalizedSkillNames the normalized skill names
 * @param {String} Authorization Optional Auth credentials for importing private repos
 * @returns {Object} the repo language map
 * @private
 */
async function getLanguages (repoNames, normalizedSkillNames, Authorization) {
  const map = {}
  for (let repoName of repoNames) {
    try {
      const response = await axios(`https://api.github.com/repos/${repoName}/languages`, { headers: { Authorization } })
      const languages = response.data

      logger.debug(`Repo ${repoName} languages: ${inspect(languages)}`)

      if (!_.isEmpty(languages)) {
        const language = _.keys(languages)[0]

        // Normalize it
        for (let normalizedSkillName of normalizedSkillNames) {
          const regex = RegExp(normalizedSkillName.regex, 'i')
          if (regex.test(language)) {
            map[repoName] = normalizedSkillName.name
            logger.debug(`Language ${language} is mapped to skill name ${normalizedSkillName.name}`)
            break
          }
        }

        if (!map[repoName]) {
          logger.info(`Language ${language} is not mapped with any skill name`)
        }
      }
    } catch (error) {
      logger.error(`Error getting details/languages for repo: ${repoName}`)
    }
  }

  logger.debug('All repo languages:')
  logger.debug(map)

  return map
}

/**
 * Get the private repo events for the user from the official GitHub API
 * @param {String} username The user's GitHub handle
 * @param {String} Authorization Auth credentials for importing private repos
 * @returns {Array} the list of private repo events
 * @private
 */
async function getPrivateRepoEvents (username, Authorization) {
  let events = []
  let page = 0

  // GitHub will return a maximum of 10 pages at 30 events per page.
  while (page < 10) {
    page += 1
    const {data: pageEvents} = await axios(`https://api.github.com/users/${username}/events`, {
      headers: {Authorization},
      params: {page}
    })
    if (_.isEmpty(pageEvents)) {
      break
    }
    events = _.concat(events, pageEvents)
  }

  const privateEvents = _.filter(events, event => !event.public)

  const processedEvents = _.map(privateEvents, event => {
    if (event.type === 'PullRequestEvent' && _.get(event, 'payload.action') === 'opened') {
      return ({
        repo: _.get(event, 'repo.name'),
        date: moment(event.created_at).toDate(),
        isPrivateRepo: true,
        text: `Created pull request ${_.get(event, 'payload.pull_request._links.html.href')}`,
        affectedPoints: 1,
        affectedPointType: 'PullRequest'
      })
    }

    if (event.type === 'PullRequestEvent' && _.get(event, 'payload.action') === 'closed') {
      return ({
        repo: _.get(event, 'repo.name'),
        date: moment(event.created_at).toDate(),
        isPrivateRepo: true,
        text: `Reviewed pull request ${_.get(event, 'payload.pull_request._links.html.href')}`,
        affectedPoints: 1,
        affectedPointType: 'PullRequestReview'
      })
    }

    if (event.type === 'PushEvent') {
      const commitCount = _.get(event, 'payload.size')
      const repo = _.get(event, 'repo.name')
      return {
        repo,
        date: moment(event.created_at).toDate(),
        isPrivateRepo: true,
        text: `Created ${pluralize('commit', commitCount, true)} in ${repo}`,
        affectedPoints: commitCount,
        affectedPointType: 'Commit'
      }
    }
  })

  // Remove null values from unsupported event types
  return _.filter(processedEvents)
}

/**
 * Fetch events from the website.
 * @param {Object} account the account
 * @param {Array} normalizedSkillNames the normalized skill names
 * @param {String} accessToken Optional OAuth token to allow import from private repositories.
 * @returns {Array} the array of events
 */
async function execute (account, normalizedSkillNames, accessToken) {
  const Authorization = accessToken ? `Bearer ${accessToken}` : null
  let events = []

  if (Authorization) {
    try {
      const privateEvents = await getPrivateRepoEvents(account.username, Authorization)
      logger.debug(`Found ${privateEvents.length} private repo events`)
      events = _.union(events, privateEvents)
    } catch (e) {
      logger.debug(`Unable to access private repos for ${account.username}`)
    }
  }

  // We count until the GitHub official launch (2008 April)
  const gitHubLaunchingAt = moment('2008-04-01', dateFormat)

  // And count from the current month
  const startOfMonth = moment().startOf('month')

  // Loop until the GitHub launching date
  while (startOfMonth >= gitHubLaunchingAt) {  // eslint-disable-line
    try {
      const endOfMonth = moment(startOfMonth).endOf('month')

      const query = `from=${startOfMonth.format(dateFormat)}&to=${endOfMonth.format(dateFormat)}`

      // Get commits
      const commits = await fetchCommits(account.username, query)
      _.each(commits, (item) => {
        item.date = startOfMonth.toDate()
      })
      logger.debug(`Found ${commits.length} Commits`)

      // Get PR reviews
      const pullRequestReviews = await fetchPullRequestReviews(account.username, query)
      logger.debug(`Found ${pullRequestReviews.length} Pull Request Reviews`)

      // Get PRs
      const pullRequests = await fetchPullRequests(account.username, query)
      logger.debug(`Found ${pullRequests.length} Pull Requests`)

      // Merge into the list
      events = _.union(events, commits, pullRequestReviews, pullRequests)
    } catch (error) {
      logger.debug('Could not fetch public data for above date range.  Skipping.')
    }
    // Continue with the previous month
    startOfMonth.add(-1, 'months')
  }

  logger.debug(`Found ${events.length} events`)

  // Get unique repo names
  const repoNames = _.uniq(_.map(events, 'repo'))
  const repoLanguages = await getLanguages(repoNames, normalizedSkillNames, Authorization)

  // Filter only events with language
  events = _.filter(events, (event) => repoLanguages[event.repo])

  _.each(events, (event) => {
    // Map the skill name
    event.affectedSkillName = repoLanguages[event.repo]
    delete event.repo
    return event
  })

  logger.debug(`Found ${events.length} events (matching NormalizedSkillNames)`)
  return events
}

module.exports = {
  execute
}

helper.buildService(module.exports, 'ImportGitHubService')
