#!/bin/bash
# this script kind of sucks, but it works on my system

echo "Copying current old build to /tmp"
rm -rf /tmp/docs
cp -rf docs/ /tmp
echo "Building"
npm run build
echo "restoring classic version"
cp -rf /tmp/docs/classic docs/classic
echo "Creating new old version"
# remove the versions we don't want to put in the new old version
rm -rf /tmp/docs/old
rm -rf /tmp/docs/experimental
rm -rf /tmp/docs/experimental2
rm -rf /tmp/docs/classic
# remove the previous old version
rm -rf docs/old
# copy in the new old version
cp -rf /tmp/docs docs/old
sed -i 's/href=\"\/\"/href=\"\/old\/\"/' docs/old/index.html

npm run build-experimental
