import pandas as pd
import tensorflow as tf
import datetime
import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from bisect import bisect_left
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
from tensorflow.keras import regularizers
from tensorflow.keras.layers import LeakyReLU, Dropout, BatchNormalization

now = datetime.datetime.now()
def wood_main():
    data = pd.read_csv('AutoCombine.csv')
    data = data.fillna(0)
    data['BeginDate'] = pd.to_datetime(data['BeginDate']).dt.tz_localize(None)
    data["Sum"] = data[["Coal", "Hydro", "Natural Gas", "Nuclear", "Oil", "Other", "Landfill Gas", "Refuse", "Solar", "Wind", "Wood"]].sum(axis=1)
    data['Previous_Day'] = data['BeginDate'] - pd.Timedelta(days=1)
    data['Previous_2Day'] = data['BeginDate'] - pd.Timedelta(days=2)
    data['Previous_Year'] = data['BeginDate'] - pd.DateOffset(years=1)
    wind_data = data[['BeginDate', 'Wood','Previous_Day','Previous_Year','Previous_2Day']].copy()

    data['Previous_Year_Wood'] = data.apply(get_previous_year_Wind, axis=1, reference_df=wind_data)

    cutoff_date = now - datetime.timedelta(days=30)
    usable_data = data[data['BeginDate'] > cutoff_date].copy()
    solar_data2 = usable_data[['BeginDate', 'Wood','Previous_Day','Previous_2Day','Previous_Year']].copy()

    usable_data['Previous_Day_Wood'] = usable_data.apply(get_previous_day_Wind, axis=1, reference_df=solar_data2)
    usable_data['Previous_2Day_Wood'] = usable_data.apply(get_two_days_before_Wind, axis=1, reference_df=solar_data2)

    usable_data['Hour_of_Day'] = usable_data['BeginDate'].dt.hour
    usable_data['Year'] = usable_data['BeginDate'].dt.year
    usable_data['Month'] = usable_data['BeginDate'].dt.month
    features = usable_data[['Previous_Day_Wood','Month','Previous_2Day_Wood','Sum','Hour_of_Day','Previous_Year_Wood','solarradiation','Year','precip','humidity','temp','dew','snow','snowdepth','windspeed','sealevelpressure','cloudcover','severerisk']]


    # Useless Features , , 
    target = usable_data['Wood']

    print("Features shape: ", features.shape)
    print('Target shape: ', target.shape)

    X_train, X_test, y_train, y_test = train_test_split(features, target, test_size=0.2, random_state=42)

    scalar = StandardScaler()
    X_train = scalar.fit_transform(X_train)
    X_test = scalar.transform(X_test)
    early_stopping = EarlyStopping(monitor='val_loss',
                               patience=70,
                               restore_best_weights=True)

    lr_scheduler = ReduceLROnPlateau(monitor='val_loss',
                                    facotr=0.5,
                                    patience=10, 
                                    min_le=1e-6)
    model = tf.keras.models.Sequential([
        tf.keras.layers.Dense(128, kernel_regularizer=regularizers.l2(0.001), input_shape=(X_train.shape[1],)),
        LeakyReLU(alpha=0.1),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.Dense(128, kernel_regularizer=regularizers.l2(0.001), input_shape=(X_train.shape[1],)),
        LeakyReLU(alpha=0.1),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.Dense(64, kernel_regularizer=regularizers.l2(0.01)),
        LeakyReLU(alpha=0.1),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.Dense(32, kernel_regularizer=regularizers.l2(0.001)),
        tf.keras.layers.Dropout(0.5),
        LeakyReLU(alpha=0.1),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.Dense(1)
    ])

    model.compile(optimizer='adam', loss='mean_absolute_error')

    history = model.fit(X_train, y_train, epochs=255, validation_split=0.15, batch_size=128, callbacks=[early_stopping, lr_scheduler])

    test_loss = model.evaluate(X_test, y_test)
    predictions = model.predict(X_test)
    predictions[predictions < 0] = 0

    # calculate errors
    mae = mean_absolute_error(y_test, predictions)
    mse = mean_squared_error(y_test, predictions)
    rmse = np.sqrt(mse)
    average_y_test = np.mean(y_test)
    percent_error = mae / average_y_test
    
    # write to file (log)
    with open('Working_Models/Wood_generation_errors.txt', 'a') as file:
        file.write('====================================================================================\n')
        file.write(f'{now.strftime("%Y-%m-%d %H:%M:%S")} - Test Loss: {test_loss}\n')
        file.write(f'{now.strftime("%Y-%m-%d %H:%M:%S")} - Mean Absolute Error (MAE): {mae}\n')
        file.write(f'{now.strftime("%Y-%m-%d %H:%M:%S")} - Mean Squared Error (MSE): {mse}\n')
        file.write(f'{now.strftime("%Y-%m-%d %H:%M:%S")} - Root Mean Squared Error (RMSE): {rmse}\n')
        file.write(f'{now.strftime("%Y-%m-%d %H:%M:%S")} - Percent Error (PERR): {percent_error}\n')
        file.write('====================================================================================\n')

    model.save('Working_Models/WoodModel.h5')


def get_previous_day_Wind(row, reference_df):
    # Sort reference_df by 'BeginDate' for fast lookups
    sorted_dates = reference_df['BeginDate'].values
    solar_values = reference_df['Wood'].values
    
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
    

def get_two_days_before_Wind(row, reference_df):
    # Sort reference_df by 'BeginDate' for fast lookups
    sorted_dates = reference_df['BeginDate'].values
    solar_values = reference_df['Wood'].values
    
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


def get_previous_year_Wind(row, reference_df):
    # Sort reference_df by 'BeginDate' for fast lookups
    sorted_dates = reference_df['BeginDate'].values
    solar_values = reference_df['Wood'].values
    
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
