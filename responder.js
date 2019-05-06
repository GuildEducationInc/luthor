const AWS = require('aws-sdk');
const lambda = new AWS.Lambda();

console.log('Loading function');

exports.handler = async (event, context) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  const intent = event.currentIntent.name

  let response
  console.log(`Intent is: ${intent}`);

  switch (intent) {
    case 'ScheduleNewTimeToTalk':
      const calendlyLink = event.requestAttributes.smsHistoryContactOwnerCalendlyLink
    response = handleScheduleNewTimeToTalk(calendlyLink)
    break;
    case 'AmIEligible':
      response = await handleEligibilityResponse(event.requestAttributes.smsEmployerId, event.requestAttributes.smsEmployeeId)
    break;
    case 'ProgramEndDate':
      response = await handleProgramEndDateResponse(event.requestAttributes.smsStudentId)
    break;
  }

  if (response) {
    postBackToSalesforce(response)
    return {
      'dialogAction': {
        'type': 'Close',
        'fulfillmentState': 'Fulfilled',
        'message': {
          'contentType': 'PlainText',
          'content': `${response}`
        }
      }
    };
  }
};

function postBackToSalesforce(response) {
  console.log(`Mocking sending this message back to salesforce: ${response}`)
}

async function handleEligibilityResponse(employerId, employeeId) {
  const query = `
  query {
    getLatestEligibilitySnapshot(
      employeeId: "217359299"
      employerId: "6637b2af-eceb-4de9-8789-82e5b8b36200"
    ) {
      eligible
      eligibilityCriteria {
        name
        description
        passed
      }
    }
  }
  `;

  const body = JSON.stringify({ query })

  const Payload = JSON.stringify({
    body,
    headers: {
      'Authorization': 'Bearer REPLACEME'
    },
    httpMethod: 'POST'
  })

  const params = {
    FunctionName: 'arn:aws:lambda:us-west-2:477873552632:function:employment-crud-graphql-dev',
    InvocationType: "RequestResponse",
    Payload
  };

  const { Payload: res } = await lambda.invoke(params).promise();
  const snapshot = JSON.parse(JSON.parse(res).body).data.getLatestEligibilitySnapshot;

  let readable = ''
  readable = `${snapshot.eligible ? "Yes!" : "Unfortunately, no."}`;
  readable = `${readable} Here is your employer's eligibility criteria: ${snapshot.eligibilityCriteria.map((criteria) => criteria.description).join(', ')}`;
  const link = 'https://resource.guildeducation.com/walmart-tuition-assistance-faq/';
  readable = `${readable}. Click here for details: ${link}`
  return readable;
}

async function handleProgramEndDateResponse(studentId) {
  const query = `
  query {
    listProgramEnrollmentsByStudentId(
      studentId: "12e47dde-8b94-4aea-a42c-86a922df2e83"
    ) {
      program {
        name
      }
      term {
        endDate
      }
    }
  }
  `

  const body = JSON.stringify({ query })

  const Payload = JSON.stringify({
    body,
    headers: {
      'Authorization': 'Bearer REPLACEME'
    },
    httpMethod: 'POST'
  })

  const params = {
    FunctionName: 'arn:aws:lambda:us-west-2:477873552632:function:academic-crud-graphql-dev',
    InvocationType: "RequestResponse",
    Payload
  };

  const { Payload: res } = await lambda.invoke(params).promise();
  const results = JSON.parse(JSON.parse(res).body).data.listProgramEnrollmentsByStudentId;

  if (results.length === 0) {
    return "Which program are you referring to?"
  }

  const result = results[0]
  const program = result.program.name
  const endDate = new Date(result.term.endDate)
  const today = new Date()

  const daysApart = Math.ceil((endDate - today)/(1000*60*60*24))
  const endDateString = endDate.toDateString()

  let description
  if (daysApart === 0) {
    description = "ends today"
  } else if (daysApart < 0) {
    description = `ended on ${endDateString}`
  } else {
    description = `ends on ${endDateString}`
  }

  return `Your program, ${program}, ${description}`
}

function handleScheduleNewTimeToTalk(calendlyLink) {
  return `Let's set up a time to talk. My schedule can be accessed here: ${calendlyLink}`
}
