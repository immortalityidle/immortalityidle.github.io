#!/bin/bash
# this script kind of sucks, but it works on my system

echo "Copying current old build to /tmp"
rm -rf /tmp/docs
cp -rf docs/ /tmp
echo "Building"
npm run build
echo "Creating new old version"
rm -rf /tmp/docs/old
rm -rf docs/old
cp -rf /tmp/docs docs/old
sed -i 's/href=\"\/\"/href=\"\/old\/\"/' docs/old/index.html
echo "restoring classic version"
cp -rf /tmp/docs/classic docs/classic
