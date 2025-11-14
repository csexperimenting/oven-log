# Oven Log Requirements - Gap Analysis

## Summary
This document tracks all requirements from the "Oven Log User Guide.pdf" and maps them to implementation status.

## Critical Gaps (Must Have)

### 1. ❌ Persistent SQL Database
**PDF Requirement:** "Everyone must use the central version of the database. Do not make local copies."
**User Requirement:** "Use the latest .NET as well as SQL for the database"
**Current State:** In-memory database only - data lost on restart
**Gap:** Need to implement SQL Server/SQLite with EF Core migrations
**Priority:** CRITICAL - This is a fundamental requirement

### 2. ❌ TRAK List with Multi-Select and Batch Operations
**PDF Requirement:** "Multiple TRAKs can be selected in the TRAK list for addition to an oven. In this batch mode, all TRAKs are assigned the same oven, temperature, start time, bake time, application, quantity, and note."
**Current State:** Only single TRAK add supported
**Gap:** Need left-side TRAK list, multi-select capability, Check button (select all), batch add operation
**Priority:** HIGH - Core workflow feature

### 3. ❌ History View
**PDF Requirement:** "With a TRAK or TRAKs selected in the TRAK list and/or oven list, clicking History will display all information about those TRAK's oven events."
**Current State:** No history view implemented
**Gap:** Need History button and modal/page to show all events for selected TRAK(s)
**Priority:** HIGH - Important for undo/audit trail

### 4. ❌ Remove Confirmation
**PDF Requirement:** "If there is time remaining on the bake, the user is asked if they're sure they want to remove the TRAK(s) prematurely from the oven list."
**Current State:** No confirmation dialog
**Gap:** Need confirmation dialog when removing TRAK with time remaining
**Priority:** HIGH - Prevents accidental removal

### 5. ❌ Oven On Button and Warm-Up Enforcement
**PDF Requirement:** "With an oven selected in the oven drop-down menu, the Oven On button logs the time displayed in the Start Time field as an oven turn-on event for the selected oven... Oven Log will not allow a TRAK to be added to an oven undergoing the warm-up process."
**Current State:** No Oven On button, no warm-up enforcement
**Gap:** Need Oven On button, OnEvent logging, warm-up time validation
**Priority:** HIGH - Safety/quality control feature

### 6. ❌ Barcode Mode and Scanner Support
**PDF Requirement:** "In Barcode Mode, the form directs keyboard (or barcode reader) inputs to their proper controls automatically. A TRAK goes to the TRAK box, an oven goes to the oven list, an application goes to the application list, a bake time goes to the bake time box, and everything else goes to the Note box."
**Current State:** No barcode mode, no automatic routing
**Gap:** Need Barcode Mode toggle, keystroke interception, automatic field routing, action barcode support (Reset, Add, Remove, Oven On)
**Priority:** HIGH - Primary data entry method

### 7. ❌ User Authentication and Access Control
**PDF Requirement:** "Show Selection selects those ovens previously associated with the current user. Only these ovens are visible in the main form. Users may only add/remove TRAKs to/from these ovens."
**Current State:** Hardcoded user "001", no authentication, no access control
**Gap:** Need user login, user-oven associations (UserOven table), Show/Save Selection, enforcement
**Priority:** HIGH - Security and workflow control

## Important Features (Should Have)

### 8. ❌ Customize/Barcode Sheet Generator
**PDF Requirement:** "After selecting ovens, applications, and times, click Barcode Sheet to generate a customized printable report. Each page can hold up to eleven ovens, applications, and time and contains the four action barcode: Reset, Oven On, Add, and Remove."
**Current State:** No barcode sheet generator
**Gap:** Need Customize form with oven/app/time selection, barcode generation, printable report
**Priority:** MEDIUM - Enhances barcode workflow

### 9. ❌ Tools/Admin Management UI
**PDF Requirement:** "The Tools button opens a form with controls to maintain ovens, applications, users, etc."
**Current State:** No admin UI (only API endpoints)
**Gap:** Need admin pages for:
- Manufacturer ► Model management
- Types management
- Locations management
- Ovens management
- User ► Alias management
- Applications management
- Standard Times management
**Priority:** MEDIUM - Required for system administration

### 10. ❌ Reporting Views
**PDF Requirement:** Multiple reporting views required
**Current State:** No reporting UI
**Gap:** Need:
- View Entire Database (all events)
- Recent Activity (last 24 hours)
- TRAKs In Ovens (current state)
**Priority:** MEDIUM - Important for monitoring and auditing

