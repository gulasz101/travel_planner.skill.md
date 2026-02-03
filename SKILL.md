---
name: travel-planner
description: Check flight prices and monitor for deals between cities
user-invocable: true
disable-model-invocation: false
metadata: {"openclaw":{"requires":{},"emoji":"✈️"}}
---

# Travel Planner Skill

This skill enables checking flight prices and monitoring for deals between cities.

## Two Modes of Operation

### 1. Quick Queries (User-Invocable)
Direct slash command for one-time price checks:

**Usage:** `/travel-planner <origin> to <destination> [date]`

**Examples:**
- `/travel-planner DUS to WAW next Friday`
- `/travel-planner NYC to Paris`
- `/travel-planner San Francisco to Tokyo in March`
- Just type `/travel-planner` to get prompted for details

**Response:** Immediate one-time price check, no monitoring set up.

### 2. Ongoing Monitoring (Agent-Invoked)
Natural language requests that OpenClaw's agent interprets:

**Examples:**

- "I want to monitor flights from New York to Paris"
- "Check current flight prices from NYC to London"
- "What's the price history for my monitored route?"
- "Change my monitoring to check at 9am instead"
- "Stop monitoring flights"
- "What flights am I currently monitoring?"

## Tools provided to OpenClaw

### setup_flight_monitoring
Adds a new route to automated flight price monitoring. Supports multiple routes simultaneously.

**Parameters:**
- `origin` (string, required): Origin city/airport code (e.g., "DUS", "NYC")
- `destination` (string, required): Destination city/airport code (e.g., "WAW", "MAD")
- `date_range` (string, optional): Date flexibility (e.g., "any day in March 2026", "next Friday", "flexible")
- `check_time` (string, optional): Time to check daily in HH:MM format, defaults to user's global default
- `timezone` (string, optional): IANA timezone, defaults to user's global default
- `price_drop_threshold` (number, optional): Percentage drop to trigger alert, defaults to 15

**Returns:** Confirmation message with monitoring details. If route already monitored, updates settings instead.

**Example:**
> "✈️ Now monitoring DUS → WAW
>
> Date range: Any day in March 2026
> Daily checks: 7:00 AM CET
> Alert threshold: 15% price drop
>
> You're now monitoring 2 routes. Type '/travel-planner list' to see all."

### check_flight_price
Checks current flight prices for a route (supports both one-time queries and monitoring checks).

**Parameters:**
- `origin` (string, required): Origin city/airport code (e.g., "DUS", "NYC", "Düsseldorf")
- `destination` (string, required): Destination city/airport code (e.g., "WAW", "Paris")
- `date` (string, optional): Travel date in natural language (e.g., "next Friday", "in March", "Feb 15")
- `flexible_dates` (boolean, optional): Check nearby dates for better prices, defaults to true
- `return_date` (string, optional): Return date for round-trip (if not specified, searches one-way)

**Returns:** Current best prices with flight details, comparison to historical data (if available), and **suggestion to set up monitoring** if not already active for this route.

**User-Invocable Format:**
- `/travel-planner <origin> to <destination> [date]`
- Skill parses the natural language and extracts parameters

**Follow-up Suggestion:**
After showing prices, the response should include:
> "Would you like me to monitor this route and alert you when prices drop? Just ask me to 'monitor flights from [origin] to [destination]'."

This creates a natural upgrade path from one-time checks to ongoing monitoring.

### get_price_history
Retrieves historical price data and trends for a specific route.

**Parameters:**
- `route_id` (string, required): Route identifier (e.g., "DUS-WAW")
- `days` (number, optional): Number of days to retrieve, defaults to 30

**Returns:** Price history with statistics (average, min, max, trend direction).

### list_monitoring
Lists all routes currently being monitored.

**Parameters:** (none)

**Returns:** List of all monitored routes with status, next check time, and current price info.

**Example:**
> "📋 Active Flight Monitoring
>
> 1️⃣ DUS → WAW
>    📅 Any day in March 2026
>    ⏰ Daily at 7:00 AM CET
>    💰 Current best: €89 (checked 2h ago)
>    📊 7-day avg: €95
>
> 2️⃣ DUS → MAD
>    📅 Flexible dates
>    ⏰ Daily at 8:00 AM CET
>    💰 Current best: €156 (checked 1h ago)
>    📊 7-day avg: €162
>
> Type 'disable monitoring for [route]' to stop tracking a specific route."

### disable_route_monitoring
Stops monitoring a specific route while keeping other routes active.

**Parameters:**
- `route_id` (string, required): Route identifier (e.g., "DUS-WAW") or natural description (e.g., "Düsseldorf to Warsaw")

**Returns:** Confirmation that the route has been removed from monitoring.

**Example:**
> "✅ Stopped monitoring DUS → WAW
>
> You still have 1 active route being monitored.
> Type '/travel-planner list' to see all."

### stop_all_monitoring
Stops all flight price monitoring.

**Parameters:** (none)

**Returns:** Confirmation that all monitoring has stopped.

### update_route_monitoring
Updates settings for a specific monitored route.

**Parameters:**
- `route_id` (string, required): Route identifier (e.g., "DUS-WAW")
- `check_time` (string, optional): New check time
- `timezone` (string, optional): New timezone
- `price_drop_threshold` (number, optional): New threshold percentage
- `date_range` (string, optional): New date range

**Returns:** Confirmation with updated configuration.

### get_monitoring_status
Gets current monitoring configuration and status for all routes.

**Parameters:** (none)

**Returns:** Overview of all monitoring activity with current routes, schedules, and last check times.

## How it works

1. User messages OpenClaw with their intent (natural language)
2. OpenClaw understands the intent and calls the appropriate tool from this skill
3. Skill uses browser automation to scrape Google Flights for real-time prices
4. Skill tracks price history in local storage
5. When monitoring is active, a cron job runs daily checks
6. User receives message notifications when prices drop significantly (15%+ or 30-day low)

## Technical details

- Uses OpenClaw's built-in browser tool for scraping Google Flights
- Stores price history in `~/.openclaw/skills/travel-planner/storage/price-history-{ROUTE}.json`
- Creates isolated cron jobs for scheduled monitoring (one per route)
- Sends notifications via OpenClaw's messaging system (works with any channel)
- No external API dependencies - all data scraped directly from Google Flights
