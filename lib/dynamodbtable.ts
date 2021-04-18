import cdk = require("@aws-cdk/core");

export class DynamoDBTable extends cdk.Stack {
  constructor(scope: any, id: string, props: any) {
    super(scope, id, props);
  }
}
