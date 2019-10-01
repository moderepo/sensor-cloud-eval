#!/bin/sh

# The release number we want to generate
RELEASE_NUMBER=$1;

# The location where all the releases will be stored
ALL_RELEASES_DIR="releases"

# The directory where the source code are located
SOURCE_DIR="sceval_frontend"

# The name of the new release directory to be generated, all the files for this released will be stored here and zipped
RELEASE_DIR="sceval_release_${RELEASE_NUMBER}"

# The name of the zip file when the release directory is zipped
RELEASE_ZIP_FILE="${RELEASE_DIR}.tgz"

# The final location where the zip file will be saved, inside the releases directory
TARGET_RELEASE_FILE="${ALL_RELEASES_DIR}/${RELEASE_ZIP_FILE}"

# Make sure the user provide a release number
if [ -z ${RELEASE_NUMBER} ]; then
  echo "Please provide a release number"
  echo "usage: './create_sceval_release.sh 123'"
  exit;
fi

# Make sure the new release file does not exist
if [ -f ${TARGET_RELEASE_FILE} ]; then
  read -r -p "Release file already exist '${TARGET_RELEASE_FILE}'. Do you want to replace this file? [y/n] " response
  if [[ ! "$response" =~ ^([yY][eE][sS]|[yY])+$ ]]; then
    exit
  fi
fi

# Create a directory for the new release. We will copy all the neccessary files into this directory
# and then zip it. Then we copy the zip file to the releases directory and delete this directory.
mkdir -p ${RELEASE_DIR}

# generate HTML file for the README.md. This file will be a standalone file which mean all the images will be embed in the HTML
pandoc --metadata pagetitle='MODE Sensor Cloud Developer Edition' --self-contained -c github-pandoc.css -s README.md -o ${RELEASE_DIR}/INSTRUCTION.html

# copy all the nessessary source file to the new release directory
FILES_TO_BE_COPIED="public src package-lock.json package.json provision.sh tsconfig.json tslint.json Dockerfile Makefile nginx.conf tsconfig.prod.json"
for FILE in ${FILES_TO_BE_COPIED}
do
  if [ -d ${SOURCE_DIR}/${FILE} ]; then
    cp -r ${SOURCE_DIR}/${FILE} ${RELEASE_DIR}/${FILE}
  else
    cp ${SOURCE_DIR}/${FILE} ${RELEASE_DIR}/${FILE}
  fi
done

# If releases directory does not exist, create it.
mkdir -p ${ALL_RELEASES_DIR}

#zip the entire RELEASE_DIR directory and put the zipped file into the releases directory
tar -zcf ${TARGET_RELEASE_FILE} ${RELEASE_DIR}/

rm -rf ${RELEASE_DIR}

echo "Release file generated at '${TARGET_RELEASE_FILE}'"
echo "DONE"
