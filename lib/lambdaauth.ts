import cdk = require("@aws-cdk/core");
import lambda = require("@aws-cdk/aws-lambda");
import * as apigateway from "@aws-cdk/aws-apigateway";
import * as acm from "@aws-cdk/aws-certificatemanager";
import { Duration, StackProps } from "@aws-cdk/core";

export interface LambdaAuthProps extends StackProps {
  name: string;
  servicename: string;
  env: any;
  JWTSECRET: string;
  domainName: string;
}

export class LambdaAuth extends cdk.Stack {
  public readonly authlambda: lambda.Function;
  public readonly authorizer: apigateway.TokenAuthorizer;
  public readonly publicLambda: lambda.Function;
  public readonly publicAuthorizer: apigateway.TokenAuthorizer;
  public readonly apigateway: apigateway.RestApi;

  constructor(scope: any, id: string, props: LambdaAuthProps) {
    super(scope, id, props);

    const sslcert = new acm.Certificate(this, "SSLCertificate", {
      domainName: props.domainName,
    });

    this.apigateway = new apigateway.RestApi(this, props.servicename + "-api-gateway", {
      restApiName: "API Services",
      description: "This service serves widgets.",
      deploy: true,
      domainName: {
        domainName: props.domainName,
        certificate: sslcert,
        securityPolicy: apigateway.SecurityPolicy.TLS_1_2,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowHeaders: ["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key", "X-Amz-Security-Token", "X-Amz-User-Agent", "access-control-allow-origin", "Cache-Control", "Pragma"],
      },
    });

    new cdk.CfnOutput(this, "API-Gateway-RestAPIID", { value: this.apigateway.restApiId });
    new cdk.CfnOutput(this, "API-Gateway-restApiRootResourceId", { value: this.apigateway.restApiRootResourceId });

    this.authlambda = new lambda.Function(this, "API-Auth-Handler", {
      functionName: "API-Auth-Lambda",
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset("./src/auth", {
        exclude: ["cdk", "*.ts"],
      }),
      handler: "handler.main",
      environment: { SECRET: props.JWTSECRET },
    });

    this.authorizer = new apigateway.TokenAuthorizer(this, "API-Auth-Authorizer", {
      handler: this.authlambda,
      authorizerName: "API-Auth-Authorizer",
      resultsCacheTtl: Duration.seconds(0),
    });

    new cdk.CfnOutput(this, "API-Auth-Authorizer-Output", { value: this.authorizer.authorizerArn });

    this.publicLambda = new lambda.Function(this, "API-Public-Auth-Handler", {
      functionName: "API-Public-Auth-Lambda",
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset("./src/publicauth", {
        exclude: ["cdk", "*.ts"],
      }),
      handler: "handler.main",
      environment: { SECRET: props.JWTSECRET },
    });

    this.publicAuthorizer = new apigateway.TokenAuthorizer(this, "API-Public-Auth-Authorizer", {
      handler: this.publicLambda,
      authorizerName: "API-Public-Auth-Authorizer",
      resultsCacheTtl: Duration.seconds(0),
    });

    new cdk.CfnOutput(this, "API-Public-Auth-Authorizer-Output", { value: this.publicAuthorizer.authorizerArn });
  }
}
