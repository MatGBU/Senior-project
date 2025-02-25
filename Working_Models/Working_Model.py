import tensorflow as tf
from tensorflow.keras.models import load_model
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from bisect import bisect_left 
from pathlib import Path
from datetime import timedelta
from sklearn.preprocessing import StandardScaler

def working_model():
    print('Hello')
    base_dir = Path.home() / 'Documents' / 'Senior-project' / 'Working_Models'
    windmodel = load_model(base_dir / 'WindModel.h5')
    nuclearmodel = load_model(base_dir / 'NuclearModel.h5')
    hydromodel = load_model(base_dir / 'HydroModel.h5')
    solarmodel = load_model(base_dir / 'SolarModel.h5')
    refusemodel = load_model(base_dir / 'RefuseModel.h5')
    woodmodel = load_model(base_dir / 'WoodModel.h5')
    #Loading and proccesing Test Data 
    testdata = pd.read_csv('./testing.csv')
    testdata['BeginDate'] = pd.to_datetime(testdata['BeginDate'])
    testdata['BeginDate'] = testdata['BeginDate'] - timedelta(hours=5)
    trainingdata = pd.read_csv('./AutoCombine.csv')
    testdata['Sum'] = testdata['LoadMw']
    testdata['BeginDate'] = pd.to_datetime(testdata['BeginDate']).dt.tz_localize(None)
    testdata['Previous_Day'] = testdata['BeginDate'] - pd.Timedelta(days=1)
    testdata['Previous_2Day'] = testdata['BeginDate'] - pd.Timedelta(days=2)
    testdata['Previous_Year'] = testdata['BeginDate'] - pd.DateOffset(years=1)
    data2find = testdata[['Previous_Day','Previous_Year','Previous_2Day']].copy()
    # Load your data (assuming trainingdata has 'BeginDate', 'Solar', 'Wind', 'Hydro', 'Nuclear' columns)
    trainingdata['BeginDate'] = pd.to_datetime(trainingdata['BeginDate']).dt.tz_localize(None)

    # Sort trainingdata by BeginDate to allow for efficient nearest date search
    trainingdata = trainingdata.sort_values('BeginDate').reset_index(drop=True)

    # Initialize an empty list to store results
    results = []

    # Define a function to find the closest date
    def find_nearest_date(date, df):
        """Find the nearest date in the DataFrame for a given date."""
        diffs = (df['BeginDate'] - date).abs()
        nearest_idx = diffs.idxmin()
        return df.loc[nearest_idx]

    # Iterate over each row in data2find
    for idx, row in data2find.iterrows():
        row_result = {}
        
        # For each renewable type and each previous date, find the nearest date's output
        for energy_type in ['Solar', 'Wind', 'Hydro', 'Nuclear','Wood','Refuse']:
            # Get the nearest data for Previous_Day, Previous_2Day, and Previous_Year
            previous_day_data = find_nearest_date(row['Previous_Day'], trainingdata)
            previous_2day_data = find_nearest_date(row['Previous_2Day'], trainingdata)
            previous_year_data = find_nearest_date(row['Previous_Year'], trainingdata)
            
            # Store the values for each energy type
            row_result[f'Previous_Day_{energy_type}'] = previous_day_data[energy_type]
            row_result[f'Previous_2Day_{energy_type}'] = previous_2day_data[energy_type]
            row_result[f'Previous_Year_{energy_type}'] = previous_year_data[energy_type]
        
        # Append the result to the results list
        results.append(row_result)

    # Convert the list of dictionaries to a DataFrame
    results_df = pd.DataFrame(results)
    # Assuming testdata and results_df have the same number of rows
    combined_data = pd.concat([testdata.reset_index(drop=True), results_df.reset_index(drop=True)], axis=1)

    # Display the combined DataFrame
    print(combined_data.head())

    combined_data['Hour_of_Day'] = combined_data['BeginDate'].dt.hour
    combined_data['Minute'] = combined_data['BeginDate'].dt.minute
    combined_data['Month'] = combined_data['BeginDate'].dt.month
    combined_data['Year'] = combined_data['BeginDate'].dt.year
    combined_data['Day'] = combined_data['BeginDate'].dt.day
    combined_data['WindSpeedCubed'] = combined_data['windspeed'] ** 3
    inputdatahydro = combined_data[['Month','Previous_Day_Hydro','Previous_2Day_Hydro','Sum','Hour_of_Day','Previous_Year_Hydro','solarradiation','Year','precip','humidity','temp','dew','snow','snowdepth','windspeed','sealevelpressure','cloudcover','severerisk']]
    inputdatanuclear = combined_data[['Month','Day','Previous_2Day_Nuclear','Sum','Hour_of_Day']]
    inputdatawind = combined_data[['WindSpeedCubed','Month','Year','Previous_Year_Wind','Previous_2Day_Wind','Sum','snowdepth','temp','solarenergy','sealevelpressure', 'humidity','solarenergy','snow', 'precip', 'uvindex', 'cloudcover', 'Previous_Day_Wind','Hour_of_Day','dew','windgust','windspeed','winddir']]
    inputdatasolar = combined_data[['Month','Year','Previous_Year_Solar','Previous_2Day_Solar','temp', 'humidity', 'precip', 'uvindex', 'cloudcover', 'solarradiation','Previous_Day_Solar','solarenergy','Hour_of_Day','dew','dew','snow','snowdepth','windspeed','windgust']]
    inputdatawood = combined_data[['Previous_Day_Wood','Month','Previous_2Day_Wood','Sum','Hour_of_Day','Previous_Year_Wood','solarradiation','Year','precip','humidity','temp','dew','snow','snowdepth','windspeed','sealevelpressure','cloudcover','severerisk']]
    inputdatarefuse = combined_data[['Previous_Day_Wood','Month','Previous_2Day_Wood','Sum','Hour_of_Day','Previous_Year_Wood','solarradiation','Year','precip','humidity','temp','dew','snow','snowdepth','windspeed','sealevelpressure','cloudcover','severerisk']]
    scalar = StandardScaler()
    inputdatahydro = scalar.fit_transform(inputdatahydro)
    inputdatanuclear = scalar.fit_transform(inputdatanuclear)
    inputdatawind = scalar.fit_transform(inputdatawind)
    inputdatasolar = scalar.fit_transform(inputdatasolar)
    inputdatawood = scalar.fit_transform(inputdatawood)
    inputdatarefuse = scalar.fit_transform(inputdatarefuse)

    hydropredictions = hydromodel.predict(inputdatahydro)
    hydropredictions[hydropredictions < 0] = 0
    nuclearpredictions = nuclearmodel.predict(inputdatanuclear)
    nuclearpredictions[nuclearpredictions < 0] = 0
    windpredictions = windmodel.predict(inputdatawind)
    windpredictions[windpredictions < 0] = 0
    solarpredictions = solarmodel.predict(inputdatasolar)
    solarpredictions[solarpredictions < 0] = 0
    refusepredictions = refusemodel.predict(inputdatarefuse)
    refusepredictions[refusepredictions < 0] = 0
    woodpredictions = woodmodel.predict(inputdatawood)
    woodpredictions[woodpredictions < 0] = 0

    #Write to csv 
    # Ensure each prediction variable is a 1D array
    hydropredictions = pd.Series(np.array(hydropredictions).ravel())
    nuclearpredictions = pd.Series(np.array(nuclearpredictions).ravel())
    windpredictions = pd.Series(np.array(windpredictions).ravel())
    solarpredictions = pd.Series(np.array(solarpredictions).ravel())
    refusepredictions = pd.Series(np.array(refusepredictions).ravel())
    woodpredictions = pd.Series(np.array(woodpredictions).ravel())
    
    # Create the DataFrame with BeginDate and all predictions
    output_df = pd.DataFrame({
        'BeginDate': testdata['BeginDate'] - pd.timedelta(hours = 5),
        'HydroPredictions': hydropredictions,
        'NuclearPredictions': nuclearpredictions,
        'WindPredictions': windpredictions,
        'SolarPredictions': solarpredictions,
        'RefusePredictions': refusepredictions,
        'WoodPredictions': woodpredictions
    })

    # Write the DataFrame to a CSV file
    today_date = datetime.now().strftime('%Y-%m-%d')
    filename = f'energy_predictions_{today_date}.csv'
    # Save DataFrame to CSV
    output_df.to_csv(filename, index=False)

working_model()