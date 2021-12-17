import cdk = require("@aws-cdk/core");
import lambda = require("@aws-cdk/aws-lambda");
import * as apigateway from "@aws-cdk/aws-apigateway";
import { Duration, StackProps } from "@aws-cdk/core";

export interface LambdaAuthorizersProps extends StackProps {
  name: string;
  env: any;
  JWTSECRET: string;
}

export class LambdaAuthorizers extends cdk.Stack {
  public readonly authlambda: lambda.Function;
  public readonly authorizer: apigateway.TokenAuthorizer;
  public readonly publicLambda: lambda.Function;
  public readonly publicAuthorizer: apigateway.TokenAuthorizer;

  constructor(scope: any, id: string, props: LambdaAuthorizersProps) {
    super(scope, id, props);

    this.authlambda = new lambda.Function(this, "API-Auth-Handler", {
      functionName: "API-Auth-Lambda" + props.name,
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset("./src/auth", {
        exclude: ["cdk", "*.ts"],
      }),
      handler: "handler.main",
      environment: { SECRET: props.JWTSECRET },
    });

    this.authorizer = new apigateway.TokenAuthorizer(this, "API-Auth-Authorizer", {
      handler: this.authlambda,
      authorizerName: "API-Auth-Authorizer" + props.name,
      resultsCacheTtl: Duration.seconds(0),
    });

    new cdk.CfnOutput(this, "API-Auth-Authorizer-Output", { value: this.authorizer.authorizerArn });

    this.publicLambda = new lambda.Function(this, "API-Public-Auth-Handler", {
      functionName: "API-Public-Auth-Lambda" + props.name,
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset("./src/publicauth", {
        exclude: ["cdk", "*.ts"],
      }),
      handler: "handler.main",
      environment: { SECRET: props.JWTSECRET },
    });

    this.publicAuthorizer = new apigateway.TokenAuthorizer(this, "API-Public-Auth-Authorizer", {
      handler: this.publicLambda,
      authorizerName: "API-Public-Auth-Authorizer" + props.name,
      resultsCacheTtl: Duration.seconds(0),
    });

    new cdk.CfnOutput(this, "API-Public-Auth-Authorizer-Output", { value: this.publicAuthorizer.authorizerArn });
  }
}
