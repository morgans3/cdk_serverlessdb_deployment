import { _ACCESSID, _AWSREGION } from "../bin/_config";
const AWS = require("aws-sdk");
AWS.config.update({ region: _AWSREGION });
AWS.config.credentials = new AWS.SharedIniFileCredentials({ profile: _ACCESSID });

export async function getSecret(secretName: string, callback: (arg: any) => void) {
  let client = new AWS.SecretsManager();
  await client.getSecretValue({ SecretId: secretName }, (err: any, data: any) => {
    if (err) {
      callback(null);
    } else {
      if ("SecretString" in data) {
        callback(data.SecretString);
      } else {
        callback(Buffer.from(data.SecretBinary, "base64").toString("ascii"));
      }
    }
  });
}
