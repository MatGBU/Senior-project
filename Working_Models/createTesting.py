import requests
import csv
import pandas as pd
from datetime import datetime, timedelta
import requests
import xml.etree.ElementTree as ET
import csv
from datetime import datetime, timedelta
import os
from dateutil.tz import tzlocal

fuel_categories = [
    'Coal', 'Hydro', 'Natural Gas', 'Nuclear', 'Oil', 'Other', 
    'Landfill Gas', 'Refuse', 'Solar', 'Wind', 'Wood'
    ]

base_url = "https://webservices.iso-ne.com/api/v1.1//hourlyloadforecast/day/"
username = 'alean@bu.edu'
password = 'Mq75eg8pxTBCEKY'

# Specify date range and output CSV file
start_date = datetime.now()  # Start date is today
end_date = start_date + timedelta(days=1)  # End date is tomorrow
iso_csv_file = "../hourly_load_forecast.csv"
weather_csv_file = "../weather_forecast_test.csv"
output_csv = "../testing.csv"


# Run the script
def gather_combine_testing():
    isotestdata(start_date, end_date, iso_csv_file)
    weathertestdata(start_date, end_date, weather_csv_file)
    combine(weather_csv_file, iso_csv_file, output_csv)


def fetch_data(date):
    url = f"{base_url}{date}"
    print(f"Requesting URL: {url}")
    response = requests.get(url, auth=(username, password))
    if response.status_code == 200:
        return response.text
    else:
        print(f"Error fetching data for {date}: {response.status_code}, {response.text}")
        return None


# Function to parse XML and save to CSV
def parse_and_save_to_csv(xml_data, csv_file):
    # Parse the XML data
    root = ET.fromstring(xml_data)

    # Extract the namespace from the XML
    namespace = {'ns': 'http://WEBSERV.iso-ne.com'}

    # Find all HourlyLoadForecast elements
    forecast_entries = root.findall('ns:HourlyLoadForecast', namespace)

    # Open the CSV file for writing
    with open(csv_file, mode='a', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)

        # Write the header if the file is empty
        if file.tell() == 0:
            writer.writerow(["BeginDate", "LoadMw"])

        # Write each forecast entry to the CSV
        for entry in forecast_entries:
            begin_date = safe_find_text(entry, 'ns:BeginDate', namespace)
            load_mw = safe_find_text(entry, 'ns:LoadMw', namespace)

            # Skip rows with missing required data
            if begin_date is None or load_mw is None:
                print(f"Skipping entry due to missing data: {entry}")
                continue

            writer.writerow([begin_date, load_mw])


# Helper function to safely extract text
def safe_find_text(element, tag, namespace):
    found = element.find(tag, namespace)
    return found.text if found is not None else None


# Main function to iterate over dates and process data
def isotestdata(start_date, end_date, csv_file):
    current_date = start_date
    open(csv_file, mode='w') 
    while current_date <= end_date:
        formatted_date = current_date.strftime("%Y%m%d")
        print(f"Fetching data for {formatted_date}...")
        xml_data = fetch_data(formatted_date)
        if xml_data:
            parse_and_save_to_csv(xml_data, csv_file)
        current_date += timedelta(days=1)
    print(f"Data saved to {csv_file}")


def weathertestdata(start_date, end_date, weather_csv_file):
    # Format the dates in the required format (YYYY-MM-DD)
    start_date_str = start_date.strftime('%Y-%m-%d')
    end_date_str = end_date.strftime('%Y-%m-%d')

    # Perform the GET request with updated elements
    url = f"https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/Boston%2CUnited%20States/{start_date_str}/{end_date_str}?unitGroup=us&elements=datetime%2Ctemp%2Cdew%2Chumidity%2Cprecip%2Cpreciptype%2Csnow%2Csnowdepth%2Cwindgust%2Cwindspeed%2Cwinddir%2Cpressure%2Ccloudcover%2Csolarradiation%2Csolarenergy%2Cuvindex%2Csevererisk&include=hours&key=SRGBWC4W94EFX6RMJXBC4L6EN&contentType=csv"

    response = requests.get(url)

    # Check if the response was successful
    if response.status_code != 200:
        print('Unexpected Status code:', response.status_code)
        sys.exit()

    # Write the response content into a CSV file
    with open(weather_csv_file, mode='w', newline='') as file:
        writer = csv.writer(file)
        for row in csv.reader(response.text.splitlines(), delimiter=',', quotechar='"'):
            writer.writerow(row)

    print(f"Weather data for the next three days has been saved as '{weather_csv_file}'")


def combine(WEATHER, FUEL, OUTPUTPATH): 
    # Load the weather data CSV
    weather_data = pd.read_csv(WEATHER)  # Replace with the actual file path

    # Load the fuel mix data CSV
    fuel_data = pd.read_csv(FUEL)  # Replace with the actual file path
    # Convert 'datetime' in weather data to datetime format
    weather_data['datetime'] = pd.to_datetime(weather_data['datetime'])
    # Convert 'datetime' in weather data to UTC to match the fuel data time zones
    if weather_data['datetime'].dt.tz is None:
        weather_data['datetime'] = weather_data['datetime'].dt.tz_localize('UTC')
    else:
        weather_data['datetime'] = weather_data['datetime'].dt.tz_convert('UTC')

        # Print the 'BeginDate' column for inspection
    print("BeginDate column before conversion:")
    print(fuel_data['BeginDate'].head())

    # Convert 'BeginDate' in fuel data to datetime format with explicit UTC conversion
    fuel_data['BeginDate'] = pd.to_datetime(fuel_data['BeginDate'], errors='coerce', utc=True)

    # Print the 'BeginDate' column after conversion to check if conversion was successful
    print("BeginDate column after conversion:")
    print(fuel_data['BeginDate'].head())
    # Check for any invalid dates (if any)
    invalid_dates = fuel_data[fuel_data['BeginDate'].isna()]
    if not invalid_dates.empty:
        print("Invalid 'BeginDate' entries found:")
        print(invalid_dates)
        # Optionally, drop rows with invalid 'BeginDate'
        fuel_data = fuel_data.dropna(subset=['BeginDate'])

    # Round 'BeginDate' in the fuel data to the nearest hour
    fuel_data['rounded_hour'] = fuel_data['BeginDate'].dt.round('h')

    # Sort both DataFrames by time for 'merge_asof' to work
    fuel_data = fuel_data.sort_values('rounded_hour')
    weather_data = weather_data.sort_values('datetime')

    # Perform the merge_asof to match the nearest hour in the weather data for each fuel data entry
    combined_data = pd.merge_asof(fuel_data, weather_data, left_on='rounded_hour', right_on='datetime', direction='backward')

    # Drop the 'rounded_hour' column since it's no longer needed
    combined_data = combined_data.drop(columns=['rounded_hour'])
    combined_data = combined_data.sort_values('BeginDate')
    combined_data['BeginDate'] = combined_data['BeginDate'] - timedelta(hours=5)
    # Save the combined data to a new CSV file

    combined_data.to_csv(OUTPUTPATH, index=False)

    print(f"Data combined and saved to {OUTPUTPATH}")


gather_combine_testing()