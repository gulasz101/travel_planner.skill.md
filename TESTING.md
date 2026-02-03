# Testing Documentation

This document tracks all testing performed on the Travel Planner skill.

## Test Environment

- **OpenClaw Instance:** openclaw@openclaw.local
- **Node.js Version:** (to be determined during testing)
- **Messaging Channel:** (to be configured during testing)
- **Test Date:** (to be filled in during testing)

## Unit Tests

### Input Parsing Tests

#### User-Invocable Command Parsing

- [ ] **Test:** `/travel-planner DUS to WAW next Friday`
  - **Expected:** Parse origin=DUS, destination=WAW, date="next Friday"
  - **Result:**

- [ ] **Test:** `/travel-planner NYC to Paris`
  - **Expected:** Parse origin=NYC, destination=Paris, date=null
  - **Result:**

- [ ] **Test:** `/travel-planner` (no arguments)
  - **Expected:** Display help/interactive prompt
  - **Result:**

- [ ] **Test:** `/travel-planner list`
  - **Expected:** List all monitored routes
  - **Result:**

#### Date Parsing Tests

- [ ] **Test:** parseDate("next Friday")
  - **Expected:** Return specific date for next Friday
  - **Result:**

- [ ] **Test:** parseDate("any day in March 2026")
  - **Expected:** Return date range with all days in March 2026
  - **Result:**

- [ ] **Test:** parseDate("flexible")
  - **Expected:** Return flexible type
  - **Result:**

- [ ] **Test:** parseDate("next weekend")
  - **Expected:** Return Friday-Sunday range
  - **Result:**

#### Location Validation Tests

- [ ] **Test:** validateLocation("DUS")
  - **Expected:** valid=true, code="DUS", type="airport"
  - **Result:**

- [ ] **Test:** validateLocation("New York")
  - **Expected:** valid=true, code="NEW YORK", type="city"
  - **Result:**

- [ ] **Test:** validateLocation("XYZ123")
  - **Expected:** valid=false, error="INVALID_FORMAT"
  - **Result:**

### Price Tracker Tests

#### Price History Recording

- [ ] **Test:** Record first price check for a new route
  - **Expected:** Create new price history file, initialize stats
  - **Result:**

- [ ] **Test:** Record multiple checks over several days
  - **Expected:** Calculate 7-day and 30-day averages correctly
  - **Result:**

- [ ] **Test:** Data cleanup (90-day retention)
  - **Expected:** Remove entries older than 90 days
  - **Result:**

#### Deal Detection Logic

- [ ] **Test:** Price drops 20% from 7-day average
  - **Expected:** isDeal=true, reason="significant_drop"
  - **Result:**

- [ ] **Test:** Price is 30-day low
  - **Expected:** isDeal=true, reason="30_day_low", isLowestIn30Days=true
  - **Result:**

- [ ] **Test:** Price drops only 5% from average
  - **Expected:** isDeal=false
  - **Result:**

- [ ] **Test:** First check with no history
  - **Expected:** isDeal=false, reason="insufficient_data"
  - **Result:**

### Message Formatting Tests

- [ ] **Test:** formatPriceAlert with 20% drop
  - **Expected:** Include percentage drop and "significant price drop" message
  - **Result:**

- [ ] **Test:** formatPriceCheckResult with no flights
  - **Expected:** User-friendly error message with suggestions
  - **Result:**

- [ ] **Test:** formatRouteList with 3 routes
  - **Expected:** Numbered list with emojis, schedule, and status for each
  - **Result:**

- [ ] **Test:** formatError("INVALID_AIRPORT", {code: "XYZ"})
  - **Expected:** Clear, actionable message without technical details
  - **Result:**

## Integration Tests

### Configuration Management

- [ ] **Test:** Save and load skill configuration
  - **Expected:** Config persists correctly in ~/.openclaw/openclaw.json
  - **Result:**

- [ ] **Test:** Update existing route configuration
  - **Expected:** Only specified fields updated, others unchanged
  - **Result:**

- [ ] **Test:** Delete route from configuration
  - **Expected:** Route removed, other routes unaffected
  - **Result:**

