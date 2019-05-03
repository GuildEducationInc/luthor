aws-jumpcloud exec guild-dev -- true && eval "$(aws-jumpcloud export guild-dev)"

SERVICE='luthor-gateway'
REGION='us-west-2'
S3_BUCKET="guild-$STAGE-lambda-artifacts-$REGION"
STACK_NAME="$SERVICE-$REGION-$STAGE"

sam package \
  --template-file template.yaml \
  --s3-bucket $S3_BUCKET \
  --output-template-file "package.$STAGE.yaml" \
  --region $REGION
