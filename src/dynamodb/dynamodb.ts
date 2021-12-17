import { DynamoDB } from "aws-sdk";
const docClient = new DynamoDB.DocumentClient();

module.exports.getAll = (event: any, context: any, callback: any) => {
  if (!process.env.tablename) {
    console.error("API--LAMBDA--DYNAMODB--FAILED: Bad setup, no tablename.");
    callback(null, {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
      body: "Bad Request. Table not found.",
    });
    return;
  }
  try {
    getAll(process.env.tablename, (error: any, result: any) => {
      if (error) {
        console.error("API--LAMBDA--DYNAMODB--FAILED: " + error);
        callback(null, {
          statusCode: error.statusCode || 501,
          headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
          body: "Could not reach Database.",
        });
        return;
      }
      const response = {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify(result.Items),
      };
      callback(null, response);
    });
  } catch (error) {
    var body = JSON.stringify(error, null, 2);
    console.error("API--LAMBDA--DYNAMODB--FAILED: " + JSON.stringify(body));
    callback(null, {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(body),
    });
  }
};

function getAll(tablename: string, callback: any) {
  var params = {
    TableName: tablename,
  };
  docClient.scan(params, callback);
}

module.exports.getByID = (event: any, context: any, callback: any) => {
  try {
    const primarykey = process.env.primarykey || "id";
    if (!event.queryStringParameters[primarykey]) {
      console.error("API--LAMBDA--DYNAMODB--FAILED: primary key not provided in api call");
      callback(null, {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
        body: "Bad Request. Could not find " + primarykey + " in request.",
      });
      return;
    }
    const tablename = process.env.tablename || "undefined";
    getItemByKey(tablename, primarykey, event.queryStringParameters[primarykey], (error: any, result: any) => {
      if (error) {
        console.error("API--LAMBDA--DYNAMODB--FAILED: " + error);
        callback(null, {
          statusCode: error.statusCode || 501,
          headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
          body: "Could not fetch the item from the Database.",
        });
        return;
      }
      const response = {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify(result.Items),
      };
      callback(null, response);
    });
  } catch (tryerror) {
    console.error("API--LAMBDA--DYNAMODB--FAILED: " + tryerror);
    callback(null, {
      statusCode: 501,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
      body: "Problem with lambda. " + tryerror,
    });
  }
};

function getItemByKey(tablename: string, keyname: any, keyvalue: any, callback: any) {
  const KeyConditionExpression = "#" + keyname + " = :" + keyname;
  const ExpressionAttributeNames = updateexpressionnames([keyname]);
  const ExpressionAttributeValues = newexpression([keyname], keyvalue);
  var params = {
    TableName: tablename,
    KeyConditionExpression: KeyConditionExpression,
    ExpressionAttributeNames: ExpressionAttributeNames,
    ExpressionAttributeValues: ExpressionAttributeValues,
  };
  docClient.query(params, callback);
}

module.exports.getByIndex = (event: any, context: any, callback: any) => {
  try {
    const primaryindex = process.env.indexinfo || "id";
    if (!event.queryStringParameters[primaryindex]) {
      console.error("API--LAMBDA--DYNAMODB--FAILED: index not provided in api call");
      callback(null, {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
        body: "Bad Request. Could not find " + primaryindex + " in request.",
      });
      return;
    }
    const tablename = process.env.tablename || "undefined";
    getItemByIndex(tablename, primaryindex, event.queryStringParameters[primaryindex], (error: any, result: any) => {
      if (error) {
        console.error("API--LAMBDA--DYNAMODB--FAILED: " + error);
        callback(null, {
          statusCode: error.statusCode || 501,
          headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
          body: "Could not fetch the item from the Database.",
        });
        return;
      }
      const response = {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify(result.Items),
      };
      callback(null, response);
    });
  } catch (tryerror) {
    console.error("API--LAMBDA--DYNAMODB--FAILED: " + tryerror);
    callback(null, {
      statusCode: 501,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
      body: "Problem with lambda. " + tryerror,
    });
  }
};

function getItemByIndex(tablename: string, keyname: any, keyvalue: any, callback: any) {
  const KeyConditionExpression = "#" + keyname + " = :" + keyname;
  const ExpressionAttributeNames = updateexpressionnames([keyname]);
  const ExpressionAttributeValues = newexpression([keyname], keyvalue);
  var params = {
    TableName: tablename,
    IndexName: keyname + "-index",
    KeyConditionExpression: KeyConditionExpression,
    ExpressionAttributeNames: ExpressionAttributeNames,
    ExpressionAttributeValues: ExpressionAttributeValues,
  };
  docClient.query(params, callback);
}