### Tool Invocation Tests

#### setup_flight_monitoring Tool

- [ ] **Test:** Set up first route (NYC to PAR)
  - **Expected:** Route saved, confirmation message, cron job created
  - **Result:**

- [ ] **Test:** Set up second route (DUS to MAD)
  - **Expected:** Both routes active, correct totalRoutes count
  - **Result:**

- [ ] **Test:** Update existing route settings
  - **Expected:** Settings updated, confirmation message
  - **Result:**

#### check_flight_price Tool

- [ ] **Test:** Check prices for DUS to WAW (specific date)
  - **Expected:** Return flight prices, include monitoring suggestion
  - **Result:**

- [ ] **Test:** Check prices for monitored route
  - **Expected:** Return prices, NO monitoring suggestion
  - **Result:**

- [ ] **Test:** Check prices with invalid airport code
  - **Expected:** User-friendly error message
  - **Result:**

#### list_monitoring Tool

- [ ] **Test:** List routes with 0 active routes
  - **Expected:** Friendly message explaining how to start monitoring
  - **Result:**

- [ ] **Test:** List routes with 2 active routes
  - **Expected:** Formatted list with status for both routes
  - **Result:**

#### disable_route_monitoring Tool

- [ ] **Test:** Disable specific route by ID
  - **Expected:** Route removed, cron job deleted, price history deleted
  - **Result:**

- [ ] **Test:** Disable route by natural description
  - **Expected:** Correctly identify and remove route
  - **Result:**

- [ ] **Test:** Disable non-existent route
  - **Expected:** Clear error message, suggest using list command
  - **Result:**

#### stop_all_monitoring Tool

- [ ] **Test:** Stop all monitoring with 2 active routes
  - **Expected:** All routes removed, all cron jobs deleted, all history deleted
  - **Result:**

- [ ] **Test:** Stop all monitoring with 0 active routes
  - **Expected:** Friendly message indicating nothing to stop
  - **Result:**

## End-to-End Tests

### Single Route Monitoring Flow

- [ ] **Test:** Complete flow for one route
  1. Send: "Monitor flights from NYC to Paris"
  2. Verify: setup_flight_monitoring tool invoked
  3. Verify: Configuration saved correctly
  4. Verify: Cron job created (check cron job ID in config)
  5. Manual check: `/travel-planner NYC to Paris`
  6. Verify: Price history file created
  7. Force cron run or wait for scheduled time
  8. Verify: Notification delivered (if deal found)
  9. Send: "Stop monitoring flights to Paris"
  10. Verify: Route disabled, files cleaned up
  - **Result:**

### Multi-Route Monitoring Flow

- [ ] **Test:** Monitor multiple routes simultaneously
  1. Set up route 1: "Monitor DUS to WAW, any day in March"
  2. Verify: Cron job travel-planner-DUS-WAW created
  3. Set up route 2: "Also monitor DUS to MAD"
  4. Verify: Cron job travel-planner-DUS-MAD created
  5. List: `/travel-planner list` or "What am I monitoring?"
  6. Verify: Both routes shown with correct status
  7. Disable route 1: "Stop monitoring Warsaw flights"
  8. Verify: Only DUS-MAD cron job remains
  9. Verify: DUS-WAW route removed, DUS-MAD still active
  10. Re-add route 1, then: "Stop all monitoring"
  11. Verify: All cron jobs removed
  - **Result:**

### Flexible Date Range Flow

- [ ] **Test:** Monitor with flexible date range
  1. Set up: "Monitor DUS to WAW, any day in March 2026"
  2. Verify: Scraper checks multiple dates in March
  3. Verify: Price history stores best price across all dates
  4. Verify: Notifications include best travel date
  5. Test different formats: "flexible dates", "next weekend", "March 15"
  - **Result:**

## Browser Scraping Tests

### Google Flights Scraping

- [ ] **Test:** Scrape DUS to WAW (specific date)
  - **Expected:** Return 3+ flight results with prices, airlines, stops
  - **Result:**

- [ ] **Test:** Scrape NYC to Paris (flexible dates)
  - **Expected:** Return flights with various travel dates
  - **Result:**

