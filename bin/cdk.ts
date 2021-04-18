#!/usr/bin/env node
import * as cdk from "@aws-cdk/core";
import { AuroraCluster } from "../lib/auroracluster";
import { AuroraTable } from "../lib/auroratable";
import { DynamoDBTable } from "../lib/dynamodbtable";
import { LambdaAPI } from "../lib/lambdaapi";
import { Environments } from "../lib/services";

export const _AWSREGION = process.env.CDK_DEFAULT_REGION;
export const _ACCOUNT = process.env.CDK_DEFAULT_ACCOUNT;
const env = { account: _ACCOUNT, region: _AWSREGION };

const app = new cdk.App();
Environments.forEach((type) => {
  let auroracluster: AuroraCluster;
  if (type.auroracluster) auroracluster = new AuroraCluster(app, "AuroraCluster-" + type.name, { env });
  type.tables.forEach((tab) => {
    if (tab.type === "aurora") {
      new AuroraTable(app, "AuroraTable-" + tab.name, { env, tab, auroracluster });
    } else {
      new DynamoDBTable(app, "DynamoDBTable-" + tab.name, { env, tab });
    }
    tab.methods.forEach((method) => {
      new LambdaAPI(app, "LambdaAPI-" + tab.name + "-" + method, { env, tab, method, domain: type.domainName });
    });
  });
});