function getItemByDualIndex(tablename: string, keynames: any, keyvalues: any, callback: any) {
  const KeyConditionExpression = "#" + keynames[0] + " = :" + keynames[0] + " AND #" + keynames[1] + " = :" + keynames[1];
  const ExpressionAttributeNames = updateexpressionnames(keynames);
  const ExpressionAttributeValues = newexpressions(keynames, keyvalues);
  var params = {
    TableName: tablename,
    IndexName: keynames[0] + "-" + keynames[1] + "-index",
    KeyConditionExpression: KeyConditionExpression,
    ExpressionAttributeNames: ExpressionAttributeNames,
    ExpressionAttributeValues: ExpressionAttributeValues,
  };
  docClient.query(params, callback);
}

module.exports.getAllByFilter = (event: any, context: any, callback: any) => {
  if (!process.env.tablename || !process.env.indexinfo) {
    console.error("API--LAMBDA--DYNAMODB--FAILED: Bad setup, no tablename or filter.");
    callback(null, {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
      body: "Bad Request. Table not found.",
    });
    return;
  }
  try {
    getAllByFilter(process.env.tablename, process.env.indexinfo, (error: any, result: any) => {
      if (error) {
        console.error("API--LAMBDA--DYNAMODB--FAILED: " + error);
        callback(null, {
          statusCode: error.statusCode || 501,
          headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
          body: "Could not reach Database.",
        });
        return;
      }
      const response = {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify(result.Items),
      };
      callback(null, response);
    });
  } catch (error) {
    var body = JSON.stringify(error, null, 2);
    console.error("API--LAMBDA--DYNAMODB--FAILED: " + JSON.stringify(body));
    callback(null, {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(body),
    });
  }
};

function getAllByFilter(tablename: string, filter: any, callback: any) {
  var params = {
    TableName: tablename,
    FilterExpression: filter,
  };
  docClient.scan(params, callback);
}

function getAllByFilterValue(tablename: string, filter: any, filtername: any, filtervalue: any, callback: any) {
  const ExpressionAttributeNames = updateexpressionnames(filtername);
  const ExpressionAttributeValues = newexpression([filtername], filtervalue);
  var params = {
    TableName: tablename,
    FilterExpression: filter,
    ExpressionAttributeValues: ExpressionAttributeValues,
    ExpressionAttributeNames: ExpressionAttributeNames,
  };
  docClient.scan(params, callback);
}

function getAllByFilterValues(tablename: string, filter: any, filternames: any, filtervalues: any, callback: any) {
  const ExpressionAttributeNames = updateexpressionnames(filternames);
  const ExpressionAttributeValues = newexpressions(filternames, filtervalues);
  var params = {
    TableName: tablename,
    FilterExpression: filter,
    ExpressionAttributeValues: ExpressionAttributeValues,
    ExpressionAttributeNames: ExpressionAttributeNames,
  };
  docClient.scan(params, callback);
}

module.exports.getActive = (event: any, context: any, callback: any) => {
  if (!process.env.tablename || !process.env.indexinfo) {
    console.error("API--LAMBDA--DYNAMODB--FAILED: Bad setup, no tablename or filter.");
    callback(null, {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
      body: "Bad Request. Table not found.",
    });
    return;
  }
  try {
    getActive(process.env.tablename, process.env.indexinfo, (error: any, result: any) => {
      if (error) {
        console.error("API--LAMBDA--DYNAMODB--FAILED: " + error);
        callback(null, {
          statusCode: error.statusCode || 501,
          headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
          body: "Could not reach Database.",
        });
        return;
      }
      const response = {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify(result.Items),
      };
      callback(null, response);
    });
  } catch (error) {
    var body = JSON.stringify(error, null, 2);
    console.error("API--LAMBDA--DYNAMODB--FAILED: " + JSON.stringify(body));
    callback(null, {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(body),
    });
  }
};

function getActive(tablename: string, filter: any, callback: any) {
  var params = {
    TableName: tablename,
    FilterExpression: filter,
    ExpressionAttributeValues: {
      ":DateTime": new Date().toISOString(),
    },
  };
  docClient.scan(params, callback);
}

