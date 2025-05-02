#!/usr/bin/env python3
import subprocess
import pandas as pd
import time
from pathlib import Path

# —————————————————————————————————————————————————————————————
# CONFIGURATION
# —————————————————————————————————————————————————————————————
# Assumes this script lives in the root of your cloned repo
REPO_DIR    = Path(__file__).resolve().parent
INPUT_CSV   = REPO_DIR / "public" / "data" / "realtime_iso.csv"
OUTPUT_DIR  = Path("/var/www/html/data")
OUTPUT_CSV  = OUTPUT_DIR / "realtime_iso.csv"
GIT_BRANCH  = "main"
PULL_REMOTE = "origin"
SLEEP_SECS  = 3600  # run once every hour
# —————————————————————————————————————————————————————————————

def clean_and_deploy():
    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Pulling latest from Git…")
    res = subprocess.run(
        ["git", "pull", PULL_REMOTE, GIT_BRANCH],
        cwd=REPO_DIR,
        capture_output=True,
        text=True
    )
    if res.returncode != 0:
        print("  ❌ Git pull failed:", res.stderr.strip())
        return
    
    # Read the raw CSV
    print("  📥 Reading", INPUT_CSV)
    df = pd.read_csv(INPUT_CSV)
    
    # Identify the timestamp column (assume it's the first one)
    ts_col = df.columns[0]
    
    # Parse, strip tz, floor to the hour, and re-format
    df[ts_col] = (
        pd.to_datetime(df[ts_col], utc=True)      # parse with UTC
          .dt.tz_convert(None)                    # drop tzinfo
          .dt.floor("H")                          # floor to hour
          .dt.strftime("%Y-%m-%d %H:%M:%S")       # format as string
    )
    
    # Ensure output directory exists
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    # Write cleaned CSV
    print("  📤 Writing cleaned file to", OUTPUT_CSV)
    df.to_csv(OUTPUT_CSV, index=False)
    print("  ✅ Done.")

if __name__ == "__main__":
    while True:
        try:
            clean_and_deploy()
        except Exception as e:
            print("⚠️ Error during run:", e)
        # wait until next hour
        time.sleep(SLEEP_SECS)
