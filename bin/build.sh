#!/bin/sh

version='1.0.0'

rm -f zotitle-${version}.xpi
zip -r zotitle-${version}.xpi chrome/* defaults/* chrome.manifest install.rdf

# To release a new version:
# - increase version number in all files (not just here)
# - run this script to create a new .xpi file
# - commit and push to Github
# - make a release on Github, and manually upload the new .xpi file
