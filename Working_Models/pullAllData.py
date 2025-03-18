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

url_template = "https://webservices.iso-ne.com/api/v1.1/genfuelmix/day/{}"
username = 'alean@bu.edu'
password = 'Mq75eg8pxTBCEKY'
    

def pullAllData(weatherCSVFilename, fuelCSVFilename,OUTPUTPATH):
    # weather data
    pullWeatherData(csv_filename=weatherCSVFilename)

    # fuel data
    pullFuelData(output_filename=fuelCSVFilename)

    # combine data into one file
    combine_data(weatherCSVFilename,fuelCSVFilename,OUTPUTPATH)


def pullWeatherData(csv_filename):
    today = datetime.today().date()

    # Get the latest date from the existing CSV file
    latest_date = get_latest_date_from_csv(csv_filename)

    if latest_date is None:
        # If no existing data, start from a default date (e.g., one year ago)
        start_date = today - timedelta(days=30)
    else:
        # Start fetching data from the day after the latest date in the CSV
        start_date = latest_date + timedelta(days=1)

    # Fetch and append weather data from the latest date to today
    if start_date <= today:
        fetch_weather_data(start_date, today, csv_filename)
    else:
        print("No new data to fetch, the CSV is already up to date.")


def get_latest_date_from_csv(file_path):
    try:
        df = pd.read_csv(file_path)  # Load the CSV file
        if 'datetime' in df.columns:
            df['datetime'] = pd.to_datetime(df['datetime'], format='%Y-%m-%dT%H:%M:%S', errors='coerce')
            latest_date = df['datetime'].max()  # Get the maximum datetime value
            if pd.notna(latest_date):
                print("Latest date in the data:", latest_date.date())  # Print the latest date
                return latest_date.date()  # Return the latest date
            else:
                print("No valid datetime entries found.")
        else:
            print("Column 'datetime' not found. Available columns are:", df.columns.tolist())
    except Exception as e:
        print("Error processing the CSV file:", e)
    return None


def fetch_weather_data(start_date, end_date, output_file):
    # Format the dates for the API request (YYYY-MM-DD)
    start_date_str = start_date.strftime('%Y-%m-%d')
    end_date_str = end_date.strftime('%Y-%m-%d')

    # Weather API URL with dynamic dates
    url = f"https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/Boston%2CUnited%20States/{start_date_str}/{end_date_str}?unitGroup=us&elements=datetime%2Ctemp%2Cdew%2Chumidity%2Cprecip%2Cpreciptype%2Csnow%2Csnowdepth%2Cwindgust%2Cwindspeed%2Cwinddir%2Cpressure%2Ccloudcover%2Csolarradiation%2Csolarenergy%2Cuvindex%2Csevererisk&include=hours&key=SRGBWC4W94EFX6RMJXBC4L6EN&contentType=csv"

    response = requests.get(url)

    if response.status_code != 200:
        print('Unexpected Status code:', response.status_code)
        return

    # Append the new data to the existing CSV file
    with open(output_file, mode='a', newline='') as file:  # Open in append mode
        writer = csv.writer(file)
        csv_reader = csv.reader(response.text.splitlines(), delimiter=',', quotechar='"')

        # Skip the first row (header)
        next(csv_reader)

        # Write the remaining rows to the file
        for row in csv_reader:
            writer.writerow(row)

    print(f"Weather data from {start_date_str} to {end_date_str} has been appended to '{output_file}'")


def pullFuelData(output_filename):
    last_updated_date = get_last_updated_date(output_filename)

    if last_updated_date:
        # Set the start date as midnight of the day before the last timestamp
        start_date = fill_previous_date(last_updated_date.strftime('%Y-%m-%d %H:%M:%S%z'))
    else:
        start_date = '20241001'  # Default start date if no previous data

    # Use today's date in the required format
    end_date = datetime.now(tz=tzlocal()).strftime('%Y%m%d')
    
    aggregated_data = []
    
    current_date = datetime.strptime(start_date, '%Y%m%d')
    end_date = datetime.strptime(end_date, '%Y%m%d')
    delta = timedelta(days=1)
    
    while current_date <= end_date:
        date_str = current_date.strftime('%Y%m%d')
        xml_data = get_fuelmix_data_for_date(date_str)
        
        if xml_data:
            daily_data = parse_fuelmix_data(xml_data)
            aggregated_data.extend(daily_data)
        
        current_date += delta
    
    write_to_csv(aggregated_data, output_filename, append=True)
    print(f"Data aggregation complete. Output written to {output_filename}")


def combine_data(weatherCSVFilename, fuelCSVFilename, OUTPUTPATH):
    "Funcrtion to combine the data that has been pulled in the last two functions"
    # Load the weather data CSV
    weather_data = pd.read_csv(weatherCSVFilename)  # Replace with the actual file path

    # Load the fuel mix data CSV
    fuel_data = pd.read_csv(fuelCSVFilename)  # Replace with the actual file path

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

    # Save the combined data to a new CSV file

    combined_data.to_csv(OUTPUTPATH, index=False)

    print(f"Data combined and saved to {OUTPUTPATH}")

    return None 

