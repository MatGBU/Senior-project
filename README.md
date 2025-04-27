# Machine Learning Powered Electrical Scheduling

## Team Members
- Avishai Lean | Electrical Engineering
- Benjamin Axline | Computer Engineering
- Mateusz Górczak | Electrical Engineering
- Konstantin Agrachev | Computer Engineering

## Current Project State
This project combines real-time energy monitoring with smart device control using Kasa SmartStrip devices.

### Active Components
1. **Backend Services**
   - FastAPI server handling device control
   - Real-time energy data fetching from ISO-NE API
   - Multiple energy source predictions (hydro, nuclear, wind, solar)

2. **Frontend Dashboard**
   - React-based interface
   - Real-time device control
   - Energy visualization charts

3. **Data Processing**
   - Automated data collection and processing
   - Multiple energy source models
   - Daily automated updates via git

### Known Limitations
1. Smart Strip connection requires stable network
2. ISO-NE API has rate limits
3. Device control requires specific IP configuration

## Critical Knowledge Transfer

### Architecture Decisions
1. **Smart Device Integration**
   - Using Kasa API for device control
   - Direct IP communication with smart strips
   - Async operations for better performance

2. **Data Processing Pipeline**
   ```python
   # Main backend flow in Working_Models/backend.py
   pullAllData(weather_csv, fuel_csv, output_csv)
   gather_combine_testing()
   hydro_main()
   landfill()
   nuclear_main()
   # ... other energy sources
   ```

### Gotchas and Lessons Learned

#### Device Control
1. **Smart Strip Connection**
   - Always update strip state before operations
   - Handle connection timeouts gracefully
   - Keep track of child device indices
   ```python
   await strip.update()
   await strip.children[input].turn_on()
   await strip.update()  # Update after operation
   ```

2. **API Authentication**
   - ISO-NE API requires specific credentials
   - Store credentials securely
   - Handle authentication errors properly

#### Data Processing
1. **Automated Updates**
   - Daily updates via `run_pull_push.sh`
   - Check for failed pulls/pushes
   - Monitor disk space for CSV storage

2. **Model Pipeline**
   - Models must run in specific order
   - Each model has specific data dependencies
   - Validate output before proceeding

### Environment Setup
1. **Dependencies**
   ```bash
   fastapi
   python-kasa
   requests
   numpy
   scipy
   ```

2. **Configuration**
   - Smart Strip IP configuration
   - ISO-NE API credentials
   - Frontend URL configuration

### Common Pitfalls
1. **Device Control**
   - Smart Strip may become unresponsive
   - Network changes can affect device connection
   - Child device indexing starts at 0

2. **Data Processing**
   - CSV files must follow specific format
   - Weather data must align with fuel data
   - Handle missing or incomplete data

### Troubleshooting Guide
1. **Smart Strip Issues**
   ```bash
   # Check device connectivity
   ping 192.168.0.133
   
   # Reset device connection
   await strip.update()
   ```

2. **Data Processing Issues**
   - Check CSV file permissions
   - Verify ISO-NE API status
   - Monitor log files for errors

### Future Improvements
1. **Planned Features**
   - Additional energy source models
   - Enhanced scheduling capabilities
   - Better error handling and recovery

2. **Technical Debt**
   - Refactor model pipeline
   - Improve error logging
   - Add comprehensive tests

## Contact and Support
- Technical Documentation: See individual model files in `Working_Models/`
- API Documentation: FastAPI automatic docs at `/docs` endpoint

## License
This project is licensed under the MIT License - see the LICENSE file for details.

