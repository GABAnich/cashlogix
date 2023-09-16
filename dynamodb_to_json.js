const fs = require("fs");
const AWS = require("aws-sdk");

const config = require("./config.json");

AWS.config.update(config);

const db = new AWS.DynamoDB.DocumentClient();

const logger = {
  info: (...args) => console.log(...args),
  error: (...args) => console.log(...args),
};

const errorHandler =
  (method, ...args) =>
  (error) => {
    logger.error("error", { error, method, args });
    throw error;
  };

const getAllTransactions = function (chat_id) {
  return db
    .query({
      TableName: "Transactions",
      KeyConditionExpression: "#chat_id = :chat_id",
      ExpressionAttributeValues: {
        ":chat_id": chat_id,
      },
      ExpressionAttributeNames: {
        "#chat_id": "chat_id",
      },
    })
    .promise()
    .then(({ Items }) => Items)
    .catch(errorHandler("getAllTransactions", arguments));
};

(async () => {
  const data = await getAllTransactions(config.chat_id);
  fs.writeFileSync("./results.json", JSON.stringify(data));
})();
