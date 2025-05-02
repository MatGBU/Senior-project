from pullAllData import pullAllData
import pandas as pd
from datetime import datetime, timedelta
weather_csv = '../Year_weather.csv'
fuel_csv = '../genfuelmix_aggregatedyear.csv'
output_csv = '../AutoCombine.csv'
pullAllData(weather_csv, fuel_csv, output_csv)
# Columns in predictions BeginDate,Total_Predicted,HydroPredictions,NuclearPredictions,WindPredictions,SolarPredictions,RefusePredictions,WoodPredictions
#  Columns in Autocombine BeginDate,Coal,Hydro,Natural Gas,Nuclear,Oil,Other,Landfill Gas,Refuse,Solar,Wind,Wood
# Load the CSV
df = pd.read_csv("../AutoCombine.csv")

# Convert BeginDate to datetime format (in case it's not)
df['BeginDate'] = pd.to_datetime(df['BeginDate'])
df['BeginDate'] = df['BeginDate'] - timedelta(hours=4)

# Get today's date
today = pd.to_datetime(datetime.today().date())

# Filter for today's date
filtered_df = df[df['BeginDate'].dt.date == today.date()].copy()

# Create renamed columns and total predicted generation
if not filtered_df.empty:
    filtered_df['HydroPredictions'] = filtered_df['Hydro']
    filtered_df['NuclearPredictions'] = filtered_df['Nuclear']
    filtered_df['WindPredictions'] = filtered_df['Wind']
    filtered_df['SolarPredictions'] = filtered_df['Solar']
    filtered_df['RefusePredictions'] = filtered_df['Refuse']
    filtered_df['WoodPredictions'] = filtered_df['Wood']

    # Compute Total_Predicted as sum of all sources (edit as needed)
    filtered_df['Total_Predicted'] = (
        filtered_df['Coal'] + filtered_df['Hydro'] + filtered_df['Natural Gas'] +
        filtered_df['Nuclear'] + filtered_df['Oil'] + filtered_df['Other'] +
        filtered_df['Landfill Gas'] + filtered_df['Refuse'] +
        filtered_df['Solar'] + filtered_df['Wind'] + filtered_df['Wood']
    )

    # Keep only desired columns
    output_df = filtered_df[
        ['BeginDate', 'Total_Predicted', 'HydroPredictions', 'NuclearPredictions',
        'WindPredictions', 'SolarPredictions', 'RefusePredictions', 'WoodPredictions']
    ]

    # Write to new CSV
    output_df.to_csv("../realtime_iso.csv", index=False)
else:
    pass