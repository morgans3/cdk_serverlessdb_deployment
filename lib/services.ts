// @ts-check

export interface LambdaInfo {
  name: string;
  type: string;
  filename: string;
  functions: string[];
  primarykey: fields;
  secondarykey?: fields;
  customfilters?: any;
  fields: fields[];
  tablename: string;
  baseendpoint: string;
  customAuth?: string;
}

interface fields {
  name: string;
  type: string;
  required?: boolean;
}

export const APIs: LambdaInfo[] = [
  {
    name: "cdk-api-dynamodb-Blogs",
    type: "dynamodb",
    filename: "dynamodb",
    functions: ["getAll", "getBy-id", "register", "delete", "update"],
    tablename: "blogs",
    baseendpoint: "blogs",
    primarykey: { name: "id", type: "string" },
    secondarykey: { name: "name", type: "string" },
    fields: [
      { name: "config", type: "string", required: true },
      { name: "type", type: "string", required: true },
      { name: "icon", type: "string", required: true },
      { name: "author", type: "string", required: true },
      { name: "status", type: "string", required: true },
      { name: "image", type: "string", required: false },
    ],
  },
  {
    name: "cdk-api-dynamodb-Blogs-Public",
    type: "dynamodb",
    filename: "dynamodb",
    functions: ["getAll", "getBy-id"],
    tablename: "blogs",
    baseendpoint: "publicblogs",
    primarykey: { name: "id", type: "string" },
    secondarykey: { name: "name", type: "string" },
    fields: [
      { name: "config", type: "string", required: true },
      { name: "type", type: "string", required: true },
      { name: "icon", type: "string", required: true },
      { name: "author", type: "string", required: true },
      { name: "status", type: "string", required: true },
      { name: "image", type: "string", required: false },
    ],
    customAuth: "public",
  },
];

export function cleanseBucketName(original: string) {
  return original.split("_").join("-");
}
