# Oven Log Web Application Requirements

## Overview
Build a modern web application to replace the MS Access-based Oven Log system using .NET and SQL Server.

## Core Functionality

### 1. TRAK Management
- Enter/scan TRAK IDs (barcode support)
- Display TRAK details (part number, serial number, work order info)
- Select multiple TRAKs for batch operations
- View TRAK history (all oven events for a TRAK)
- Validate TRAKs are active work orders and not already in ovens

### 2. Oven Management
- List all ovens with details (type, manufacturer, model, tool number, location, temperature, warm-up time)
- Select oven for TRAK placement
- Track oven warm-up times (for ovens without digital displays)
- Log oven turn-on events
- Prevent adding TRAKs to ovens during warm-up period
- User-specific oven visibility (users can only see/use their assigned ovens)

### 3. Baking Process
- Add TRAKs to ovens with:
  - Temperature (with defaults)
  - Start time (default to current time)
  - Bake time (with defaults based on application)
  - Application selection (optional)
  - Quantity
  - Notes (optional)
- Display all TRAKs currently in ovens with:
  - Oven and location
  - Part number and serial number
  - Quantity
  - Temperature
  - User badge who added it
  - Oven-in date/time
  - Application
  - Time remaining (hours and minutes)
  - Notes
- Remove TRAKs from ovens
- Warn if removing TRAKs prematurely (time remaining)
- Calculate and display remaining bake time
- Refresh time remaining display

### 4. Applications
- Maintain list of applications
- Each application has a default bake time
- Applications are optional when adding TRAKs

### 5. User Management
- Track users by Windows login/badge number
- User aliases support (for login mismatches with email)
- Associate users with specific ovens
- Track which user added each TRAK to oven

### 6. Barcode Support
- Support barcode scanning for:
  - TRAK IDs
  - Oven selection
  - Application selection
  - Bake times
  - Actions (Add, Remove, Reset, Oven On)
- Barcode mode: automatically route scanned input to correct field
- Manual mode: standard form input
- Generate customized barcode sheets for printing

### 7. Data Management & Reporting
- View entire database (all oven events)
- Recent activity (past 24 hours)
- TRAKs currently in ovens
- History for specific TRAKs
- Standard bake times maintenance

### 8. Administrative Tools
- Manage manufacturers and models
- Manage oven types (oven, freezer, refrigerator, etc.)
- Manage locations
- Manage ovens/dryboxes
- Manage users and aliases
- Manage applications and default times
- Manage standard bake times
- Generate test TRAK barcodes

## Database Schema

### Tables Required:

1. **Part** - Part information (populated from external system or manual entry)
   - Part number
   - Description
   - Other part details

2. **TRAK** - TRAK/work order information
   - TRAK ID (primary key)
   - Part reference
   - Serial number
   - Work order info
   - Quantity
   - Status (active/inactive)

3. **Box** - Ovens, freezers, solder pots, refrigerators, etc.
   - Box ID
   - Type (oven, freezer, etc.)
   - Manufacturer
   - Model
   - Tool number
   - Location
   - Default temperature
   - Warm-up time (if applicable)

4. **Event** - Oven-in and oven-out events
   - Event ID
   - TRAK ID
   - Box ID
   - User ID (who added it)
   - Application ID
   - Temperature
   - Quantity
   - Oven-in date/time
   - Oven-out date/time
   - Planned bake time
   - Actual bake time
   - Notes

5. **On** - Turn-on events for ovens without digital displays
   - Event ID
   - Box ID
   - Turn-on date/time

6. **User** - User information
   - User ID
   - Login/badge number
   - Email
   - Name
   - Assigned box (for dedicated stations)

7. **Alias** - User login aliases
   - Alias ID
   - User ID
   - Alias login name

8. **Application** - Baking applications
   - Application ID
   - Name
   - Default bake time

9. **Type** - Box types
   - Type ID
   - Name (oven, freezer, refrigerator, etc.)

10. **Manufacturer** - Equipment manufacturers
    - Manufacturer ID
    - Name

11. **Model** - Equipment models
    - Model ID
    - Manufacturer ID
    - Name

12. **Location** - Physical locations
    - Location ID
    - Name

13. **StandardTime** - Standard bake times for barcode generation
    - Time ID
    - Time value
    - Description

14. **UserOven** - Association between users and ovens they can access
    - User ID
    - Box ID

## Technical Requirements

### Backend (.NET)
- Use latest .NET (ASP.NET Core)
- RESTful API design
- SQL Server database
- Entity Framework Core for ORM
- Authentication/authorization
- Real-time time remaining calculations

### Frontend
- Modern responsive web UI
- Support for barcode scanner input
- Real-time updates for time remaining
- Intuitive interface for both barcode and manual modes
- Print support for barcode sheets

### Key Features to Implement
1. Barcode mode with automatic field routing
2. Batch operations (multiple TRAKs at once)
3. Time remaining calculations and display
4. Oven warm-up tracking and validation
5. User-specific oven filtering
6. Complete CRUD operations for all administrative tables
7. History and reporting views
8. Barcode sheet generation