### 11. ❌ TRAK Validation Against CIMA
**PDF Requirement:** "The Part and TRAK tables are populated from CIMA when a TRAK is scanned (or when a TRAK is manually entered). If a TRAK does not appear in the TRAK list, it means it is not an active work order TRAK or the TRAK is already in an oven."
**Current State:** No CIMA integration, no validation
**Gap:** Need CIMA integration (or stub), active work order validation, duplicate-in-oven prevention
**Priority:** MEDIUM - Data quality control

### 12. ❌ TRAKs for Testing Report
**PDF Requirement:** "TRAKs for Testing displays a report with 63 TRAK ID barcodes for testing the interface of the application."
**Current State:** No test TRAK report
**Gap:** Need printable report with 63 test TRAK barcodes
**Priority:** LOW - Testing convenience

### 13. ❌ Missing Badges Query
**PDF Requirement:** "This button queries CIMA for THOR labor charged during the last three months and determines which of these badges are missing from the Oven Log's local user table."
**Current State:** No CIMA integration
**Gap:** Need CIMA query for missing badges
**Priority:** LOW - Administrative convenience

### 14. ❌ Dedicated Station Mode
**PDF Requirement:** "If the station is dedicated to an oven, the oven and temperature combo boxes are disabled and the operator combo box is enabled."
**Current State:** No dedicated station support
**Gap:** Need station configuration, operator selection when dedicated
**Priority:** LOW - Specialized workflow

## Implemented Features ✅

### Core Functionality
- ✅ Add single TRAK to oven
- ✅ Remove TRAK from oven
- ✅ Display TRAKs in ovens with time remaining
- ✅ Real-time time remaining calculations
- ✅ Oven selection dropdown
- ✅ Application selection dropdown
- ✅ Temperature, bake time, quantity, notes fields

### Database Schema
- ✅ All 14 tables created (Trak, Box, Event, Application, User, Part, BoxType, Manufacturer, Model, Location, OnEvent, StandardTime, Alias, UserOven)
- ✅ Proper relationships and foreign keys
- ✅ Seed data for testing

### API Endpoints
- ✅ GET /api/boxes - List all ovens
- ✅ GET /api/applications - List all applications
- ✅ GET /api/users - List all users
- ✅ GET /api/events - List all events
- ✅ GET /api/events/in-ovens - List TRAKs currently in ovens
- ✅ GET /api/events/recent - Recent activity
- ✅ GET /api/events/trak/{trakId} - TRAK history
- ✅ POST /api/events/add - Add TRAK to oven
- ✅ POST /api/events/remove/{id} - Remove TRAK from oven
- ✅ GET /api/traks - List all TRAKs
- ✅ GET /api/traks/{trakId} - Get specific TRAK

### Deployment
- ✅ Backend serves frontend (same-origin architecture)
- ✅ Cloud deployment working
- ✅ API accessible via browser and curl

## Implementation Priority

### Phase 1: Core Functionality (Critical)
1. Convert to persistent SQL database (SQLite or SQL Server)
2. Implement TRAK list with multi-select and batch add
3. Add removal confirmation dialog
4. Add History view
5. Implement Oven On button and warm-up enforcement

### Phase 2: Barcode Workflow (High Priority)
6. Implement Barcode Mode with keystroke routing
7. Add action barcode support (Reset, Add, Remove, Oven On)
8. Create Customize/Barcode Sheet generator

### Phase 3: User Management (High Priority)
9. Add user authentication/login
10. Implement user-oven associations (Show/Save Selection)
11. Enforce access control

### Phase 4: Administration (Medium Priority)
12. Create Tools/Admin UI for all management functions
13. Add reporting views (View Database, Recent Activity, TRAKs In Ovens)
14. Implement TRAK validation (CIMA stub + duplicate prevention)

### Phase 5: Additional Features (Lower Priority)
15. TRAKs for Testing report
16. Missing Badges query
17. Dedicated station mode

## Notes
- The current implementation is a proof of concept with in-memory database
- Many backend models and API endpoints exist but lack corresponding UI
- The PDF describes an MS Access application with rich UI - the web version needs equivalent functionality
- Barcode scanning is a primary workflow that's completely missing
- User access control is mentioned throughout the PDF but not implemented
