/**
 * Configure application routes.
 */
const {Router} = require('express')
const requireDir = require('require-dir')
const passport = require('passport')
const _ = require('lodash')

const auth = require('./common/auth-middleware')
const {Roles, Websites} = require('./constants')
const controllers = requireDir('./controllers')
const ImporterJob = require('./services/importers')

const router = Router()
const allRoles = _.values(Roles)

// Wrap controller methods to Express middleware style
const wrap = (fn, status) => (req, res, next) =>
  fn(req)
    .then((result) => {
      res.status(status || (result ? 200 : 204))
      if (result) {
        res.send(result)
      } else {
        res.end()
      }
      next()
    })
    .catch(next)

const passportOptions = {failWithError: true}

// User endpoints
router.post(
  '/users',
  passport.authenticate('local-register', passportOptions),
  (req, res) => res.status(201).end()
)
router.post(
  '/login',
  passport.authenticate('local-login', passportOptions),
  (req, res) => { res.json(req.user) }
)
router.post('/logout', auth(allRoles), wrap(controllers.UserController.logout))

router.post('/changePassword', auth(allRoles), wrap(controllers.UserController.changePassword))
router.get('/users', wrap(controllers.UserController.search))

// Account endpoints
router.get(
  `/connect/${Websites.GITHUB.toLowerCase()}`,
  passport.authenticate(Websites.GITHUB.toLowerCase())
)
router.get(
  `/connect/${Websites.GITHUB.toLowerCase()}/callback`,
  passport.authenticate(Websites.GITHUB.toLowerCase(), passportOptions),
  async (req, res) => {
    // Instead of sending a message to the client,
    // we may redirect the browser to a specified landing page, such as the Accounts listing page
    res.status(201).send({ message: 'Account is connected successfully' })

    // Start the importing immediately for the new GitHub account
    await ImporterJob.run(req.accountId)
  }
)

router.get('/accounts', wrap(controllers.AccountController.search))
router.delete('/accounts/:id', auth(allRoles), wrap(controllers.AccountController.remove))
router.get('/accounts/:id/importingStatus', wrap(controllers.AccountController.getImportingStatus))

// NormalizedSkillName endpoints
router.get('/normalizedSkillNames', wrap(controllers.NormalizedSkillNameController.search))
router.post('/normalizedSkillNames', auth(Roles.ADMIN), wrap(controllers.NormalizedSkillNameController.create, 201))
router.put('/normalizedSkillNames/:name', auth(Roles.ADMIN), wrap(controllers.NormalizedSkillNameController.update))
router.delete('/normalizedSkillNames/:name', auth(Roles.ADMIN), wrap(controllers.NormalizedSkillNameController.remove))

// Skill endpoints
router.get('/users/:uid/skills', wrap(controllers.SkillController.getUserSkills))
router.get('/accounts/:accountId/skills', wrap(controllers.SkillController.getAccountSkills))
router.post('/accounts/:accountId/skills', auth(Roles.ADMIN), wrap(controllers.SkillController.create, 201))
router.put('/accounts/:accountId/skills/:skillId', auth(Roles.ADMIN), wrap(controllers.SkillController.update))
router.delete('/accounts/:accountId/skills/:skillId', auth(Roles.ADMIN), wrap(controllers.SkillController.remove))

// Event endpoints
router.get('/events', auth(allRoles), wrap(controllers.EventController.search))
router.post('/events', auth(Roles.ADMIN), wrap(controllers.EventController.create, 201))
router.delete('/events/:id', auth(Roles.ADMIN), wrap(controllers.EventController.remove))

// Endpoint to invoke the importer job, for testing only
if (process.env.NODE_ENV !== 'production') {
  router.post('/runImporterJob', auth(Roles.ADMIN), async (req, res) => {
    res.status(204).end()
    await ImporterJob.run()
  })
}

module.exports = router
