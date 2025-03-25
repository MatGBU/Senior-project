from createTesting import gather_combine_testing 
from pullAllData import pullAllData
from hydro_ann import hydro_main 
from landfill import landfill 
from nuclear import nuclear_main 
from refuse import Refuse_main 
from solar import solar_main
from wind import wind_main 
from wood import wood_main 
from Working_Model import working_model

weather_csv = '../Year_weather.csv'
fuel_csv = '../genfuelmix_aggregatedyear.csv'
output_csv = '../AutoCombine.csv'
def total_backend(): 
    pullAllData(weather_csv, fuel_csv, output_csv)
    gather_combine_testing()
    # hydro_main() 
    # landfill() 
    # nuclear_main() 
    # Refuse_main() 
    # solar_main() 
    # wind_main()
    # wood_main() 
    working_model()


total_backend()