/**
 * Configure passport strategies.
 */
const config = require('config')
const createError = require('http-errors')
const LocalStrategy = require('passport-local').Strategy
const GithubStrategy = require('passport-github2').Strategy
const GitlabStrategy = require('passport-gitlab2').Strategy

const UserService = require('../services/UserService')
const AccountService = require('../services/AccountService')
const {Websites, Roles} = require('../constants')

/**
 * Connect an external website account to the current logged user.
 *
 * @param {Object} req the request
 * @param {Object} profile the profile
 * @param {Function} done the done callback
 * @param {String} website the website
 * @private
 */
function connectAccount (req, profile, done, website) {
  const user = req.user
  if (!user) {
    throw createError.Unauthorized('Anonymous is not allowed to access')
  }
  if (user.role !== Roles.MEMBER) {
    throw createError.Unauthorized(`Action is not allowed for ${user.role} role`)
  }

  AccountService.createIfNotExists({
    userUid: user.uid,
    username: profile.username,
    website
  })
    .then((account) => {
      // Store the created account id to the request
      req.accountId = account.id
      done(null, user)
    })
    .catch(done)
}

/**
 * Configure passport.
 * @param passport the passport instance
 */
module.exports = (passport) => {
  passport.use('local-register', new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password',
    passReqToCallback: true
  }, (req, username, password, done) => {
    UserService.create({
      username,
      password,
      name: req.body.name
    }).then((user) => {
      done(null, user)
    }).catch(done)
  }))

  passport.use('local-login', new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password'
  }, (username, password, done) => {
    UserService.login(username, password)
      .then((user) => {
        done(null, user)
      })
      .catch(done)
  }))

  passport.use(new GithubStrategy(config.GITHUB_AUTH_CONFIG,
    (req, accessToken, refreshToken, profile, done) => {
      connectAccount(req, profile, done, Websites.GITHUB)
    }))

  passport.use(new GitlabStrategy(config.GITLAB_AUTH_CONFIG,
    (req, accessToken, refreshToken, profile, done) => {
      connectAccount(req, profile, done, Websites.GITLAB)
    }))

  // Serialize the user for the session
  passport.serializeUser((user, done) => {
    done(null, user)
  })

  // Deserialize the user
  passport.deserializeUser((user, done) => {
    done(null, user)
  })
}
