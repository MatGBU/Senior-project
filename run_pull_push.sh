#!/bin/bash
#exit if any line causes error
set -e

# Define the branch
branch="main"

# pull changes
echo "Pulling latest changes from github on branch ${branch}..."
git pull origin "${branch}"

# run python scripts
echo "Running Python scripts..."
cd Working_Models
echo "In working models directory!"
python3 backend.py

# staging changes
echo "Staging changes..."
git add *

# commit changes
echo "Committing changes..."
git commit -m "auto-pull/push on $(date '+%Y-%m-%d %H:%M:%S')"

# push changes
echo "Pushing changes..."
git push origin "${branch}"