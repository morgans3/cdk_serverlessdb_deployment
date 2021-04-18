// @ts-check

export const Environments = [
  {
    name: "prod",
    domainName: "stewartmorganv2.com",
    auroracluster: true,
    tables: [
      { name: "blogposts", type: "dynamodb", methods: ["create", "getAll", "getByID", "update", "delete"], auth: null },
      { name: "blogcomments", type: "aurora", methods: ["create", "getAll", "getByID", "update", "delete"], auth: null },
    ],
  },
  {
    name: "dev",
    domainName: "dev.stewartmorganv2.com",
    auroracluster: true,
    tables: [
      { name: "blogposts", type: "dynamodb", methods: ["create", "getAll", "getByID", "update", "delete"], auth: null },
      { name: "blogcomments", type: "aurora", methods: ["create", "getAll", "getByID", "update", "delete"], auth: null },
    ],
  },
];

export function cleanseBucketName(original: string) {
  return original.split("_").join("-");
}
