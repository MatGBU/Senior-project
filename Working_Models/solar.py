import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import tensorflow as tf
from bisect import bisect_left
from tensorflow.keras import regularizers
from tensorflow.keras.layers import LeakyReLU, Dropout, BatchNormalization
import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error
from tensorflow.keras.callbacks import EarlyStopping
from tensorflow.keras.callbacks import ReduceLROnPlateau

import datetime

now = datetime.datetime.now()
def solar_main():

    data = pd.read_csv('../AutoCombine.csv')     # updated
    data = data.fillna(0)
    data['BeginDate'] = pd.to_datetime(data['BeginDate']).dt.tz_localize(None)

    # Find the latest date in the dataset
    latest_date = data['BeginDate'].max()

    # Get the month from the latest date
    latest_month = latest_date.month

    # Determine the season of the latest date
    if latest_month in (12, 1, 2):
        season_months = [12, 1, 2]  # Winter
    elif latest_month in (3, 4, 5):
        season_months = [3, 4, 5]  # Spring
    elif latest_month in (6, 7, 8):
        season_months = [6, 7, 8]  # Summer
    else:
        season_months = [9, 10, 11]  # Fall

    # Filter the data to only include months from the same season as the latest date
    data = data[data['BeginDate'].dt.month.isin(season_months)]
    data["Sum"] = data[["Coal", "Hydro", "Natural Gas", "Nuclear", "Oil", "Other", "Landfill Gas", "Refuse", "Solar", "Wind", "Wood"]].sum(axis=1)
    data['Previous_Day'] = data['BeginDate'] - pd.Timedelta(days=1)
    data['Previous_Year'] = data['BeginDate'] - pd.DateOffset(years=1)

    # Calculate the average of 'Sum' for the latest month
    # Filter the data to include only the rows from the latest month
    latest_month_data = data[data['BeginDate'].dt.month == latest_month]

    # Calculate the average of the 'Sum' column for the latest month
    average_sum_latest_month = latest_month_data['Sum'].mean()
    print(f"The average sum for the latest month ({latest_date.strftime('%Y-%m')}) is: {average_sum_latest_month}")

    monthly_avg_sum = data.groupby(data['BeginDate'].dt.to_period("M"))['Sum'].mean()
    # Display the average sum for each month
    print(monthly_avg_sum)

    latest_date = data['BeginDate'].max()
    latest_month_period = latest_date.to_period("M")

    # Get the average sum for the latest month
    latest_month_avg_sum = monthly_avg_sum[latest_month_period]

    # Calculate the scaling factor for each month
    scaling_factors = latest_month_avg_sum / monthly_avg_sum

    # Map the scaling factors back to the original dates in the dataframe
    data['ScalingFactor'] = data['BeginDate'].dt.to_period("M").map(scaling_factors)

    # Apply the scaling factors to each 'Sum' entry
    data['AdjustedSum'] = data['Sum'] * data['ScalingFactor']
    data['AdjustedSolar'] = data['Solar'] * data['ScalingFactor']

    solar_data = data[['BeginDate', 'AdjustedSolar','Previous_Day','Previous_Year']].copy()
    # Large computation 
    data['Previous_Year_Solar'] = data.apply(get_previous_year_Solar, axis=1, reference_df=solar_data)

    #cutoff_date = pd.to_datetime("2021-10-01").tz_localize(None)
    cutoff_date = now - datetime.timedelta(days=30)
    usable_data = data[data['BeginDate'] > cutoff_date].copy()
    solar_data2 = usable_data[['BeginDate', 'Solar','Previous_Day','Previous_Year']].copy()

    usable_data['Previous_Day_Solar'] = usable_data.apply(get_previous_day_Solar, axis=1, reference_df=solar_data)
    usable_data['Previous_2Day_Solar'] = usable_data.apply(get_two_days_before_Solar, axis=1, reference_df=solar_data)

    usable_data['Hour_of_Day'] = usable_data['BeginDate'].dt.hour
    usable_data['Month'] = usable_data['BeginDate'].dt.month
    usable_data['Year'] = usable_data['BeginDate'].dt.year
    features = usable_data[['Month','Year','Previous_Year_Solar','Previous_2Day_Solar','temp', 'humidity', 'precip', 'uvindex', 'cloudcover', 'solarradiation','Previous_Day_Solar','solarenergy','Hour_of_Day','dew','dew','snow','snowdepth','windspeed','windgust']]

    # Useless Features , 'winddir',,
    target = usable_data['Solar']

    print("Features shape: ", features.shape)
    print('Target shape: ', target.shape)

    X_train, X_test, y_train, y_test = train_test_split(features, target, test_size=0.2, random_state=42)

    scalar = StandardScaler()
    X_train = scalar.fit_transform(X_train)
    X_test = scalar.transform(X_test)
    early_stopping = EarlyStopping(monitor='val_loss', patience=250, restore_best_weights=True)
    lr_scheduler = ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=150, min_lr=1e-6)
    model = tf.keras.models.Sequential([
        tf.keras.layers.Dense(512, kernel_regularizer=regularizers.l2(0.001),
                              input_shape=(X_train.shape[1],)),
        LeakyReLU(alpha=0.1),
        BatchNormalization(),
        tf.keras.layers.Dense(256,
                              kernel_regularizer=regularizers.l2(0.001)),
        LeakyReLU(alpha=0.10),
        BatchNormalization(),
        tf.keras.layers.Dense(128,
                              kernel_regularizer=regularizers.l2(0.001)),
        LeakyReLU(alpha=0.10),
        tf.keras.layers.Dense(128,
                              kernel_regularizer=regularizers.l2(0.001)),
        LeakyReLU(alpha=0.10),
        BatchNormalization(),
        Dropout(0.4),
        tf.keras.layers.Dense(64,
                              kernel_regularizer=regularizers.l2(0.001)),
        LeakyReLU(alpha=0.10),
        tf.keras.layers.Dense(32,
                              kernel_regularizer=regularizers.l2(0.001)),
        LeakyReLU(alpha=0.10),
        BatchNormalization(),
        Dropout(0.3),
        tf.keras.layers.Dense(1)
    ])


    model.compile(optimizer='adam', loss='mean_absolute_error')

    history = model.fit(X_train, y_train, epochs=15000, validation_split=0.2, batch_size=128, callbacks=[early_stopping, lr_scheduler])

    test_loss = model.evaluate(X_test, y_test)

    predictions = model.predict(X_test)
    predictions[predictions < 0] = 0
    flattened_predictions = [0 if (isinstance(pred, np.ndarray) and pred.item() < 0) else (0 if pred < 0 else pred.item() if isinstance(pred, np.ndarray) else pred) for pred in predictions]
    mae = mean_absolute_error(y_test, predictions)
    # Calculate Mean Squared Error (MSE)
    mse = mean_squared_error(y_test, predictions)

    # Calculate Root Mean Squared Error (RMSE)
    rmse = np.sqrt(mse)
    average_y_test = np.mean(y_test)
    percent_error = mae / average_y_test
    with open('Solar_generation_errors.txt', 'a') as file:
        file.write('====================================================================================\n')
        file.write(f'{now.strftime("%Y-%m-%d %H:%M:%S")} - Test Loss: {test_loss}\n')
        file.write(f'{now.strftime("%Y-%m-%d %H:%M:%S")} - Mean Absolute Error (MAE): {mae}\n')
        file.write(f'{now.strftime("%Y-%m-%d %H:%M:%S")} - Mean Squared Error (MSE): {mse}\n')
        file.write(f'{now.strftime("%Y-%m-%d %H:%M:%S")} - Root Mean Squared Error (RMSE): {rmse}\n')
        file.write(f'{now.strftime("%Y-%m-%d %H:%M:%S")} - Percent Error (PERR): {percent_error}\n')
        file.write('====================================================================================\n')

    model.save('SolarModel.h5')

