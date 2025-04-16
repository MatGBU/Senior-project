from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from kasa import SmartStrip
from kasa import Module
from datetime import datetime, timedelta
from fastapi.middleware.cors import CORSMiddleware

import json, asyncio
import requests
import xml.etree.ElementTree as ET
import os
import subprocess
import shlex

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

# DEVICE_IP = "192.168.0.133"  # Replace with your actual device IP
# strip = SmartStrip(DEVICE_IP)
DEVICE_IP = None
strip = None

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
    global strip
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
    global strip
    print("Turning off")
    await strip.update()
    await strip.children[input].turn_off()
    await strip.update()  # Update device state after turning it off

async def schedule_device(input, start_time, end_time, start_day, end_day):
    command_add = f"kasa --host {DEVICE_IP} command --child-index {input} --module schedule add_rule "
    command_ids = []

    def get_adjusted_wday(target_day):
        """Returns a list where the target day is set to 1, and others are 0.
        Adjusts so Sunday = 0, Monday = 1, ..., Saturday = 6.
        """
        current_day = (datetime.now().weekday() + 1) % 7  # Adjusted to match Sunday = 0
        if target_day == "Today":
            target_index = current_day
        elif target_day == "Tomorrow":
            target_index = (current_day + 1) % 7
        else:
            return [0] * 7  # Default to all zeros if input is invalid

        return [1 if i == target_index else 0 for i in range(7)]

    start_wday = get_adjusted_wday(start_day)
    end_wday = get_adjusted_wday(end_day)

    schedule_rule_on = {
        "stime_opt": 0,
        "wday": start_wday,
        "smin": mil_to_min(start_time),
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
        "set_overall_enable": {"enable": 1}
    }

    schedule_rule_off = {
        "stime_opt": 0,
        "wday": end_wday,
        "smin": mil_to_min(end_time),
        "enable": 1,
        "repeat": 1,
        "etime_opt": -1,
        "name": "lights on",
        "eact": -1,
        "month": 0,
        "sact": 0,
        "year": 0,
        "longitude": 0,
        "day": 0,
        "force": 0,
        "latitude": 0,
        "set_overall_enable": {"enable": 1}
    }

    schedule_rule_on_str = json.dumps(schedule_rule_on)
    schedule_rule_off_str = json.dumps(schedule_rule_off)
    
    command_on = command_add + f"'{schedule_rule_on_str}'"
    command_off = command_add + f"'{schedule_rule_off_str}'"

    async def run_command(cmd):
        process = await asyncio.create_subprocess_shell(
            cmd, 
            stdout=asyncio.subprocess.PIPE, 
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await process.communicate()

        if process.returncode == 0:
            output = stdout.decode().strip()
            print(f"Command Output: {output}")

            # Extract JSON response containing "id"
            try:
                json_output = json.loads(output.split("\n")[-1])  # Extract last JSON line
                if "id" in json_output:
                    command_ids.append(json_output["id"])
                    return json_output["id"]
            except json.JSONDecodeError:
                print("Failed to parse JSON output.")
        else:
            print(f"Error: {stderr.decode().strip()}")

    await run_command(command_on)
    await run_command(command_off)

    end_time_obj = datetime.strptime(end_time, "%H:%M")
    delete_time_obj = end_time_obj + timedelta(minutes=1)
    delete_time_str = delete_time_obj.strftime("%H:%M") + end_day
    delete_command = f'kasa --host {DEVICE_IP} command --child-index {input} --module schedule delete_rule'

    delete_rule_str_on = json.dumps({"id": command_ids[0]})
    command_on = f"echo {shlex.quote(delete_command + ' ' + shlex.quote(delete_rule_str_on))} | at {shlex.quote(delete_time_str)}"

    delete_rule_str_off = json.dumps({"id": command_ids[1]})
    command_off = f"echo {shlex.quote(delete_command + ' ' + shlex.quote(delete_rule_str_off))} | at {shlex.quote(delete_time_str)}"

    await run_command(command_on)
    await run_command(command_off)

async def delete_schedule_device(input):
    command = f"kasa --host {DEVICE_IP} command --child-index {input} --module schedule delete_all_rules"

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
async def schedule(input: int, start_time: str, end_time: str, start_day: str, end_day: str):
    print(start_time, end_time, start_day, end_day)
    await schedule_device(input, start_time, end_time, start_day, end_day)
    return {"status": "off"}

@app.get("/delete_schedule")
async def delete_schedule(input: int):
    await delete_schedule_device(input)
    return {"status": "off"}

@app.get("/get_rt_data")
async def get_rt_data():
    data = await pull_current_data()
    return data

@app.on_event("startup")
async def startup_event():
    global strip, DEVICE_IP

    if DEVICE_IP is None:
        raise RuntimeError("DEVICE_IP not set. Please provide it via command-line argument.")

    strip = SmartStrip(DEVICE_IP)
    await strip.update()


if __name__ == "__main__":
    import uvicorn
    import argparse

    parser = argparse.ArgumentParser(description="FastAPI SmartStrip Controller")
    parser.add_argument("--device-ip", required=True, help="IP address of the Smart Strip")
    args = parser.parse_args()

    DEVICE_IP = args.device_ip

    uvicorn.run(app, host="0.0.0.0", port=5001, log_level="info")