module.exports.register = (event: any, context: any, callback: any) => {
  const tablename = process.env.tablename || "undefined";
  const primarykey = process.env.primarykey || "id";
  const secondarykey = process.env.secondarykey || "";
  if (!process.env.tablename || !process.env.fields) {
    console.error("API--LAMBDA--DYNAMODB--FAILED: Bad setup, no tablename.");
    callback(null, {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
      body: "Bad Request. Table not found.",
    });
    return;
  }
  try {
    const payload = event.body;
    if (!event.body || !checkPayload(payload, primarykey, secondarykey, process.env.fields)) {
      console.error("API--LAMBDA--DYNAMODB--FAILED: Improper payload: " + event.body);
      callback(null, {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
        body: JSON.stringify({ msg: "Bad Request. Could not find full payload of request.", params: event }),
      });
      return;
    }

    const newItem = convertToAWSItem(JSON.parse(payload), primarykey, secondarykey, process.env.fields);
    console.log(newItem);
    addItem(tablename, newItem, (error: any, result: any) => {
      if (error) {
        console.error("API--LAMBDA--DYNAMODB--FAILED: Unable to add item: " + error);
        callback(null, {
          statusCode: error.statusCode || 501,
          headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
          body: JSON.stringify({ success: false, msg: "Failed to register: " + error, item: newItem }),
        });
        return;
      }
      const response = {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
        body: JSON.stringify({ success: true, msg: "Registered" }),
      };
      callback(null, response);
    });
  } catch (tryerror) {
    console.error("API--LAMBDA--DYNAMODB--FAILED: Register function error: " + tryerror);
    callback(null, {
      statusCode: 501,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
      body: "Problem with lambda. " + tryerror,
    });
  }
};

function convertToAWSItem(payload: any, primarykey: string, secondarykey: string, fields: any) {
  const fieldsobj = JSON.parse(fields);
  let Item: any = {};
  const primPropType = propType(primarykey, payload, fieldsobj);
  Item[primarykey] = primPropType;
  if (secondarykey !== "" && payload[secondarykey]) {
    const secPropType = propType(secondarykey, payload, fieldsobj);
    Item[secondarykey] = secPropType;
  }
  fieldsobj.forEach((field: any) => {
    if (payload[field.name]) {
      const selPropType = propType(field.name, payload, fieldsobj);
      Item[field.name] = selPropType;
    }
  });
  return Item;
}

function propType(field: any, value: any, fieldsobj: any) {
  const fieldFull = fieldsobj.filter((x: any) => x.name === field);
  if (!fieldFull || fieldFull.length === 0) {
    return { S: value[field] };
  }
  switch (fieldFull[0].type) {
    case "byte":
      return { B: value[fieldFull[0].name] };
    case "boolean":
      return { BOOL: value[fieldFull[0].name] };
    case "number":
      return { N: value[fieldFull[0].name].toString() };
    case "array_byte":
      return { BS: value[fieldFull[0].name] };
    case "array_number":
      return { NS: value[fieldFull[0].name] };
    case "array_string":
      return { SS: value[fieldFull[0].name] };
    default:
      return { S: value[fieldFull[0].name] };
  }
}

function checkPayload(newpayload: any, primarykey: string, secondarykey: string, fields: any) {
  const fieldsobj = JSON.parse(fields);
  const payload = JSON.parse(newpayload);
  const keys = Object.keys(payload);
  if (!payload[primarykey]) return false;
  if (secondarykey !== "" && !payload[secondarykey]) return false;
  let flag = true;
  fieldsobj.forEach((field: any) => {
    if (field.required && !keys.includes(field.name)) flag = false;
  });
  return flag;
}

function addItem(tablename: string, newItem: any, callback: any) {
  var client = new DynamoDB();
  var params = {
    TableName: tablename,
    Item: newItem,
  };
  client.putItem(params, callback);
}

module.exports.delete = (event: any, context: any, callback: any) => {
  const tablename = process.env.tablename || "undefined";
  const primarykey = process.env.primarykey || "id";
  const secondarykey = process.env.secondarykey || "";
  if (!process.env.tablename) {
    console.error("API--LAMBDA--DYNAMODB--FAILED: Bad setup, no tablename.");
    callback(null, {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
      body: "Bad Request. Table not found.",
    });
    return;
  }
  try {
    const payload = JSON.parse(event.body);
    if (!event.body || !payload || !payload[primarykey]) {
      console.error("API--LAMBDA--DYNAMODB--FAILED: Improper payload: " + event.body);
      callback(null, {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
        body: JSON.stringify({ msg: "Bad Request. Could not find full key.", params: event }),
      });
      return;
    }

    let key: any = {};
    key[primarykey] = payload[primarykey];
    if (secondarykey !== "") key[secondarykey] = payload[secondarykey];

    removeItem(tablename, key, (error: any, result: any) => {
      if (error) {
        console.error("API--LAMBDA--DYNAMODB--FAILED: Unable to remove item: " + error);
        callback(null, {
          statusCode: error.statusCode || 501,
          headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
          body: JSON.stringify({ success: false, msg: "Failed to remove item : " + error, key: key }),
        });
        return;
      }
      const response = {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
        body: JSON.stringify({ success: true, msg: "Removed" }),
      };
      callback(null, response);
    });
  } catch (tryerror) {
    console.error("API--LAMBDA--DYNAMODB--FAILED: Delete function error: " + tryerror);
    callback(null, {
      statusCode: 501,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
      body: "Problem with lambda. " + tryerror,
    });
  }
};

