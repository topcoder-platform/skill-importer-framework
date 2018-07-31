/**
 * Generate test data.
 */
const _ = require('lodash')
const moment = require('moment')
const logger = require('../src/common/logger')
const helper = require('../src/common/helper')
const models = require('../src/models')
const constants = require('../src/constants')

/**
 * Clear data.
 */
async function clear () {
  logger.debug('Clearing all data')

  await helper.findAll(models.User, {})
    .then((docs) => models.User.batchDelete(_.map(docs, (doc) => ({ uid: doc.uid }))))

  await helper.findAll(models.Account, {})
    .then((docs) => models.Account.batchDelete(_.map(docs, (doc) => ({ id: doc.id }))))

  await helper.findAll(models.Skill, {})
    .then((docs) => models.Skill.batchDelete(_.map(docs, (doc) => ({ id: doc.id }))))

  await helper.findAll(models.Event, {})
    .then((docs) => models.Event.batchDelete(_.map(docs, (doc) => ({ id: doc.id }))))

  await helper.findAll(models.NormalizedSkillName, {})
    .then((docs) => models.NormalizedSkillName.batchDelete(_.map(docs, (doc) => ({ name: doc.name }))))

  logger.debug('Clearing all data - Completed')
}

/**
 * Generate data.
 */
async function generate () {
  logger.debug('Generating data')

  // Users
  await Promise.all(_.map(_.range(1, 10), (id) => {
    const user = {
      uid: `94b8677f-a21a-4749-8edb-971e4584939${id}`,
      username: `username${id}`,
      passwordHash: helper.hashPassword('password'),
      name: `name${id}`,
      role: (id === 1 ? constants.Roles.ADMIN : constants.Roles.MEMBER),
      skills: [
        { name: (id % 2 === 0 ? 'NodeJS' : 'Java'), pointType: 'Commit', points: id },
        { name: 'HTML', pointType: 'Pull Request', points: (id + 1) }
      ]
    }

    user.skillNames = _.map(user.skills, 'name')

    return models.User.create(user)
  }))

  // Accounts
  await Promise.all(_.map(_.range(1, 4), (id) => {
    const account = {
      id: `94b8677f-a21a-4749-8edb-971e4584940${id}`,
      username: `username${id + 1}`,
      website: constants.Websites.BEHANCE,
      userUid: `94b8677f-a21a-4749-8edb-971e4584939${id + 1}` // username2, username3, username4
    }

    return models.Account.create(account)
  }))
  // Another account for username4
  await models.Account.create({
    id: `94b8677f-a21a-4749-8edb-971e45849405`,
    username: `username4a`,
    website: constants.Websites.HACKER_NEWS,
    userUid: `94b8677f-a21a-4749-8edb-971e45849394`
  })
  // Github account for username8, username9
  await models.Account.create({
    id: `94b8677f-a21a-4749-8edb-971e45849406`,
    username: `octocat`, // https://github.com/octocat
    website: constants.Websites.GITHUB,
    userUid: `94b8677f-a21a-4749-8edb-971e45849398`
  })
  await models.Account.create({
    id: `94b8677f-a21a-4749-8edb-971e45849407`,
    username: `dougwilson`, // https://github.com/dougwilson
    website: constants.Websites.GITHUB,
    userUid: `94b8677f-a21a-4749-8edb-971e45849399`
  })

  // NormalizedSkillNames
  await models.NormalizedSkillName.create({ name: 'JavaScript', regex: '^(javascript|js)$' })
  await models.NormalizedSkillName.create({ name: 'Python', regex: '^(python|py)$' })
  await models.NormalizedSkillName.create({ name: 'Java', regex: '^(java|jdk|jre|j2ee|javaee)$' })
  await models.NormalizedSkillName.create({ name: 'Ruby', regex: '^(ruby)$' })
  await models.NormalizedSkillName.create({ name: 'PHP', regex: '^(php)$' })
  await models.NormalizedSkillName.create({ name: 'C++', regex: '^(c\\+\\+)$' })
  await models.NormalizedSkillName.create({ name: 'CSS', regex: '^(css)$' })
  await models.NormalizedSkillName.create({ name: 'C#', regex: '^(c#|c#\\.net|c# net|c# dotnet|csharp|c sharp)$' })
  await models.NormalizedSkillName.create({ name: 'Go', regex: '^(go)$' })
  await models.NormalizedSkillName.create({ name: 'C', regex: '^(c)$' })
  await models.NormalizedSkillName.create({ name: 'TypeScript', regex: '^(typescript|ts)$' })
  await models.NormalizedSkillName.create({ name: 'Shell', regex: '^(shell)$' })
  await models.NormalizedSkillName.create({ name: 'Swift', regex: '^(swift)$' })
  await models.NormalizedSkillName.create({ name: 'Scala', regex: '^scala$' })
  await models.NormalizedSkillName.create({ name: 'Objective-C', regex: '^(objective c|objective\\-c)$' })
  await models.NormalizedSkillName.create({ name: 'HTML', regex: '^(html)$' })
  await models.NormalizedSkillName.create({ name: 'Perl', regex: '^(perl)$' })

  // Skills
  await models.Skill.create({
    id: '94b8677f-0000-0000-8edb-971e45849000',
    name: 'Ruby',
    pointType: 'Commit',
    points: 3,
    accountId: '94b8677f-a21a-4749-8edb-971e45849406', // GitHub octocat
    userUid: '94b8677f-a21a-4749-8edb-971e45849398'
  })
  await models.Skill.create({
    id: '94b8677f-0000-0000-8edb-971e45849001',
    name: 'JavaScript',
    pointType: 'PullRequestReview',
    points: 4,
    accountId: '94b8677f-a21a-4749-8edb-971e45849407', // GitHub dougwilson
    userUid: '94b8677f-a21a-4749-8edb-971e45849399'
  })
  await models.Skill.create({
    id: '94b8677f-0000-0000-8edb-971e45849002',
    name: 'Python',
    pointType: 'PullRequest',
    points: 5,
    accountId: '94b8677f-a21a-4749-8edb-971e45849407', // GitHub dougwilson
    userUid: '94b8677f-a21a-4749-8edb-971e45849399'
  })

  // Events
  await models.Event.create({
    id: '94b8677f-0000-4749-8edb-971e45849000',
    date: moment('2018-07-01', 'YYYY-MM-DD'),
    text: 'Created 3 commits in abc/def repo',

    skillId: '94b8677f-0000-0000-8edb-971e45849000',
    affectedPoints: 3,
    deletedAt: null,

    affectedSkillName: 'Ruby',
    affectedPointType: 'Commit',
    accountId: '94b8677f-a21a-4749-8edb-971e45849406', // GitHub octocat
    userUid: '94b8677f-a21a-4749-8edb-971e45849398'
  })
  await models.Event.create({
    id: '94b8677f-0000-4749-8edb-971e45849001',
    date: moment('2018-07-02', 'YYYY-MM-DD'),
    text: 'Reviewed 4 pull requests in abc/def repo',

    skillId: '94b8677f-0000-0000-8edb-971e45849001',
    affectedPoints: 4,
    deletedAt: null,

    affectedSkillName: 'JavaScript',
    affectedPointType: 'PullRequestReview',
    accountId: '94b8677f-a21a-4749-8edb-971e45849407', // GitHub dougwilson
    userUid: '94b8677f-a21a-4749-8edb-971e45849399'
  })
  await models.Event.create({
    id: '94b8677f-0000-4749-8edb-971e45849002',
    date: moment('2018-07-03', 'YYYY-MM-DD'),
    text: 'Created 5 pull requests in abc/def repo',

    skillId: '94b8677f-0000-0000-8edb-971e45849002',
    affectedPoints: 5,
    deletedAt: null,

    affectedSkillName: 'Python',
    affectedPointType: 'PullRequest',
    accountId: '94b8677f-a21a-4749-8edb-971e45849407', // GitHub dougwilson
    userUid: '94b8677f-a21a-4749-8edb-971e45849399'
  })

  logger.debug('Generating data - Completed')
}

clear()
  .then(generate)
  .then(process.exit)
  .catch(logger.error)
