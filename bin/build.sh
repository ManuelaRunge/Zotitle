#!/bin/sh

version='1.1.2'

rm -f Zotitle-${version}.xpi
zip -r Zotitle-${version}.xpi bootstrap.js manifest.json updates.json

# To release a new version:
# - increase version number in all files (not just here)
# - run this script to create a new .xpi file
# - commit and push to Github
# - make a release on Github, and manually upload the new .xpi file
