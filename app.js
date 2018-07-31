/**
 * Initialize and start the express application.
 */
global.Promise = require('bluebird')
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const config = require('config')
const morgan = require('morgan')
const cookieParser = require('cookie-parser')
const session = require('express-session')
const passport = require('passport')
const _ = require('lodash')
const { CronJob } = require('cron')
const ImporterJob = require('./src/services/importers')

const logger = require('./src/common/logger')
const configurePassport = require('./src/common/configure-passport')
const routes = require('./src/routes')

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development'
}

// Create app
const app = express()
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))

// For PassportJS
app.use(cookieParser())
app.use(session({
  secret: config.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}))

// Request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
} else if (process.env.NODE_ENV === 'production') {
  app.use(morgan('common', { skip: (req, res) => res.statusCode < 400 }))
}

// Public HTML files for testing purpose
if (process.env.NODE_ENV !== 'production') {
  app.use('/html', express.static('test_files/html'))
}

// Configure passport
configurePassport(passport)
app.use(passport.initialize())
app.use(passport.session())

// Routes
app.use(config.CONTEXT_PATH, routes)

// Error handler
app.use((err, req, res, next) => {
  let status = err.status || 500
  let message = err.message
  if (err.isJoi) {
    status = 400
    message = _(err.details).map('message').join(', ')
  } else if (status === 500) {
    message = 'Internal server error'
  }
  res.status(status)
  res.send({message})
  logger.error(err)
})

// Start the app
app.listen(config.PORT, '0.0.0.0')
logger.info('Express server listening on port %d in %s mode', config.PORT, process.env.NODE_ENV)

// Start the job
const job = new CronJob({
  cronTime: config.IMPORTER_CRON_TIME,
  onTick: () => {
    logger.info('Importer job started')
    ImporterJob.run()
      .then(() => {
        logger.info('Importer job completed')
      })
      .catch(err => {
        logger.error(`Importer job failed with error: ${err.message}`)
        logger.error(err)
      })
  }
})
job.start()
