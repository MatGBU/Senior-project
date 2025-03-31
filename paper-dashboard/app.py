from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from kasa import SmartStrip
from kasa import Module
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware

import json, asyncio
import requests
import xml.etree.ElementTree as ET

app = FastAPI()

# Only allow the specific origin
origins = [
    "http://ecostripsolutions.com",  # Your allowed frontend domain
    "http://localhost:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Allow only this specific origin
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

DEVICE_IP = "192.168.0.133"  # Replace with your actual device IP
strip = SmartStrip(DEVICE_IP)

### Important commands

# Create a schedule rule for a plug
# sact: 0 for turn off, 1 for turn on
# smin: start minute, where 0 is 00:00
# kasa --host 192.168.0.133 command --child-index 2 --module schedule add_rule 
# '{"stime_opt":0,"wday":[1,1,1,1,1,1,1],"smin":1029,"enable":1,"repeat":1,"etime_opt":-1,"name":"lights on","eact":-1,"month":0,"sact":1,"year":0,"longitude":0,"day":0,"force":0,"latitude":0,"emin":0,"set_overall_enable":{"enable":1}}'

# Get the rules for the plug
# kasa --host 192.168.0.133 command --child-index 2 --module schedule get_rules

# Delete all rules for the plug
# kasa --host 192.168.0.133 command --child-index 2 --module schedule delete_all_rules

# Convert 24-hour clock time to absolute minute
def mil_to_min(time_str):
    time_obj = datetime.strptime(time_str, "%H:%M")
    
    minutes_since_midnight = time_obj.hour * 60 + time_obj.minute
    return minutes_since_midnight

# Function to turn on the device
async def turn_on_device(input):
    print("Turning on")
    await strip.update()
    await strip.children[input].turn_on()
    # strip.children[input].modules['schedule'].data['get_rules']['rule_list']
    # print(strip.children[input].modules)
    # print("\n")
    # print(strip.children[input].modules['schedule'])
    # print(strip.modules)
    await strip.update()  # Update device state after turning it on

# Function to turn off the device
async def turn_off_device(input):
    print("Turning off")
    await strip.update()
    await strip.children[input].turn_off()
    await strip.update()  # Update device state after turning it off

async def schedule_device(input):
    command = f"kasa --host 192.168.0.133 command --child-index {input} --module schedule add_rule "
    
    schedule_rule = {
        "stime_opt": 0,
        "wday": [1, 1, 1, 1, 1, 1, 1],
        "smin": mil_to_min("12:24"),
        "enable": 1,
        "repeat": 1,
        "etime_opt": -1,
        "name": "lights on",
        "eact": -1,
        "month": 0,
        "sact": 1,
        "year": 0,
        "longitude": 0,
        "day": 0,
        "force": 0,
        "latitude": 0,
        "emin": 0,
        "set_overall_enable": {"enable": 1}
    }

    schedule_rule_str = json.dumps(schedule_rule)
    
    command += f"'{schedule_rule_str}'"

    process = await asyncio.create_subprocess_shell(
        command, 
        stdout=asyncio.subprocess.PIPE, 
        stderr=asyncio.subprocess.PIPE
    )

    stdout, stderr = await process.communicate()

    if process.returncode == 0:
        print(f"Command Output: {stdout.decode()}")
    else:
        print(f"Error: {stderr.decode()}")

async def delete_schedule_device(input):
    command = f"kasa --host 192.168.0.133 command --child-index {input} --module schedule delete_all_rules"

    process = await asyncio.create_subprocess_shell(
        command, 
        stdout=asyncio.subprocess.PIPE, 
        stderr=asyncio.subprocess.PIPE
    )

    stdout, stderr = await process.communicate()

    if process.returncode == 0:
        print(f"Command Output: {stdout.decode()}")
    else:
        print(f"Error: {stderr.decode()}")

async def pull_current_data():
    URL = "https://webservices.iso-ne.com/api/v1.1/genfuelmix/current"
    USERNAME = 'alean@bu.edu'
    PASSWORD = 'Mq75eg8pxTBCEKY'

    FUEL_CATEGORIES = [
        'Coal', 'Hydro', 'Natural Gas', 'Nuclear', 'Oil', 'Other', 
        'Landfill Gas', 'Refuse', 'Solar', 'Wind', 'Wood'
    ]

    async def fetch_fuelmix_data():
        response = requests.get(URL, auth=(USERNAME, PASSWORD))
        return response.content if response.status_code == 200 else None

    async def parse_fuelmix_data(xml_data):
        root = ET.fromstring(xml_data)
        namespace = {'ns': 'http://WEBSERV.iso-ne.com'}
        data = {}

        for entry in root.findall('ns:GenFuelMix', namespace):
            timestamp = entry.find('ns:BeginDate', namespace).text.replace('T', ' ')
            timestamp = datetime.strptime(timestamp, '%Y-%m-%d %H:%M:%S.%f%z').strftime('%Y-%m-%d %H:%M:%S')
            fuel_type = entry.find('ns:FuelCategory', namespace).text
            gen_mw = float(entry.find('ns:GenMw', namespace).text)

            if timestamp not in data:
                data[timestamp] = {category: 0.0 for category in FUEL_CATEGORIES}
            
            if fuel_type in data[timestamp]:
                data[timestamp][fuel_type] += gen_mw
        
        return data

    xml_data = await fetch_fuelmix_data()
    if xml_data:
        fuel_data = await parse_fuelmix_data(xml_data)
        return fuel_data
        # Print formatted output
        # for timestamp, values in fuel_data.items():
            # print(f"{timestamp}: {values}")
    else:
        print("Failed to fetch data.")

@app.get("/")
async def root():
    return {"status": "valid"}

@app.get("/turn_on")
async def turn_on(input: int):
    await turn_on_device(input)
    return {"status": "on"}

@app.get("/turn_off")
async def turn_off(input: int):
    await turn_off_device(input)
    return {"status": "off"}

@app.get("/schedule")
async def schedule(input: int):
    await schedule_device(input)
    return {"status": "off"}

@app.get("/delete_schedule")
async def delete_schedule(input: int):
    await delete_schedule_device(input)
    return {"status": "off"}

@app.get("/get_rt_data")
async def get_rt_data():
    data = await pull_current_data()
    return data


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001, log_level="info")
