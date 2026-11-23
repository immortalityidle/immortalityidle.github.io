#!/bin/bash

echo "Building"
npm run build
echo "Moving files"
rm docs/main-*.js
rm docs/styles-*.css
cp -rf build/browser/* docs/ 