- [ ] **Test:** Scrape invalid route (e.g., XYZ to ABC)
  - **Expected:** Return empty results, handle gracefully
  - **Result:**

- [ ] **Test:** Page load timeout
  - **Expected:** Return error after timeout, don't hang indefinitely
  - **Result:**

- [ ] **Test:** Network connectivity issue
  - **Expected:** Handle error gracefully, return user-friendly message
  - **Result:**

## Edge Cases

### Invalid Inputs

- [ ] **Test:** Empty origin or destination
  - **Expected:** Validation error, user-friendly message
  - **Result:**

- [ ] **Test:** Invalid date format
  - **Expected:** Parse as flexible or return clear error
  - **Result:**

- [ ] **Test:** Invalid time format for check_time
  - **Expected:** Default to 7:00 AM or return error
  - **Result:**

### Empty States

- [ ] **Test:** Get price history for non-existent route
  - **Expected:** Clear message indicating no history available
  - **Result:**

- [ ] **Test:** List monitoring with no routes
  - **Expected:** Friendly message with setup instructions
  - **Result:**

- [ ] **Test:** First price check (no historical data)
  - **Expected:** Show prices, indicate this is first check
  - **Result:**

### Error Conditions

- [ ] **Test:** Browser automation failure
  - **Expected:** User-friendly error, don't expose stack trace
  - **Result:**

- [ ] **Test:** Config file corruption
  - **Expected:** Reinitialize config or show clear error
  - **Result:**

- [ ] **Test:** Storage directory not writable
  - **Expected:** Clear error message about permissions
  - **Result:**

## User Experience Tests

### Non-Technical User Testing

- [ ] **Test:** Have non-technical user set up monitoring
  - **Expected:** User successfully sets up without technical help
  - **Result:**

- [ ] **Test:** Various natural language phrasings
  - "Can you monitor flights from DUS to WAW?"
  - "I need to watch prices for Paris"
  - "Check if there are cheap flights to Madrid"
  - **Expected:** OpenClaw correctly interprets intent
  - **Result:**

- [ ] **Test:** Error recovery
  - User enters invalid airport code
  - **Expected:** Clear error message, user knows how to fix
  - **Result:**

## Performance Tests

- [ ] **Test:** Scraping time for single date
  - **Expected:** Complete within 10 seconds
  - **Result:**

- [ ] **Test:** Scraping time for date range (5 dates)
  - **Expected:** Complete within 30 seconds
  - **Result:**

- [ ] **Test:** Configuration load/save time
  - **Expected:** < 100ms for typical config
  - **Result:**

- [ ] **Test:** Price history file size after 90 days
  - **Expected:** < 100KB per route
  - **Result:**

## Cron Job Tests

- [ ] **Test:** Cron job creation
  - **Expected:** Job appears in cron list with correct schedule
  - **Result:**

- [ ] **Test:** Cron job execution (forced run)
  - **Expected:** Job runs, checks prices, sends notification if deal
  - **Result:**

- [ ] **Test:** Cron job isolation
  - **Expected:** Job runs in clean session, doesn't interfere with main session
  - **Result:**

- [ ] **Test:** Multiple cron jobs (2+ routes)
  - **Expected:** Each job runs independently at scheduled time
  - **Result:**

- [ ] **Test:** Cron job removal
  - **Expected:** Job removed from cron list after disabling route
  - **Result:**

## Security Tests

- [ ] **Test:** SQL/Command injection in airport codes
  - **Expected:** Inputs sanitized, no code execution
  - **Result:**

- [ ] **Test:** Path traversal in route IDs
  - **Expected:** Only valid filenames created in storage
  - **Result:**

- [ ] **Test:** Config file permissions
  - **Expected:** Config readable only by OpenClaw user
  - **Result:**

## Known Issues

List any bugs or limitations discovered during testing:

1.
2.
3.

## Test Summary

- **Total Tests:** (count)
- **Passed:** (count)
- **Failed:** (count)
- **Skipped:** (count)

## Notes

Add any additional observations or notes from testing:

---

**Testing completed by:** (name)
**Date:** (date)
**OpenClaw Version:** (version)
