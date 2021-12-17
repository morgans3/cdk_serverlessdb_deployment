#!/usr/bin/env node
import * as cdk from "@aws-cdk/core";
import { Tags } from "@aws-cdk/core";
import * as helper from "../helpers/_helpers";
import { _domainName } from "./_config";
import { APIs, LambdaInfo } from "../lib/services";
import { CDKRoles } from "../lib/cdkroles";
import { LambdaAPP } from "../lib/lambdaapi";
import { LambdaAuth } from "../lib/lambdaauth";
import { WAFStack } from "../lib/wafstack";

export const _AWSREGION = process.env.CDK_DEFAULT_REGION;
export const _ACCOUNT = process.env.CDK_DEFAULT_ACCOUNT;
const env = { account: _ACCOUNT, region: _AWSREGION };

helper.getSecret("jwt", (data: any) => {
  if (!data) {
    console.log("Unable to fetch secret for JWT Authorizer");
    return;
  }
  const jwtCredentials = JSON.parse(data);

  const app = new cdk.App();

  const auth = new LambdaAuth(app, "LambdaAuth", { env, name: "API-Auth", servicename: "DynamoDBAPI", JWTSECRET: jwtCredentials.secret, domainName: _domainName });
  Tags.of(auth).add("IAC.Module", "LambdaAuth");

  const roles = new CDKRoles(app, "LambdaCDKRoles", { env });
  Tags.of(roles).add("IAC.Module", "CDKRoles");

  const authArray = [
    { type: "standard", authorizer: auth.authorizer },
    { type: "public", authorizer: auth.publicAuthorizer },
  ];

  APIs.forEach((api: LambdaInfo) => {
    const lamapp = new LambdaAPP(app, "Lambda-" + api.name, { env, name: api.name, api, authorizer: authArray, apigateway: auth.apigateway, lambdarole: roles.lambdaARole, addCors: false });
    Tags.of(lamapp).add("IAC.Module", "LambdaAPP");
  });

  const waf = new WAFStack(app, "APIWAFStack", { env, apigateway: auth.apigateway });
  Tags.of(waf).add("IAC.Module", "WAFStack");

  // Global Tags
  Tags.of(app).add("Project", "Serverless Database Deployment");
  Tags.of(app).add("Author", "https://github.com/morgans3");
  Tags.of(app).add("Component.Version", "Latest");
  Tags.of(app).add("IAC.Repository", "cdk_serverlessdb_deployment");
});
