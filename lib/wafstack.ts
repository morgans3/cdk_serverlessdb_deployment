import cdk = require("@aws-cdk/core");
import * as wafv2 from "@aws-cdk/aws-wafv2";
import { StackProps, Fn } from "@aws-cdk/core";
import * as apigateway from "@aws-cdk/aws-apigateway";

export interface WAFProps extends StackProps {
  apigateway: apigateway.RestApi;
}

export class WAFStack extends cdk.Stack {
  public readonly attrId: string;
  constructor(scope: any, id: string, props: WAFProps) {
    super(scope, id, props);

    const waf = new wafv2.CfnWebACL(this, "WebACLForAPIGateway", {
      name: "APIGateway-WAF",
      description: "ACL for API Gateway",
      scope: "REGIONAL",
      defaultAction: { allow: {} },
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: "tnc-firewall",
      },
      rules: [
        // {
        //   name: "GeoMatch",
        //   priority: 0,
        //   action: {
        //     block: {},
        //   },
        //   statement: {
        //     notStatement: {
        //       statement: {
        //         geoMatchStatement: {
        //           countryCodes: ["GB"],
        //         },
        //       },
        //     },
        //   },
        //   visibilityConfig: {
        //     sampledRequestsEnabled: true,
        //     cloudWatchMetricsEnabled: true,
        //     metricName: "GeoMatch",
        //   },
        // },
        {
          name: "LimitRequests100",
          priority: 1,
          action: {
            block: {},
          },
          statement: {
            rateBasedStatement: {
              limit: 100,
              aggregateKeyType: "IP",
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: "LimitRequests100",
          },
        },
      ],
    });
    let apiGwArn = this.getResourceARNForEndpoint(props.env!.region || "eu-west-2", props.apigateway.deploymentStage.restApi.restApiId, props.apigateway.deploymentStage.stageName);
    new wafv2.CfnWebACLAssociation(this, "mywebaclassoc", {
      webAclArn: waf.attrArn,
      resourceArn: apiGwArn,
    });
    this.attrId = waf.attrArn;
    new cdk.CfnOutput(this, "WAFArn", { value: this.attrId });
  }

  getResourceARNForEndpoint(region: string, restApiId: string, stageName: string): string {
    let Arn: string = Fn.join("", ["arn:aws:apigateway:", region, "::/restapis/", restApiId, "/stages/", stageName]);
    return Arn;
  }
}
