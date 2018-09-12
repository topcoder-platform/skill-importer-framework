# Skill Importer REST API
----------

## Requirements

- NodeJS 8.7+

## API Definition

- `docs/swagger.yml`
- You can use `https://editor.swagger.io` to view it

## Configuration

The app configuration can be changed in `config/default.js` or by setting environment variables.
The following variables can be configured:

- `LOG_LEVEL` the logging level, `error` or `debug`
- `PORT` the port on that app listens
- `CONTEXT_PATH` the api context path
- `JWT_SECRET` the secret to encode/decode JWT tokens
- `JWT_EXPIRES_IN` the JWT token expiration, example values: "2 days", "10h", "7d"
- `SESSION_SECRET` the secret to encrypt the express session
- `AWS_DYNAMODB_CONFIG` the AWS DynamoDb configuration, it includes 3 environment variables: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `AWS_REGION`
- `IMPORTER_CRON_TIME` the cron time to run the importer (using cron-like syntax), default to everyday midnight
- `GITHUB_AUTH_CONFIG` the GitHub OAuth config
- `GITHUB_IMPORTER_USER_TOKEN` the GitHub Private Access Token generated for the Skill Importer User that can be invited to private repos to allow importing
- `GITLAB_AUTH_CONFIG` the GitHub OAuth config ( Set the `GITLAB_CLIENT_ID` and `GITLAB_CLIENT_SECRET` ENV variables )
- `GITLAB_IMPORTER_USER_TOKEN` the GitLab Private Access Token generated for the Skill Importer User that can be invited to private repos to allow importing

## Create Apps for OAuth Websites

***NOTE***: you need to change `localhost:3000` to your production server host and port.

### How to create GitHub app
- Login to GitHub
- Go to https://github.com/settings/profile
- Click "Developer settings"
- Click "New OAuth App" button
- Input into all fields. NOTE: set `Homepage URL` to "http://localhost:3000", and `Authorization callback URL` to "http://localhost:3000/api/v1/connect/github/callback"
- After submitting, you can go to the app details to get the OAuth client ID and secret.

### How to create GitLab app
- Login to GitLab
- Go to "Settings" / https://gitlab.com/profile
- Click "Applications"
- Fill out the fields.  NOTE: Set `Redirect URI` to "http://localhost:3000/api/v1/connect/gitlab/callback"
- Scope can be set to 'read_user'
- After submitting, you can go to 'Your applications' and click the newly added app to get the OAuth client ID and secret.

## Code Style
The code follows StandardJS.
- Run `npm i` to install dependencies
- Run `npm run lint` to check code styles
- Run `npm run lint:fix` to check and fix automatically the errors that can be fixed by StandardJS

## Local Deployment

- Configure necessary variables and OAuth apps
- Run `npm i` to install dependencies
- Run `npm start` to run
- Wait a minute for DynamoDB creates the tables

  The app will be available at `http://localhost:3000/api/v1`

## AWS Deployment
- Install AWS CLI: https://docs.aws.amazon.com/cli/latest/userguide/installing.html
- Install EB CLI: https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/eb-cli3-install.html
- Go to AWS Console: https://console.aws.amazon.com
- Create a new IAM user (e.g. skill-importer-api-role) with a new group (e.g. skill-importer-api-group). Make sure you added ` AmazonDynamoDBFullAccess` and `AWSElasticBeanstalkFullAccess` to the group
- You can download the access key and secret by "Download .csv" button
- Go the Permissions tab of the IAM user, "Add inline policy" with this
- Configure new AWS profile by `aws configure --profile <IAM user>` (where <IAM user> is the IAM user created above)
- Make sure that `~/.aws/credentials` is created and correct
- `cd skill-importer-api`
- Init EB `eb init -r <region> -p "Node.js"`, replace <region> with your region, e.g. us-east-1
- Make sure you removed the `node_modules` directory before going to the next steps
- Create EB environment `eb create` (NOTE: use `eb create -s` if your account is free tier)
- Go to EB console, update the environment to use NodeJS version 8.x (default is 6.x)
- Configure new environment variables to correct values: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_CALLBACK_URL`, `GITLAB_CLIENT_ID`, `GITLAB_CLIENT_SECRET`, `GITLAB_CALLBACK_URL`. You can use the AWS Console or `eb setenv key=value`
- `eb open` to open that app in web browser

## Verification

- Start the app
- Generate test data `npm run seed`
- You can generate additional admin users by updating `test_files/seed-admin.js` and run `npm run seed-admin`
- Import `docs/postman_collection.json` and `docs/postman_environment.json` to Postman
- Change `URL` environment variable in Postman according to your deployment. If you deploy locally, it should be `http://localhost:3000/api/v1` by default
- Send `/login` requests first so that the access tokens are cached for subsequent calls

### For adding GitHub/GitLab account, you need to verify using a web browser:
- Go to `http://localhost:3000/html` (this url is only available for `NODE_ENV !== 'production'`)
- Enter username, password or you can use the pre-populated
- Click `Login`
- Check the login response to make sure the user is logged in successfully
- Click `Connect GitHub` or `Connect GitLab`
- You will be redirected to GitHub/GitLab, follow the screens to authenticate with GitHub/GitLab
- GitHub/GitLab will redirect you back to `http://localhost:3000/api/v1/connect/github/callback`
- Check the DB to verify that GitHub/GitLab account is created (you can use DynamoDB console, or any client tool)

### Importing from Private Repositories
- Create a new user for GitLab/GitHub which will be linked to the importer, and can be invited to private repositories
- Generate a Public Access Token for this user
    - GitHub: Visit (https://github.com/settings/tokens) and click `Generate new Token`, select `repo` permission and all of its sub-permissions, use this token for `GITHUB_IMPORTER_USER_TOKEN`
    - GitLab: Visit (https://gitlab.com/profile/personal_access_tokens) and select 'api' for the scope.  Click `Create personal access token` and use this token for `GITLAB_IMPORTER_USER_TOKEN`
 - This user can then be invited to a private repository to allow the importer to import events for any users that are members of the repository

### To verify the Importer Job
- Use Postman call (`Run Importer Job`) to make call to the API to run the job immediately
- Or wait until job runs (see `IMPORTER_CRON_TIME` config)
- The job takes more than 10 minutes for each GitHub account
- Check the log output (if you deploy locally) to see the job processing steps
- Check the DB to verify that the Events and Skills get updated when the job completes