function removeItem(tablename: string, key: any, callback: any) {
  var getparams = {
    TableName: tablename,
    Key: key,
  };
  docClient.delete(getparams, (err: any, result: any) => {
    if (err) callback(err, { status: 400, msg: err });
    else callback(null, { status: 200, msg: result });
  });
}

module.exports.update = (event: any, context: any, callback: any) => {
  const tablename = process.env.tablename || "undefined";
  const primarykey = process.env.primarykey || "id";
  const secondarykey = process.env.secondarykey || "";
  if (!process.env.tablename) {
    console.error("API--LAMBDA--DYNAMODB--FAILED: Bad setup, no tablename.");
    callback(null, {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
      body: "Bad Request. Table not found.",
    });
    return;
  }
  try {
    const payload = JSON.parse(event.body);
    if (!event.body || !payload || !payload[primarykey]) {
      console.error("API--LAMBDA--DYNAMODB--FAILED: Improper payload: " + event.body);
      callback(null, {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
        body: JSON.stringify({ msg: "Bad Request. Could not find full key.", params: event }),
      });
      return;
    }

    let key = [primarykey];
    if (secondarykey !== "") key.push(secondarykey);

    updateItem(tablename, key, payload, (error: any, result: any) => {
      if (error) {
        console.error("API--LAMBDA--DYNAMODB--FAILED: Unable to update item: " + error);
        callback(null, {
          statusCode: error.statusCode || 501,
          headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
          body: JSON.stringify({ success: false, msg: "Failed to update item : " + error, key: key }),
        });
        return;
      }
      const response = {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
        body: JSON.stringify({ success: true, msg: "Updated", response: result }),
      };
      callback(null, response);
    });
  } catch (tryerror) {
    console.error("API--LAMBDA--DYNAMODB--FAILED: Delete function error: " + tryerror);
    callback(null, {
      statusCode: 501,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
      body: "Problem with lambda. " + tryerror,
    });
  }
};

function updateItem(tablename: string, filters: string[], updatedItem: any, callback: any) {
  let fields = Object.keys(updatedItem);
  fields = fields.filter((x) => !filters.includes(x));
  const update = "set " + updatefields(fields);
  const expressionvals = updateexpression(fields, updatedItem);
  const expressionnames = updateexpressionnames(fields);
  const keys = setkeys(filters, updatedItem);
  var params = {
    TableName: tablename,
    Key: keys,
    UpdateExpression: update,
    ExpressionAttributeValues: expressionvals,
    ExpressionAttributeNames: expressionnames,
    ReturnValues: "UPDATED_NEW",
  };
  docClient.update(params, callback);
}

function updateArchive(tablename: string, updatedItem: any, callback: any) {
  var client = new DynamoDB();
  var params = {
    TableName: tablename + "_archive",
    Item: updatedItem,
  };
  client.putItem(params, callback);
}

function setkeys(fields: any, item: any) {
  let exp: any = {};
  fields.forEach((val: any) => {
    exp[val] = item[val];
  });
  return exp;
}

function updatefields(fields: any) {
  let output = "";
  fields.forEach((val: any) => {
    output += "#" + val + "=:" + val + ",";
  });
  return output.substring(0, output.length - 1);
}

function updateexpression(fields: any, updateItem: any) {
  let exp: any = {};
  fields.forEach((val: any) => {
    exp[":" + val] = updateItem[val];
  });
  return exp;
}

function newexpression(fields: any, updateItem: any) {
  let exp: any = {};
  fields.forEach((val: any) => {
    exp[":" + val] = updateItem;
  });
  return exp;
}

function newexpressions(fields: any, items: any) {
  let exp: any = {};
  for (let index = 0; index < fields.length; index++) {
    exp[":" + fields[index]] = items[index];
  }
  return exp;
}

function updateexpressionnames(fields: any) {
  let exp: any = {};
  fields.forEach((val: any) => {
    exp["#" + val] = val;
  });
  return exp;
}
