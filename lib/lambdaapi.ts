import cdk = require("@aws-cdk/core");
import lambda = require("@aws-cdk/aws-lambda");
import * as apigateway from "@aws-cdk/aws-apigateway";
import { StackProps } from "@aws-cdk/core";
import { LambdaInfo } from "./services";
import * as dynamodb from "@aws-cdk/aws-dynamodb";

export interface LambdaAppProps extends StackProps {
  name: string;
  api: LambdaInfo;
  apigateway: any;
  authorizer: { type: string; authorizer: apigateway.TokenAuthorizer }[];
  lambdarole: any;
  addCors: boolean;
}

export class LambdaAPP extends cdk.Stack {
  constructor(scope: any, id: string, props: LambdaAppProps) {
    super(scope, id, props);

    const api: apigateway.RestApi = props.apigateway;
    const authorizerArray = props.authorizer;
    let authorizer: apigateway.Authorizer = authorizerArray.find((x) => x.type === "standard")!.authorizer;
    const baseendpoint = api.root.addResource(props.api.baseendpoint);
    let splitLambdaNamesByAuthSoThatTheyRemainUnique = "";
    if (props.api.customAuth) {
      splitLambdaNamesByAuthSoThatTheyRemainUnique = "-" + props.api.customAuth;
      switch (props.api.customAuth) {
        case "public":
          authorizer = authorizerArray.find((x) => x.type === "public")!.authorizer;
          break;
        default:
          authorizer = authorizerArray.find((x) => x.type === "standard")!.authorizer;
          break;
      }
    }

    if (props.addCors) {
      baseendpoint.addCorsPreflight({
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowHeaders: ["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key", "X-Amz-Security-Token", "X-Amz-User-Agent", "access-control-allow-origin", "Cache-Control", "Pragma"],
      });
    }

    if (props.api.type === "dynamodb" && !props.api.customAuth) {
      let sortkey: dynamodb.Attribute | undefined;
      if (props.api.secondarykey) {
        sortkey = { name: props.api.secondarykey.name, type: dynamodb.AttributeType.STRING };
      }
      const table = new dynamodb.Table(this, "DynamoDBTable-" + props.api.tablename, {
        tableName: props.api.tablename,
        partitionKey: { name: props.api.primarykey.name, type: dynamodb.AttributeType.STRING },
        sortKey: sortkey,
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      });
    }

    props.api.functions.forEach((func: any) => {
      const handlerfunction = selectFunction(func, props.api);
      const indexinfo = findIndexInfo(func, props.api);

      const handler = new lambda.Function(this, props.api.tablename + "-" + func + "-Handler", {
        functionName: props.api.tablename + "-" + func + splitLambdaNamesByAuthSoThatTheyRemainUnique,
        runtime: lambda.Runtime.NODEJS_14_X,
        code: lambda.Code.fromAsset("./src/" + props.api.filename, {
          exclude: ["cdk", "*.ts"],
        }),
        handler: props.api.filename + "." + handlerfunction,
        environment: {
          tablename: props.api.tablename,
          primarykey: props.api.primarykey?.name || "",
          secondarykey: props.api.secondarykey?.name || "",
          indexinfo: indexinfo,
          fields: JSON.stringify(props.api.fields),
        },
        role: props.lambdarole,
      });

      const thislambda = new apigateway.LambdaIntegration(handler, {
        requestTemplates: { "application/json": '{ "statusCode": "200" }' },
      });
      const methodtype = selectMethodType(func);
      const thisendpoint = baseendpoint.addResource(func.split("-").join(""));
      const method = thisendpoint.addMethod(methodtype, thislambda, { authorizationType: apigateway.AuthorizationType.CUSTOM, authorizer: authorizer });
      if (props.addCors) {
        thisendpoint.addCorsPreflight({
          allowOrigins: apigateway.Cors.ALL_ORIGINS,
          allowHeaders: ["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key", "X-Amz-Security-Token", "X-Amz-User-Agent", "access-control-allow-origin", "Cache-Control", "Pragma"],
        });
      }
    });
  }
}

function findIndexInfo(func: string, api: LambdaInfo) {
  if (func.includes("getBy-")) {
    const value = func.split("-")[1];
    if (value) return func.split("-")[1];
    return "";
  }
  if (func.includes("getAllByFilter-")) {
    const value = func.split("-")[1];
    if (value) return api.customfilters[value];
    return "";
  }
  if (func.includes("getActive")) return api.customfilters["getActive"];
  return "";
}

function selectFunction(func: string, api: LambdaInfo) {
  if (func.includes("getBy-")) {
    const value = func.split("-")[1];
    if (value === api.primarykey?.name) return "getByID";
    return "getByIndex";
  }
  if (func.includes("getAllByFilter-")) {
    const value = func.split("-")[1];
    return "getAllByFilter";
  }
  return func;
}

function selectMethodType(func: string) {
  if (func.includes("get")) {
    return "GET";
  }
  return "POST";
}
