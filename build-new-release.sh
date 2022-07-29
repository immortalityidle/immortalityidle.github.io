#!/bin/bash
# this script kind of sucks, but it works on my system

echo "Copying current old build to /tmp"
rm -rf /tmp/docs
cp -rf docs/ /tmp
echo "Building"
npm run build
npm run build-experimental
npm run build-experimental2
echo "Creating new old version"
rm -rf /tmp/docs/old
rm -rf /tmp/docs/experimental
rm -rf /tmp/docs/experimental2
rm -rf docs/old
cp -rf /tmp/docs docs/old
sed -i 's/href=\"\/\"/href=\"\/old\/\"/' docs/old/index.html
