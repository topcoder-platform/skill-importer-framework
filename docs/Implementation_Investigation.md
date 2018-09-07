# Skill importer implementation investigation

## Generic questions

### How to normalize skill names?

Having a table `NormalizedSkillName` containing all supported skills with their unique name and associated fields to support the variety of skill parsing/detecting techniques that will be used for the target platforms.

Sample data:

```js
[
  {
    "regex": "^(java|jdk|jre|j2ee|javaee)$",
    "name": "Java"
  },
  {
    "regex": "^(objective c|objective\\-c)$",
    "name": "Objective-C"
  },
]
```

This would ensure that the skill names are normalized, and provide the flexibility for them to be detected in a variety of situations.

## 1. Behance

### 1.1 How to fetch the data, by API or by Scraper?

Behance provides a public API which is detailed at (https://www.behance.net/dev/api)

GET `/v2/users/:user/projects` which has output like this:

```json
{
"projects": [
       {
           "id": 3882857,
           "name": "The ALVA Award",
           "published_on": 1338993558,
           "created_on": 1336591701,
           "modified_on": 1338993615,
           "url": "http://www.behance.net/gallery/The-ALVA-Award/3882857",
           "fields": [
               "Branding",
               "Product Design"
           ],
           "covers": {
               "115": "http://behance.vo.llnwd.net/profiles/50001/projects/3882857/115xb09a269d4b56d6ff5c640364208d3480.jpg",
               "202": "http://behance.vo.llnwd.net/profiles/50001/projects/3882857/b09a269d4b56d6ff5c640364208d3480.jpg"
           },
           "mature_content": 0,
           "stats": {
               "views": 1870,
               "appreciations": 148,
               "comments": 15
           }
       }
   ]
 }
```

The `fields` field can be parsed for design-related skills using the Skill regex, and the `stats` field can provide numbers for the skills.

### 1.2 How to authenticate, by oAuth, Auth0 or any other ways?

Although there is no oAuth authentication, the public api does provide this endpoint:

GET `/v2/users/:user`

```json
{
    "user": {
        "id": 50001,
        "first_name": "Matias",
        "last_name": "Corea",
        "username": "MatiasCorea",
        "city": "Brooklyn",
        "state": "New York",
        "country": "United States",
        "company": "Behance",
        "occupation": "Chief Designer & Co-Founder",
        "created_on": 1182475806,
        "url": "http://www.behance.net/MatiasCorea",
        "display_name": "Matias Corea",
        "images": {
            "32": "http://behance.vo.llnwd.net/profiles/50001/32xac8d5163265f6898d0b970dbfcdf4868.png",
            "50": "http://behance.vo.llnwd.net/profiles/50001/50xac8d5163265f6898d0b970dbfcdf4868.png",
            "78": "http://behance.vo.llnwd.net/profiles/50001/78xac8d5163265f6898d0b970dbfcdf4868.png",
            "115": "http://behance.vo.llnwd.net/profiles/50001/115xac8d5163265f6898d0b970dbfcdf4868.png",
            "129": "http://behance.vo.llnwd.net/profiles/50001/129xac8d5163265f6898d0b970dbfcdf4868.png",
            "138": "http://behance.vo.llnwd.net/profiles/50001/ac8d5163265f6898d0b970dbfcdf4868.png"
        },
        "fields": [
            "Web Design",
            "Typography",
            "Interaction Design"
        ],
      }
}
```

The first and last name contained in the TopCoder JWT token (or retrieved from the member service) could be compared to the first and last name listed on the Behance profile to validate that the member is linking their own profile.

[Source](https://www.behance.net/dev/api/endpoints/2#users-get-71)

### 1.3 How to ensure the skill being fetched belongs to the right member?

The project `owner` id can be compared to the user id to ensure that the user owns the project that has the relevant skill stats.  This may not be necessary on Behance because any project contribution may be sufficient to show the relevant skills.

### 1.4 Are there any rate limit of requests of API usage or scraping?
Copied from (https://www.behance.net/dev/api/endpoints):

> Limits
> Requests are limited to 150 per hour and are measured against the public facing IP of the server or device making the request. If you make too many requests, you will receive an empty response with a 429 (Too Many Requests) status code.
> If the rate limit is too low for your application, please contact us for information on premium access.

### 1.5 What are the skill data?

The data could be the `appreciations` field of the project.  In a design context, the `views` might also be considered a valid statistic.

### 1.6 What are the events that can affect the skill data?

Any increase in `appreciations` and `views` will affect the skill data, as will the addition of more projects that also contain the skill being considered.

### 1.7 Retry strategy

If the request fails with 426 (Too Many Requests) it may be appropriate to block the import process for a configurable span of time and try again.  The Behance user name can be validated to exist when linking the account, so this should not be a common source of error.

### 1.8 Remarks

As this site is largely dedicated to design, there will have to be sufficient design-related skills to support this site.  Currently the bulk of TopCoder skills are code-related.

## 2. FightCode

### 2.1 How to fetch the data, by API or by Scraper?

The link to this site produces a 404 Not Found error.  Some parts of the site are accessible through Google searches, but it appears that the latest Code 'fight' was in 2015.  This site does not appear to be active or maintained.

### 2.2 How to authenticate, by oAuth, Auth0 or any other ways?

N/A

### 2.3 How to ensure the skill being fetched belongs to the right member?

N/A

### 2.4 Are there any rate limit of requests of API usage or scraping?

N/A

### 2.5 What are the skill data?

N/A

### 2.6 What are the events that can affect the skill data?

N/A

### 2.7 Retry strategy

N/A

### 2.8 Remarks

None.

## 3. Coursera

### 3.1 How to fetch the data, by API or by Scraper?

Coursera does not provide an API that would be useful for skill importing.  It provides an API for course partners to view data on the course catalog.  These are not useful for importing the skills of a particular user.  The following hybrid approach may be a good solution:

When a Coursera user finishes a course, they are given a link to their 'Course Certificate'.  These are accessible on the user's 'Accomplishments' page.

These links are of this form: (https://www.coursera.org/account/accomplishments/verify/THCCR25MF8)

The TopCoder member can provide their certificate links for Coursera, which can be scraped for the Skill keywords.

Additionally, Coursera users can link these accomplishments to their LinkedIn profile.  It may be possible to import Coursera skills indirectly through LinkedIn.

### 3.2 How to authenticate, by oAuth, Auth0 or any other ways?

The first and last name contained in the TopCoder JWT token (or retrieved from the member service) could be compared to the first and last name listed on the course certificate to validate that the member is linking their own profile.

### 3.3 How to ensure the skill being fetched belongs to the right member?

The certificate is verified and belongs to only one user.  As long as the identity of the member matches the certificate, no other validation is required.

### 3.4 Are there any rate limit of requests of API usage or scraping?

None.  The importing of a given certificate will only need to be done once.

### 3.5 What are the skill data?

The skill data is the number of courses completed pertaining to the skill.

### 3.6 What are the events that can affect the skill data?

Additional course certificates being imported that support a given skill.

### 3.7 Retry strategy

If there is an issue loading the certificate, the user will need to be prompted to double-check their course validation url.

### 3.8 Remarks

None.

## 4. LinkedIn

LinkedIn supports oAuth 2.

### 4.1 How to fetch the data, by API or by Scraper?

There is a Basic Profile API endpoint

### 4.2 How to authenticate, by oAuth, Auth0 or any other ways?

The oAuth 2 flow is fully supported.  This can be done with direct calls to the API, or by the LinkedIn JS SDK.

The process is detailed [here](https://developer.linkedin.com/docs/oauth2).

### 4.3 How to ensure the skill being fetched belongs to the right member?

Using oAuth with the `r_basicprofile` permissions will allow access to the following details of the user via GET `https://api.linkedin.com/v2/me`:

- `summary` - A long-form text area describing the member's professional profile.
- `specialties` - A short-form text area describing the member's specialties.
- `positions` - Array which contains the following scannable field:
  - `summary` - A summary of the position.

All of these fields belong to the user and can be scanned for skill keywords.

Additionally, the `r_fullprofile` permission would allow access to the following fields:

- `certifications`
  - `name` - The name of the certification.
- `educations`
  - `field-of-study` - The field that the member studied while at this school.
  - `degree` - The degree received at this school (if any)
  - `activities` - A brief summary of activities the member participated in while at this school.
  - `notes` -	A brief summary of other details related to the member's studies at this school.
- `courses`
  - `name` - The name of the course.

These could also be scanned for skill-related keywords.

[Source](https://developer.linkedin.com/docs/fields/full-profile)

### 4.4 Are there any rate limit of requests of API usage or scraping?

LinkedIn has rate limiting which is based on the exact endpoint being called.

The [link](https://developer.linkedin.com/docs/guide/v2/best-practices/throttle-limits) to the throttle-limits for the profile data is currently unavailable.

### 4.5 What are the skill data?

Please see the fields detailed in section 4.3

### 4.6 What are the events that can affect the skill data?

The addition of jobs or education to the user's profile.

### 4.7 Retry strategy

The retry strategy would be largely the same as the previous rate-limiting strategies.

### 4.8 Remarks

None.

## 5. HackerNews

### 5.1 How to fetch the data, by API or by Scraper?

HackerNews provides a low-level Firebase-based API to retrieve data.

### 5.2 How to authenticate, by oAuth, Auth0 or any other ways?

There are no ways to authenticate with the HackerNews api.

### 5.3 How to ensure the skill being fetched belongs to the right member?

The member would have to provide their HackerNews username, but this cannot be verified.

For example, for the user 'jl':

GET `https://hacker-news.firebaseio.com/v0/user/jl.json?print=pretty`

```json
{
  "about" : "This is a test",
  "created" : 1173923446,
  "id" : "jl",
  "karma" : 3949,
  "submitted" : [ 16659709, 16659632, 16659556, 14237416, 11871616, 11483492, 11435082, 10985073, 10985027, 10984914, 10977351 ]
}
```

The `submitted` ids can refer to stories and posts submitted by the user.  This could be retrieved individually and scanned for skill data.

### 5.4 Are there any rate limit of requests of API usage or scraping?

This is not documented.

### 5.5 What are the skill data?

The skill data can be the `score` that a story received, which appears to represent the upvotes for the submission.  Submitting a story does not necessarily imply a skill, so this may not be appropriate.

### 5.6 What are the events that can affect the skill data?

Additional posted stories, more upvotes for existing stories.

### 5.7 Retry strategy

The retry strategy would be largely the same as the previous rate-limiting strategies ( if it is determined that a rate limit applies to the api )

### 5.8 Remarks

None.

## 6. GitHub

### 6.1 How to fetch the data, by API or by Scraper?

The data is fetched by API either from the [API endpoints](https://developer.github.com/v3/) directly or from the [octokit rest.js library](https://octokit.github.io/rest.js/).

Currently the importer is utilizing HTML scraping of the unofficial non-API events endpoints.  This has the advantage of importing events going back to 2008, but is time-consuming and does not support OAuth to get private repo events.

GitHub does provide an endpoint that will return events for a user when a Bearer OAuth token is provided:

GET `https://api.github.com/users/username/events`

This provides a list of data with the following format:

```json
[{
    "id": "1",
    "type": "EventType",
    "repo": {
        "id": 147274816,
        "name": "owner/reponame",
        "url": "https://api.github.com/repos/owner/reponame"
    },
    "payload": {},
    "public": false,
    "created_at": "2018-09-04T02:05:47Z"
}]
```

The payload varies for each type of event.

The response can be filtered for the `PullRequestEvent` and `PushEvent` types to use for PR/PR Review and Commit skill imports.

**This has some limitations:**
- Officially only returns events going back 90 days, but seems to return events from significantly longer
- Capped at the most recent 300 (in pages of 30)

### 6.2 How to authenticate, by oAuth, Auth0 or any other ways?

GitHub API allows the program to get the authenticated user access token to perform various operations and extend the request limit. Authentication can be done using OAuth 2.0 and octokit/rest.js.

### 6.3 How to ensure the skill being fetched belongs to the right member?

Get it from the user's profile, for example, for user **dougwilson**, we can get his commits of June, 2018

https://github.com/users/dougwilson/created_commits?from=2018-06-01&to=2018-06-30

### 6.4 Are there any rate limit of requests of API usage or scraping?

GitHub limit 5000 requests per hour for authenticated requests, 60 requests for unauthenticated requests. See [here](https://developer.github.com/v3/#rate-limiting) for more detail.

### 6.5 What are the skill data?

- User's commits
- User's pull requests
- User's pull request reviews

Sample skill data

```json
[
    {
        "pointType": "PullRequest",
        "accountId": "a6c43e83-374f-45b8-8b9d-911eb0fe7e32",
        "id": "2817dee3-5b8a-4a76-a663-88b6f9f4cd08",
        "name": "JavaScript",
        "points": 2,
        "userUid": "b13f89ea-f24f-4351-b9d6-08d4c74c5a4c"
    },
    {
        "pointType": "Commit",
        "accountId": "a6c43e83-374f-45b8-8b9d-911eb0fe7e32",
        "id": "98f5ab2f-31ac-4713-aa84-bab6e0864b34",
        "name": "JavaScript",
        "points": 4,
        "userUid": "b13f89ea-f24f-4351-b9d6-08d4c74c5a4c"
    },
    {
        "pointType": "PullRequestReview",
        "accountId": "a6c43e83-374f-45b8-8b9d-911eb0fe7e32",
        "id": "7196d852-0138-4b9d-8c90-ccaebe487621",
        "name": "C++",
        "points": 3,
        "userUid": "b13f89ea-f24f-4351-b9d6-08d4c74c5a4c"
    }
]
```

### 6.6 What are the events that can affect the skill data?

We have the following events:
- New commits, deleted commits, affects the skill data "Commit"
- New Pull Requests, deleted Pull Requests, affects the skill data "PullRequest"
- New Pull Request Reviews, deleted Pull Reviews, affects the skill data "PullRequestReview"

Sample event data

```json
[
    {
        "date": "2018-04-12T00:00:00.000Z",
        "affectedPoints": 1,
        "accountId": "a6c43e83-374f-45b8-8b9d-911eb0fe7e32",
        "skillId": "7196d852-0138-4b9d-8c90-ccaebe487621",
        "affectedPointType": "PullRequest",
        "affectedSkillName": "C++",
        "text": "Created pull request /topcoderinc/pxCore/pull/167",
        "id": "33b761d1-f47d-4c80-bb2b-5c30a95cc8ac",
        "userUid": "b13f89ea-f24f-4351-b9d6-08d4c74c5a4c"
    },
    {
        "date": "2018-01-25T00:00:00.000Z",
        "affectedPoints": 1,
        "accountId": "a6c43e83-374f-45b8-8b9d-911eb0fe7e32",
        "skillId": "7196d852-0138-4b9d-8c90-ccaebe487621",
        "affectedPointType": "PullRequest",
        "affectedSkillName": "C++",
        "text": "Created pull request /topcoderinc/pxCore/pull/107",
        "id": "2af5add5-5395-44c3-8e25-5227f28e3896",
        "userUid": "b13f89ea-f24f-4351-b9d6-08d4c74c5a4c"
    },
    {
        "date": "2015-07-01T00:00:00.000Z",
        "affectedPoints": 1,
        "accountId": "a6c43e83-374f-45b8-8b9d-911eb0fe7e32",
        "skillId": "ae5bfa0b-04c2-4934-8c65-4d88f81ef776",
        "affectedPointType": "Commit",
        "affectedSkillName": "HTML",
        "text": "Created 1 commit in billsedison/billsedison.github.io",
        "id": "efb93ddd-287c-4fed-b551-04689d885635",
        "userUid": "b13f89ea-f24f-4351-b9d6-08d4c74c5a4c"
    },
    {
        "date": "2018-02-01T00:00:00.000Z",
        "affectedPoints": 2,
        "accountId": "a6c43e83-374f-45b8-8b9d-911eb0fe7e32",
        "skillId": "27142b07-2410-47e0-91fe-ad0270124063",
        "affectedPointType": "Commit",
        "affectedSkillName": "TypeScript",
        "text": "Created 2 commits in topcoderinc/Headlessrefapp",
        "id": "e83bb55d-8480-41c5-ac26-93f23b145464",
        "userUid": "b13f89ea-f24f-4351-b9d6-08d4c74c5a4c"
    }
]
```

### 6.7 Retry strategy

If the data fetching failed, the program will print out the error and retry for another 3 times. If all 4 tries fail, the data fetching will stop and the program will keep the most recent imported data.

### 6.8 Remarks

Please see GitLab section 8.8 for information regarding private repositories.

## 7. StackOverflow

### 7.1 How to fetch the data, by API or by Scraper?

StackOverflow provides a powerful api that can handle complex queries and filtering.

### 7.2 How to authenticate, by oAuth, Auth0 or any other ways?

StackOverflow fully supports the OAuth2 protocol.  Only the oauth key will need to be stored for a member.

### 7.3 How to ensure the skill being fetched belongs to the right member?

The GET `/me/answers` endpoint can be used that will only return answers for the user with the provided OAuth `access_token`.

### 7.4 Are there any rate limit of requests of API usage or scraping?

The site uses a complex throttling system which can be found outlined [here.](https://api.stackexchange.com/docs/throttle)

There is a limit of 30 concurrent requests per second, and an additional limit for authenticated (oauth) users of 10,000 requests per user per day.

>If an application does have an access_token, then the application is on a distinct user/app pair daily quota (default size of 10,000). A user can have up to 5 distinct quotas at any one time, though this limit is not reflected in quota_remaining returns for privacy reasons.

Additionally, an api response may indicate that a delay _must_ be made before the next request:

>A dynamic throttle is also in place on a per-method level. If an application receives a response with the backoff field set, it must wait that many seconds before hitting the same method again. For the purposes of throttling, all /me routes are considered to be identical to their /users/{ids} equivalent. Note that backoff is set based on a combination of factors, and may not be consistently returned for the same arguments to the same method. Additionally, all methods (even seemingly trivial ones) may return backoff.

### 7.5 What are the skill data?

The answer body can be scanned for skill keywords and the data can be the `score` or the `up_vote_count` that the answer has received.

Please see (https://api.stackexchange.com/docs/types/answer) for additional answer metrics that could be used.

### 7.6 What are the events that can affect the skill data?

Change in score/votes for existing answers, and new answers that the user has posted.

### 7.7 Retry strategy

The retry strategy will have to ensure that the `backoff` field is being examined and the appropriate delay is used before the next request ( or retry ).

### 7.8 Remarks

StackOverflow is part of the greater StackExchange network, and all api calls are made to the StackExchange api.

## 8. Gitlab

### 8.1 How to fetch the data, by API or by Scraper?
GitLab provides an API, however there are limitations:

The `GET /events` endpoint will return all events for the authenticated ( via OAuth access_token ) user, but this only returns events from within the last year.  This will return events for private repositories that the user has contributed to.

Alternatively, if the access_token is not used, the following endpoint can be substituted: `GET users/:id/events` - where id is the user id obtained during OAuth.  This will _only_ return private repositories when they are accessible by the Private Access Token set using the GITLAB_ADMIN_TOKEN env variable.

This can still be used to import skills from private TopCoder repositories provided that the GITLAB_ADMIN_TOKEN has been invited to the repositories.

These events are comprised of commits, pull requests, and other types.  The commits and events can processed much the same as with GitHub.

This endpoint also supports filtering via query to reduce unnecessary data being retrieved:

Opened Merge Requests: `GET https://gitlab.com/api/v4/events?action=created&target_type=merge_request`
Approved Merge Requests: `GET https://gitlab.com/api/v4/events?action=merged&target_type=merge_request`
  - These events will count as a single `PullRequest` or `PullRequestReview` which will be consistent with the GitHub importer.
Pushed Code: `GET https://gitlab.com/api/v4/events?action=pushed`
  - These API responses contain a `push_data` field which has a `commit_count` which can be used to count the commits in the push events.

Example Response for `action=pushed`:
```json
[
  {
    "title": null,
    "project_id": 15,
    "action_name": "pushed",
    "target_id": null,
    "target_type": null,
    "author_id": 1,
    "author": {
      "name": "Dmitriy Zaporozhets",
      "username": "root",
      "id": 1,
      "state": "active",
      "avatar_url": "http://localhost:3000/uploads/user/avatar/1/fox_avatar.png",
      "web_url": "http://localhost:3000/root"
    },
    "author_username": "john",
    "push_data": {
      "commit_count": 1,
      "action": "pushed",
      "ref_type": "branch",
      "commit_from": "50d4420237a9de7be1304607147aec22e4a14af7",
      "commit_to": "c5feabde2d8cd023215af4d2ceeb7a64839fc428",
      "ref": "master",
      "commit_title": "Add simple search to projects in public area"
    },
    "target_title": null
  }
]
```

All of these calls are made with an `Authorization Bearer` header containing the `access_token` obtained through the OAuth process for the user during account linking, or a `Private-Token` header with the static GITLAB_ADMIN_TOKEN.

There is no API endpoint that provides a list of the languages for a given repo.  There is however an html-based page for each repo: `https://gitlab.com/:project_name/:repo_name/graphs/master/charts` which renders a pie chart of the languages used and has a table with all of the language names.  This page can be scraped to determine the skills used in the repo/project.

The best approach may be a hybrid between the API request for the user's events, and scraping the chart page for the affected repo's skills.

Update: There is an API endpoint that returns the languages used for the entire project, and not just a particular branch:

GET `https://gitlab.com/api/v4/projects/projectId/languages` which has a response in this format:
```json
{
    "TypeScript": 41.39,
    "HTML": 39.86,
    "CSS": 18.49,
    "JavaScript": 0.26
}
```


### 8.2 How to authenticate, by oAuth, Auth0 or any other ways?
GitLab fully supports the OAuth process.

### 8.3 How to ensure the skill being fetched belongs to the right member?
OAuth can be used to store the user's GitLab handle and the private access_token, which will ensure that all imported skills belong the user.

### 8.4 Are there any rate limit of requests of API usage or scraping?
There are conflicting answers to this.  Previously GitLab had no rate limiting, but some users have reported a limit of 10 requests per second per ip address.  GitLab does not have a stated policy for rate limiting.

### 8.5 What are the skill data?
The skill data are the commits/MRs/MR reviews that a user has made to a repo, and the skills are the languages scraped from the repo charts page.

### 8.6 What are the events that can affect the skill data?
New commits/MRs/MR Reviews to a repo, or a language being added to the repo charts.

### 8.7 Retry strategy
If the data fetching failed, the program will print out the error and retry for another 10 times. If all retries fail, the data fetching will stop and the program will keep the most recent imported data.

### 8.8 Remarks

#### Possible Approaches for Importing Private Repositories

1. Store Access Tokens in DB
- Can utilize AES 256 encryption with secret stored in AWS ENV variable to explicitly encrypt/decrypt the access key
- Can use [AWS Dynamo 'Encryption at Rest'](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/EncryptionAtRest.html) to transparently encrypt the Accounts table, or the entire database. Note: There may be a cost associated with this feature.
- Protects against compromised DB, but not compromised container.
- Could optionally use asymmetric encryption and run the private import job via an endpoint that accepts the decryption key for the access tokens.  This shifts part of the security to another microservice and adds another layer of separation.
- **Storing the tokens is high-risk because of the following:**
- Both GitHub and GitLab generate OAuth tokens with no expiry date.
- Neither GitHub nor GitLab offer an OAuth scope that is limited to read-only access to private repositories:
  - GitHub offers the 'repo' scope which confers complete read-write access to all private/public repositories that the user has permissions to.
  - GitLab offers the 'api' scope which gives complete and total read-write access to every facet of the GitLab platform for the user.
  - These both provide wide and high-impact permissions, far more than is required for the skill-importer.

2. Store Access Tokens in Memory
- This will still allow the importer to operate on Private Repositories during its scheduled job, but if the service is restarted, the keys are lost and the user will need to re-authenticate through OAuth.

3. On-demand private repo importing using an 'Import Private Repos Now' Button (Recommended)
- Token is used once per click and is not stored in memory or in the database.
- The user can authorize the importer separately for the automatic importing of public repos, and the on-demand import of private repos.
- User can control exactly when their private repos are accessed.
- Convenient:  OAuth process only required for the first click of the button, subsequent clicks do not require the user to reauthorize.
- It would also be possible in the future to allow the user to select which of their private repositories should be imported