def fill_previous_date(last_timestamp):
    """
    This is to get data from last time stamp until midnight of that day
    """
    last_datetime = datetime.strptime(last_timestamp, "%Y-%m-%d %H:%M:%S%z")
    
    # Set the start date to midnight of the previous day
    previous_midnight = (last_datetime - timedelta(days=1)).replace(hour=0, minute=0, second=0)

    # Format the date string for the API request
    start_date = previous_midnight.strftime("%Y%m%d")
    
    return start_date


def get_last_updated_date(filename):
    if not os.path.exists(filename):
        return None  # If file doesn't exist, return None

    with open(filename, mode='r') as file:
        reader = csv.reader(file)
        next(reader)  # Skip the header
        rows = list(reader)
        if rows:
            # Get the last row's date (assuming sorted or appending)
            last_row = rows[-1]
            print(f"Last row in the CSV: {last_row}")  # Debugging output

            # Ensure the row has the expected 'BeginDate' column at index 0
            if len(last_row) > 0 and last_row[0].strip():
                last_date = last_row[0].strip()  # The 'BeginDate' column
                try:
                    # Parse the date-time format with milliseconds and timezone offset
                    return datetime.strptime(last_date, '%Y-%m-%d %H:%M:%S%z')
                except ValueError as e:
                    print(f"Error parsing date: {e}")
                    return None
            else:
                print("The last row does not contain a valid BeginDate.")
                return None
        else:
            print("The CSV file is empty or has no valid rows.")
            return None


# Function to check if a timestamp exists in the CSV
def timestamp_exists(filename, timestamp):
    with open(filename, mode='r') as file:
        reader = csv.reader(file)
        next(reader)  # Skip header
        for row in reader:
            if len(row) > 0 and row[0] == timestamp:
                return True
    return False


# Function to get data from the API for a specific date
def get_fuelmix_data_for_date(date):
    url = url_template.format(date)
    response = requests.get(url, auth=(username, password))
    
    if response.status_code == 200:
        return response.content
    else:
        print(f"Failed to retrieve data for {date}: {response.status_code}")
        return None


# Function to parse the XML response and organize data by timestamp
def parse_fuelmix_data(xml_data):
    root = ET.fromstring(xml_data)
    namespace = {'ns': 'http://WEBSERV.iso-ne.com'}
    
    # List to hold each row's data (one row per timestamp)
    data_rows = []
    
    # Dictionary to keep track of generation values by fuel type for each timestamp
    timestamp_data = {}
    
    for gen_fuel_mix in root.findall('ns:GenFuelMix', namespace):
        begin_date = gen_fuel_mix.find('ns:BeginDate', namespace).text  # Full timestamp (date and time)
        begin_date = begin_date.replace('T', ' ') #???
        # Convert timestamp format from 'YYYY-MM-DDTHH:MM:SS.SSS±HH:MM' to 'YYYY-MM-DD HH:MM:SS±HH:MM'
        parsed_date = datetime.strptime(begin_date, '%Y-%m-%d %H:%M:%S.%f%z')
        formatted_date = parsed_date.strftime('%Y-%m-%d %H:%M:%S%z')  # New format with space
        formatted_date = formatted_date[:-2] + ':' + formatted_date[-2:]
        
        gen_mw = float(gen_fuel_mix.find('ns:GenMw', namespace).text)
        fuel_category = gen_fuel_mix.find('ns:FuelCategory', namespace).text
        
        # Initialize the dictionary for each timestamp
        if formatted_date not in timestamp_data:
            timestamp_data[formatted_date] = {category: 0.0 for category in fuel_categories}
        
        # Only track known fuel categories and accumulate power for this timestamp
        if fuel_category in timestamp_data[formatted_date]:
            timestamp_data[formatted_date][fuel_category] += gen_mw
    
    # Convert the dictionary to a list of rows for CSV writing
    for timestamp, fuel_data in timestamp_data.items():
        row = [timestamp] + [fuel_data.get(category, 0.0) for category in fuel_categories]
        data_rows.append(row)
    
    return data_rows


# Function to write aggregated data to CSV, ensuring no extra blank lines
def load_existing_timestamps(filename):
    timestamps = set()
    if os.path.exists(filename):
        with open(filename, mode='r') as file:
            reader = csv.reader(file)
            next(reader)  # Skip header
            for row in reader:
                if len(row) > 0:
                    timestamps.add(row[0])
    return timestamps


# Updated write_to_csv
def write_to_csv(data, filename, append=False):
    mode = 'a' if append else 'w'
    write_header = not append or not os.path.exists(filename)
    
    # Pre-load all existing timestamps
    existing_timestamps = load_existing_timestamps(filename)
    
    with open(filename, mode=mode, newline='') as file:
        writer = csv.writer(file)
        
        # Only write the header if it's a new file or the first write
        if write_header:
            header = ['BeginDate'] + fuel_categories
            writer.writerow(header)
        
        # Write the data rows in the required format, avoiding duplicate timestamps
        for row in data:
            if row[0] not in existing_timestamps:  # Avoid double writes
                writer.writerow(row)


pullAllData("../Year_weather.csv", "../genfuelmix_aggregatedyear.csv", "../AutoCombine.csv")