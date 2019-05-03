aws-jumpcloud exec guild-dev -- true && eval "$(aws-jumpcloud export guild-dev)"

STAGE=dev
SERVICE='luthor-gateway'
REGION='us-west-2'
S3_BUCKET="guild-$STAGE-lambda-artifacts-$REGION"
STACK_NAME="$SERVICE-$REGION-$STAGE"

sam deploy \
  --template-file gateway.yaml \
  --stack-name $STACK_NAME \
  --capabilities CAPABILITY_IAM \
  --region $REGION

API_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --query 'Stacks[0].Outputs[0].OutputValue' \
  --region $REGION)

API_ENDPOINT=$(sed -e 's/^"//' -e 's/"$//' <<< ${API_ENDPOINT})
echo "$STACK_NAME URL: $API_ENDPOINT"
