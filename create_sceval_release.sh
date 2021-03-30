#!/bin/sh

# The release number we want to generate
RELEASE_NUMBER=$1;

# The location where all the releases will be stored
ALL_RELEASES_DIR="releases"

# The directory where the source code are located
SOURCE_DIR="sceval_frontend"

# The name of the new release directory to be generated, all the files for this released will be stored here and zipped
RELEASE_DIR="mode_sensor_dev_edition_${RELEASE_NUMBER}"

# The name of the zip file when the release directory is zipped
RELEASE_ZIP_FILE="${RELEASE_DIR}.tgz"

# The final location where the zip file will be saved, inside the releases directory
TARGET_RELEASE_FILE="${ALL_RELEASES_DIR}/${RELEASE_ZIP_FILE}"

DOCUMENTATION_FILE_NAME="INSTRUCTION.html"

# Make sure the user provide a release number
if [ -z ${RELEASE_NUMBER} ]; then
  echo "Please provide a release/version number"
  echo "Usage: './create_sceval_release.sh 1.0.3'"
  exit;
fi

# Make sure the new release file does not exist
if [ -f ${TARGET_RELEASE_FILE} ]; then
  read -r -p "Release file already exist '${TARGET_RELEASE_FILE}'. Do you want to replace this file? [y/n] " response
  if [[ ! "$response" =~ ^([yY][eE][sS]|[yY])+$ ]]; then
    exit
  fi
fi

# Create a release in Github. This is for internal use only incase the developer report issues with this release,
# we can checkout the release and test or make changes.
CREATE_TAG_RESULT=$(git tag ${RELEASE_NUMBER} 2>&1)
if [[ ${CREATE_TAG_RESULT} =~ 'fatal' ]]; then
  if [[ ${CREATE_TAG_RESULT} =~ 'already exists' ]]; then
    # if the error is because tag already existed, we can show a warning but still continue creating Zip file
    # May be the user is just trying to create a new Zip file without creating a new release
    echo 'WARNING: Unable to create Tag on Github: ' $CREATE_TAG_RESULT
  else
    # If the error is something else, may be stop the script
    echo 'ERROR: Unable to create Tag on Github: ' $CREATE_TAG_RESULT
    exit
  fi
else
  # Tag created successfully, push to github
  git push origin ${RELEASE_NUMBER}
fi

# Create a directory for the new release. We will copy all the neccessary files into this directory
# and then zip it. Then we copy the zip file to the releases directory and delete this directory.
mkdir -p ${RELEASE_DIR}

# generate HTML file for the README.md. This file will be a standalone file which mean all the images will be embed in the HTML
pandoc --metadata pagetitle='MODE Sensor Cloud Developer Edition' --self-contained -c github-pandoc.css -f markdown+emoji -s README.md -o ${RELEASE_DIR}/${DOCUMENTATION_FILE_NAME}

# Copy the API manual to the release folder
cp "how_to_use_local_api_manual_ja.pdf" "${RELEASE_DIR}/how_to_use_local_api_manual_ja.pdf"

# copy all the nessessary source file to the new release directory
FILES_TO_BE_COPIED="public src package-lock.json package.json provision.sh tsconfig.json tslint.json Dockerfile nginx.conf tsconfig.prod.json"
for FILE in ${FILES_TO_BE_COPIED}
do
  if [ -d ${SOURCE_DIR}/${FILE} ]; then
    cp -r ${SOURCE_DIR}/${FILE} ${RELEASE_DIR}/${FILE}
  else
    cp ${SOURCE_DIR}/${FILE} ${RELEASE_DIR}/${FILE}
  fi
done

# create .env file for the developer so he doesn't need to create one but just need to fill in the values
echo "REACT_APP_PROJECT_ID=\nREACT_APP_APP_ID" > "${RELEASE_DIR}/.env"

# If releases directory does not exist, create it.
mkdir -p ${ALL_RELEASES_DIR}

#zip the entire RELEASE_DIR directory and put the zipped file into the releases directory
tar -zcf ${TARGET_RELEASE_FILE} ${RELEASE_DIR}/

rm -rf ${RELEASE_DIR}

echo "Release file generated at '${TARGET_RELEASE_FILE}'"
echo "DONE"
