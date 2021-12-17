import * as cdk from "@aws-cdk/core";
import * as iam from "@aws-cdk/aws-iam";

export class CDKRoles extends cdk.Stack {
  public readonly lambdaARole: iam.Role;
  constructor(scope: any, id: string, props: any) {
    super(scope, id, props);

    let suffix = "";
    if (props.name) suffix = props.name;
    this.lambdaARole = new iam.Role(this, "LambdaDynamoDBRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      roleName: "LambdaDynamoDBRole" + suffix,
    });
    this.lambdaARole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonDynamoDBFullAccess"));
    this.lambdaARole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonRDSDataFullAccess"));
    this.lambdaARole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("CloudWatchFullAccess"));

    new cdk.CfnOutput(this, "RoleArn", { value: this.lambdaARole.roleArn });
  }
}