def get_previous_day_Solar(row, reference_df):
    # Sort reference_df by 'BeginDate' for fast lookups
    sorted_dates = reference_df['BeginDate'].values
    solar_values = reference_df['AdjustedSolar'].values
    
    # Perform binary search to find the index of the closest date
    target_date = row['Previous_Day']
    pos = bisect_left(sorted_dates, target_date)
    
    # Find the closest date and return corresponding Solar value
    if pos == 0:
        return solar_values[0]
    if pos == len(sorted_dates):
        return solar_values[-1]
    
    before = sorted_dates[pos - 1]
    after = sorted_dates[pos]
    
    # Return the Solar value corresponding to the closest date
    if abs(target_date - before) <= abs(target_date - after):
        return solar_values[pos - 1]
    else:
        return solar_values[pos]

def get_two_days_before_Solar(row, reference_df):
    # Sort reference_df by 'BeginDate' for fast lookups
    sorted_dates = reference_df['BeginDate'].values
    solar_values = reference_df['AdjustedSolar'].values
    
    # Calculate two days before
    target_date = row['BeginDate'] - pd.Timedelta(days=2)
    
    # Perform binary search to find the index of the closest date
    pos = bisect_left(sorted_dates, target_date)
    
    # Find the closest date and return corresponding Solar value
    if pos == 0:
        return solar_values[0]
    if pos == len(sorted_dates):
        return solar_values[-1]
    
    before = sorted_dates[pos - 1]
    after = sorted_dates[pos]
    
    # Return the Solar value corresponding to the closest date
    if abs(target_date - before) <= abs(target_date - after):
        return solar_values[pos - 1]
    else:
        return solar_values[pos]

def get_previous_year_Solar(row, reference_df):
    # Sort reference_df by 'BeginDate' for fast lookups
    sorted_dates = reference_df['BeginDate'].values
    solar_values = reference_df['AdjustedSolar'].values
    
    # Perform binary search to find the index of the closest date
    target_date = row['Previous_Year']
    pos = bisect_left(sorted_dates, target_date)
    
    # Find the closest date and return corresponding Solar value
    if pos == 0:
        return solar_values[0]
    if pos == len(sorted_dates):
        return solar_values[-1]
    
    before = sorted_dates[pos - 1]
    after = sorted_dates[pos]
    
    # Return the Solar value corresponding to the closest date
    if abs(target_date - before) <= abs(target_date - after):
        return solar_values[pos - 1]
    else:
        return solar_values[pos]
