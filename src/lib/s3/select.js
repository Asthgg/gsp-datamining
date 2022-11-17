const { SelectObjectContentCommand, JSONType } = require('@aws-sdk/client-s3');

const convertDataToJson = async (generator) => {
  const chunks = [];
  for await (const value of generator) {
    if (value.Records) {
      chunks.push(value.Records.Payload);
    }
  }
  let payload = Buffer.concat(chunks).toString('utf8');
//   console.log(payload)
  payload = payload.replace(/,$/, '');
  return JSON.parse(`[${payload}]`);
};

export const selectObject = async (client, Bucket, Key, query) => {
	const params = {
	    Bucket,
	    Key,
	    ExpressionType: 'SQL',
	    Expression: query,
	    InputSerialization: {
	      JSON: {
	        Type: JSONType.DOCUMENT,
	      },
	      CompressionType: 'NONE',
	    },
	    OutputSerialization: {
	      JSON: {
	        RecordDelimiter: ',',
	      },
	    },
	};
	
	const command = new SelectObjectContentCommand(params);
	const response = await client.send(command);

  const result = convertDataToJson(response.Payload);
	return result;
}

module.exports = {
	selectObject
}
