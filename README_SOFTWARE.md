# Machine Learning Powered Electrical Scheduling

## Software Report

### `Ml` Directory
Inside the `Ml` directory, we have multiple other directories which represent the seven different energy sources as well as one that is purely for data. These directories mainly contain python notebooks for the R&D of our models.
- Hydroelectric
- Landfill
- Nuclear
- Refuse
- Solar
- Wind
- Wood
- getData

### `Old` Directory
This contains many of our old CSV files that are outdated and are not needed.

### `paper-dashboard` Directory
This directory contains all the frontend files and code that we need for our frontend website. 

### `Prototype` Directory
This contains the two phython notebooks that we used for the two prototypes throughout the year. It also contains any CSV files that are used for the prototypes. 

### `Working_Models` Directory
THis directory contains our final models saves in `.h5` format. It also contains python scripts that will be able to called to format the data needed, train the models, and save the models for future use. We also have text files for each source to document the errors as we train each model. We also have a python script that pull this all together to gather the data, train the models, and save them. 

### Root Directory
The rest of repository contains our energy predictions that we save every 24 hours. 
`requirements.txt` contains all the required dependencies that much be isntalled.

We also have a shell script that automatically does all this every day. Every 24 hours, the system pulls the needed data, trains each model, and publishes the results to its CSV. It then sleeps for 24 hours. 


