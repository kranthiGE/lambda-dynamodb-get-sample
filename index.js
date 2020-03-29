var AWS = require("aws-sdk");

const docClient = new AWS.DynamoDB.DocumentClient();

const groups_table = process.env.GROUPS_TABLE;

exports.handler = async (event) => {

    let response
    let limit
    let nextKey

    console.log(`dynamodb table scan started`)

    try{
        limit = parseLimitParameter(event)
        nextKey = parseNextKeyParameter(event)
    }
    catch(e){
        console.log('Failed to fetch limit value', e.message)
        return {
            statusCode: 400,
            ders: {
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                error: 'Invalid parameters'
            })
        }
    }

    const result = await docClient.scan({ // Call parameters
        TableName: groups_table,
        Limit: limit,
        ExclusiveStartKey: nextKey
    }).promise()

    const items = result.Items;

    console.log('Result: ', result)

    response = {
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            items,
            // Encode the JSON object so a client can return it in a URL as is
            nextKey: encodeNextKey(result.LastEvaluatedKey)
        })
    };

    return response
};

/**
 * Get value of the nextKey parameter.
 *
 * @param {Object} event HTTP event passed to a Lambda function
 *
 * @returns {Object} parsed "nextKey" parameter
 */
function parseNextKeyParameter(event) {
    const nextKeyStr = getQueryParameter(event, 'nextKey')
    if (!nextKeyStr) {
      return undefined
    }
  
    const uriDecoded = decodeURIComponent(nextKeyStr)
    return JSON.parse(uriDecoded)
}

/**
 * Get value of the limit parameter.
 *
 * @param {Object} event HTTP event passed to a Lambda function
 *
 * @returns {Object} parsed "limitValue" parameter
 */
function parseLimitParameter(event){
    const limit = getQueryParameter(event, 'limit')
    if(!limit){
        console.log('No limit param specified')
        return undefined
    }

    const limitValue = parseInt(limit)
    if(limitValue <= 0){
        throw new Error('Limit should be greater than zero')
    }

    return limitValue
}

/**
 * Get value of the limit parameter.
 *
 * @param {Object} event HTTP event passed to a Lambda function
 * 
 * @param {Object} name query parameter name
 *
 * @returns {Object} parsed "limitValue" parameter
 */
function getQueryParameter(event, name){
    console.log(`query parameter processing for ${name}`)
    const queryParams = event.queryStringParameters
    if(!queryParams){
        return undefined
    }    

    console.log(`fetching ${name} from query params`)
    return queryParams[name]
}

/**
 * Encode last evaluated key using
 *
 * @param {Object} lastEvaluatedKey a JS object that represents last evaluated key
 *
 * @return {string} URI encoded last evaluated key
 */
function encodeNextKey(lastEvaluatedKey) {
    if (!lastEvaluatedKey) {
      return null
    }

    return encodeURIComponent(JSON.stringify(lastEvaluatedKey))
}