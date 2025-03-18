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
/c/Users/alean/AppData/Local/Programs/Python/Python312/python.exe backend.py

# staging changes
echo "Staging changes..."
git add ../AutoCombine.csv
git add ../Year_weather.csv
git add ../hourly_load_forecast.csv
git add ../testing.csv
git add ../weather_forecast_test.csv

# commit changes
echo "Committing changes..."
git commit -m "auto-pull/push on $(date '+%Y-%m-%d %H:%M:%S')"

# push changes
echo "Pushing changes..."
git push origin "${branch}"