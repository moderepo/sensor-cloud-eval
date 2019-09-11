#!/bin/bash
device_api_key=
device_id=

payload=$(cat <<EOF
{
  "deviceId": ${device_id},
  "claimable": true,
  "duration":300
}
EOF
)

curl -X POST \
     -H "Content-Type: application/json" \
     -H "Authorization: ModeCloud ${device_api_key}" \
     -d "${payload}" \
     https://api.tinkermode.com/deviceRegistration