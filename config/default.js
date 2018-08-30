/**
 * The default configuration.
 */
module.exports = {
  LOG_LEVEL: process.env.LOG_LEVEL || 'debug',
  CONTEXT_PATH: process.env.CONTEXT_PATH || '/api/v1',
  PORT: process.env.PORT || 3000,
  JWT_SECRET: process.env.JWT_SECRET || 'skill-importer-api-secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '2d',
  SESSION_SECRET: process.env.SESSION_SECRET || 'skill-importer-api-secret',
  AWS_DYNAMODB_CONFIG: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'accessKeyId',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'secretAccessKey',
    region: process.env.AWS_REGION || 'us-east-1'
  },

  // Using cron pattern, default to everyday midnight
  IMPORTER_CRON_TIME: process.env.IMPORTER_CRON_TIME || '0 0 * * *',

  // Create a new OAuth app at https://github.com/settings/developers
  GITHUB_AUTH_CONFIG: {
    clientID: process.env.GITHUB_CLIENT_ID || 'clientId',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || 'clientSecret',
    callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/api/v1/connect/github/callback',
    passReqToCallback: true
  },

  // Create a new token at https://github.com/settings/tokens
  GITHUB_ADMIN_TOKEN: process.env.GITHUB_ADMIN_TOKEN || 'token',

  // Create a new OAuth app at https://gitlab.com/profile/applications
  GITLAB_AUTH_CONFIG: {
    clientID: process.env.GITLAB_CLIENT_ID || 'clientId',
    clientSecret: process.env.GITLAB_CLIENT_SECRET || 'clientSecret',
    callbackURL: process.env.GITLAB_CALLBACK_URL || 'http://localhost:3000/api/v1/connect/gitlab/callback',
    passReqToCallback: true
  },

  // Optional.  Create a new token at https://gitlab.com/profile/personal_access_tokens
  GITLAB_ADMIN_TOKEN: process.env.GITLAB_ADMIN_TOKEN || ''
}
