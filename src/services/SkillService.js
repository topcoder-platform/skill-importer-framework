/**
 * This service provides operations to manage Skill.
 */
const Joi = require('joi')
const _ = require('lodash')
const helper = require('../common/helper')
const { Skill, User, Account, NormalizedSkillName } = require('../models')

/**
 * Update user skill names.
 * @param {String} userUid the user uid
 * @private
 */
async function updateUserSkillNames (userUid) {
  const skills = await getUserSkills(userUid)
  const user = await helper.ensureExist(User, { uid: userUid })

  user.skillNames = _(skills).filter(skill => skill.points > 0).map('name').uniq().value()
  await user.save()
}

/**
 * Create a new Skill.
 *
 * @param {Object} skill the skill to create
 * @returns {Object} the created skill
 */
async function create (skill) {
  await helper.ensureExist(NormalizedSkillName, { name: skill.name })
  const account = await helper.ensureExist(Account, { id: skill.accountId })
  skill.userUid = account.userUid

  // Skill name, pointType must be unique for each account
  await helper.ensureNotExist(Skill, { accountId: skill.accountId }, { name: skill.name, pointType: skill.pointType })

  const createdSkill = await Skill.create(skill)

  // Update User skillNames
  await updateUserSkillNames(skill.userUid)

  return createdSkill
}

create.schema = {
  skill: Joi.object().keys({
    name: Joi.string().required(),
    pointType: Joi.string().required(),
    points: Joi.number().min(0).required(),
    accountId: Joi.string().uuid().required()
  })
}

/**
 * Get user skills.
 *
 * @param {String} userUid the user uid
 * @returns {Array} the search result
 */
async function getUserSkills (userUid) {
  return helper.findAll(Skill, { userUid })
}

getUserSkills.schema = {
  userUid: Joi.string().uuid().required()
}

/**
 * Get account skills.
 *
 * @param {String} userUid the account id
 * @returns {Array} the search result
 */
async function getAccountSkills (accountId) {
  return helper.findAll(Skill, { accountId })
}

getAccountSkills.schema = {
  accountId: Joi.string().uuid().required()
}

/**
 * Update a skill.
 *
 * @param {String} accountId the account id
 * @param {String} skillId the skill id
 * @param {Object} skill the skill to update
 * @returns {Object} the updated skill
 */
async function update (accountId, skillId, skill) {
  const dbSkill = await helper.ensureExist(Skill, { id: skillId }, { accountId })
  await helper.ensureExist(NormalizedSkillName, { name: skill.name })

  // Skill name, pointType must be unique for each account
  if (dbSkill.name !== skill.name || dbSkill.pointType !== skill.pointType) {
    await helper.ensureNotExist(Skill, { accountId }, { name: skill.name, pointType: skill.pointType })
  }

  _.assign(dbSkill, skill)
  await dbSkill.save()

  // Update User skillNames
  await updateUserSkillNames(dbSkill.userUid)

  return dbSkill
}

update.schema = {
  accountId: Joi.string().uuid().required(),
  skillId: Joi.string().uuid().required(),
  skill: Joi.object().keys({
    name: Joi.string().required(),
    pointType: Joi.string().required(),
    points: Joi.number().min(0).required()
  })
}

/**
 * Delete an Skill.
 *
 * @param {String} accountId the account id
 * @param {String} skillId the skill id
 */
async function remove (accountId, skillId) {
  const skill = await helper.ensureExist(Skill, { id: skillId })
  await helper.findOneAndRemove(Skill, { id: skillId }, { accountId })

  // Update User skillNames
  await updateUserSkillNames(skill.userUid)

  // TODO
  // Delete Events associated to this account skill
}

remove.schema = {
  accountId: Joi.string().uuid().required(),
  skillId: Joi.string().uuid().required()
}

module.exports = {
  create,
  getUserSkills,
  getAccountSkills,
  update,
  remove,
  updateUserSkillNames
}

helper.buildService(module.exports)
