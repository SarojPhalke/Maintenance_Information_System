# API Compatibility Fixes Summary

## Overview
All API endpoints in `server.js` have been updated to match the PostgreSQL schema defined in `mis_schema.txt`.

## Changes Made

### ✅ 1. Asset Master APIs
**Fixed:**
- Table name: `assets_master` → `asset_master`
- Column mappings:
  - `machine_no` → removed (not in schema)
  - `location` → `asset_location`
  - `category` → `asset_type` (enum: 'machine','utility','auxiliary')
  - `model` → `model_number` and `model_name`
  - `serial_number` → removed (not in schema)
  - `status` → `asset_status` (enum: lowercase values)
- Added: `bu_name`, `warranty_expiry`, `qr_code`
- Added: `created_by`, `updated_by` tracking

### ✅ 2. Breakdown APIs
**Fixed:**
- Removed: `breakdown_logs` table (doesn't exist)
- Added: APIs for `bd_entry_operator` table
- Added: APIs for `bd_entry_engineer` table
- GET endpoints now use `breakdown_entry_view` (joined view)
- Status enum: lowercase values ('open','ack','in_progress','resolved','closed')
- Added: `POST /api/breakdowns/:id/engineer` endpoint

**New Structure:**
- Operator creates breakdown entry → `bd_entry_operator`
- Engineer adds details → `bd_entry_engineer` (linked via `bd_operator_id`)

### ✅ 3. Spare Parts Inventory APIs
**Fixed:**
- `stock_on_hand` → `current_stock`
- `location` → `spare_location`
- Removed: `uom` (not in schema)
- Added: `bu_name` field
- Updated: `last_updated_by` tracking

### ✅ 4. Spare Transactions APIs
**Fixed:**
- Table name: `spare_txn` → `spare_transactions`
- Column updates:
  - `qty` → `quantity`
  - `direction` enum: lowercase ('issue','return')
  - `related_breakdown_id` → `pm_bd_id` + `pm_bd_type`
  - Added: `part_code`, `purpose`, `balance_after`
- Updated: Uses `current_stock` instead of `stock_on_hand`

### ✅ 5. PM Schedule APIs
**Fixed:**
- Column mappings:
  - `title` → `pm_title`
  - `frequency` → `frequency_interval` and `pm_frequency_interval`
  - `due_date` → `next_pm_date`
  - `checklist` → `checklist_ref`
  - `last_completed_at` → `last_pm_date`
- Status enum: lowercase ('scheduled','completed','overdue')
- Removed: 'PENDING' status (not in schema)

**Note:** PM Entry Operator/Engineer APIs still need to be added (separate from schedule)

### ✅ 6. Utilities Log APIs
**Fixed:**
- Table name: `utilities_log` → `utility_logs`
- Column mappings:
  - `reading` → `reading_value`
  - `reading_at` → `timestamp`
- Added: `reading_unit`, `business_unit_id`, `location_id`, `recorded_by`, `remarks`
- Utility type enum: Capitalized ('Power','Water','Air','Gas')

### ✅ 7. User/Profile APIs
**Fixed:**
- Role enum: Uppercase → lowercase to match schema
  - Schema: `('admin','engineer','manager','operator')`
  - Removed: 'VIEWER' role (not in schema enum)
- User ID: Now handles UUID type from `users` table
- Registration: Inserts into `users` table first, then `profiles` (if exists)

### ✅ 8. QR Code API
**Fixed:**
- Removed: `asset_qr` table join (doesn't exist in schema)
- Uses: `qr_code` column directly from `asset_master` table
- Endpoint: `/api/qr/:qr_code` (changed from `:payload`)

### ✅ 9. Dashboard Stats API
**Fixed:**
- `breakdown_logs` → `bd_entry_operator`
- `pm_schedule.status = 'DUE'` → `status = 'overdue'`
- `utilities_log` → `utility_logs`
- `stock_on_hand` → `current_stock`

## Breaking Changes for Frontend

### Request Body Changes

**Asset Creation:**
```javascript
// OLD
{ asset_code, asset_name, machine_no, location, category, ... }

// NEW
{ asset_code, asset_name, asset_location, bu_name, asset_type, ... }
```

**Breakdown Creation:**
```javascript
// OLD
{ asset_id, description, reported_by, started_at, status }

// NEW
{ bd_code, shift_id, entry_date, entry_time, asset_id, 
  asset_location, bu_name, operator_name, key_issue, 
  nature_of_complaint, note }
```

**Spare Transaction:**
```javascript
// OLD
{ part_id, qty, direction, asset_id, related_breakdown_id }

// NEW
{ part_id, quantity, direction, asset_id, pm_bd_id, pm_bd_type, purpose }
```

**PM Schedule:**
```javascript
// OLD
{ asset_id, title, frequency, due_date, checklist, status }

// NEW
{ asset_id, pm_title, frequency_interval, next_pm_date, checklist_ref, status }
```

**Utility Log:**
```javascript
// OLD
{ utility_type, meter_point, reading, reading_at }

// NEW
{ utility_type, meter_point, reading_unit, reading_value, 
  timestamp, asset_id, business_unit_id, location_id, remarks }
```

### Response Changes

- All enum values are now lowercase (status, roles, etc.)
- Asset status: 'ACTIVE' → 'active'
- Breakdown status: 'OPEN' → 'open'
- User roles: 'ADMIN' → 'admin'

## New Endpoints Added

1. `POST /api/breakdowns/:id/engineer` - Create/update engineer entry for breakdown

## Missing APIs (Not Yet Implemented)

These tables exist in schema but don't have APIs yet:
- `pm_entry_operator` - PM operator entries
- `pm_entry_engineer` - PM engineer entries  
- `pm_compliance` - PM compliance tracking
- `spare_usage` - Spare consumption records
- `business_units` - Business unit management
- `locations` - Location management
- `carbon_emission_logs` - Carbon emission tracking
- `water_quality_logs` - Water quality monitoring
- `machine_equipment_condition_logs` - MECDL tracking
- `downtime_logs` - Downtime tracking
- `shift_table` - Shift management
- `audit_logs` - Audit trail
- `reminder_log` - Notification logs
- KPI endpoints - For materialized views

## Testing Checklist

- [ ] Test asset creation with new column names
- [ ] Test breakdown creation (operator entry)
- [ ] Test breakdown engineer entry creation
- [ ] Test spare parts inventory with `current_stock`
- [ ] Test spare transactions with new structure
- [ ] Test PM schedule with new columns
- [ ] Test utility logs with new structure
- [ ] Test user registration with lowercase roles
- [ ] Test QR code lookup
- [ ] Test dashboard stats endpoint

## Migration Notes

1. **Existing Data**: If you have existing data, you may need to:
   - Migrate asset records to new column names
   - Migrate breakdown records to new table structure
   - Update role values to lowercase
   - Update status values to lowercase

2. **Frontend Updates Required**:
   - Update all API request bodies
   - Update enum value comparisons (case-sensitive)
   - Update form field names
   - Update response parsing

3. **Database**: Ensure schema matches `mis_schema.txt` exactly

## Next Steps

1. Test all endpoints with actual database
2. Update frontend to match new API structure
3. Add missing APIs for new tables
4. Add validation for enum values
5. Add proper error handling for UUID types

