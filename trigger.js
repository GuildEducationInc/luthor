console.log('Loading function');
/* global AWS */
const AWS = require('aws-sdk')

exports.handler = async (event, context, callback) => {
  console.log('Received event:', JSON.stringify(event, null, 2))

  let { smsHistoryMessage, ...restOfRequestBody } = event

  console.log(`Object: ${JSON.stringify(restOfRequestBody)}`)

  for (const key in restOfRequestBody) {
    restOfRequestBody[key] = `${restOfRequestBody[key]}`
  }

  const params = {
    botAlias: 'LuthorTest',
    botName: 'LuthorTest',
    inputText: smsHistoryMessage,
    userId: 'triggerLuthorLambda',
    requestAttributes: restOfRequestBody /* This value will be JSON encoded on your behalf with JSON.stringify() */
  }

  const lex = new AWS.LexRuntime()

  return await lex.postText(params).promise()
};
