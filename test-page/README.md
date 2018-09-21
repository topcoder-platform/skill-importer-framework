# TestPage

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 6.1.5.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

# Setting Up

## Running Locally
1. Update the baseApiUrl in environments/environment.ts (local) or environments/environment.prod.ts (front-end deploy) to `http://localhost:8080/api/v1` for local, or leave as-is to use the AWS deployed backend
2. Update the GitLab/GitHub redirect urls to `http://localhost:4200/connect/gitlab` and `http://localhost:4200/connect/github` for local deployment at both:
  - The platform's OAuth settings pages (https://gitlab.com/profile/applications) and (https://github.com/settings/developers)
  - The backend env variables (GITHUB_CALLBACK_URL, GITLAB_CALLBACK_URL)
3. Run locally with `ng serve --open`

## Deploy to AWS S3
1. Set up a static web hosting S3 bucket
2. Use the following redirection rules for the static hosting bucket:
```xml
<RoutingRules>
  <RoutingRule>
    <Condition>
      <HttpErrorCodeReturnedEquals>404</HttpErrorCodeReturnedEquals>
    </Condition>
    <Redirect>
      <ReplaceKeyPrefixWith>#/</ReplaceKeyPrefixWith>
    </Redirect>
  </RoutingRule>
</RoutingRules>
```
3. Update the backend/oauth redirect urls to use the bucket address
4. Run `ng build --prod`
5. Run `aws s3 cp ./dist/test-page s3://your-bucket-here --recursive --acl public-read`
