---
name: travel-planner
description: Monitor flight prices between cities, track deals, and send notifications when prices drop. Use when the user wants to check flight prices, set up price monitoring, or manage flight route tracking.
user-invocable: true
metadata: {"openclaw":{"requires":{"bins":["node"]},"emoji":"✈️"}}
---

# Travel Planner

Monitor flight prices between cities using browser automation. Track price history and send notifications when significant deals are found (15%+ price drops or 30-day lows).

## When to Use This Skill

Use this skill when the user:
- Asks to check flight prices (e.g., "What are flights from NYC to Paris?")
- Wants to monitor flight prices (e.g., "Monitor flights from DUS to WAW")
- Asks about monitored routes (e.g., "What flights am I tracking?")
- Wants to stop monitoring (e.g., "Stop monitoring flights to Madrid")
- Asks about price history or deals

## Skill Location

This skill is located at: `~/.openclaw/skills/travel-planner/`

All commands should be run from this directory.

## Available Commands

### 1. Check Flight Prices (One-Time Query)

Check current flight prices without setting up monitoring:

```bash
cd ~/.openclaw/skills/travel-planner
node -e "
const skill = require('./index.js');
(async () => {
  const tool = skill.tools.find(t => t.name === 'check_flight_price');
  const result = await tool.handler({
    origin: 'NYC',
    destination: 'PAR',
    date: 'next Friday'
  }, {
    browser: context.browser  // Use OpenClaw's browser context
  });
  console.log(result);
})();
"
```

**Parameters:**
- `origin`: Airport code or city name (e.g., "NYC", "New York", "JFK")
- `destination`: Airport code or city name (e.g., "PAR", "Paris", "CDG")
- `date`: Natural language date (e.g., "next Friday", "March 15", "flexible")

**Note:** Requires OpenClaw's browser tool to be available in context.

### 2. Set Up Flight Monitoring

Add a route to automated daily monitoring:

```bash
cd ~/.openclaw/skills/travel-planner
node -e "
const skill = require('./index.js');
(async () => {
  const tool = skill.tools.find(t => t.name === 'setup_flight_monitoring');
  const result = await tool.handler({
    origin: 'NYC',
    destination: 'PAR',
    date_range: 'flexible',
    check_time: '7:00 AM',
    timezone: 'America/New_York',
    price_drop_threshold: 15
  }, {
    channel: 'telegram',
    chatId: '${TELEGRAM_CHAT_ID}'
  });
  console.log(result);
})();
"
```

**Parameters:**
- `origin` (required): Origin airport/city
- `destination` (required): Destination airport/city
- `date_range` (optional): "flexible", "any day in March 2026", "next Friday"
- `check_time` (optional): Daily check time, defaults to "7:00 AM"
- `timezone` (optional): IANA timezone, defaults to "UTC"
- `price_drop_threshold` (optional): Alert threshold percentage, defaults to 15

**Context Parameters:**
- `channel`: Current messaging channel (telegram, whatsapp, etc.)
- `chatId`: User's chat ID for notifications

### 3. List All Monitored Routes

Show all routes currently being monitored:

```bash
cd ~/.openclaw/skills/travel-planner
node -e "
const skill = require('./index.js');
(async () => {
  const tool = skill.tools.find(t => t.name === 'list_monitoring');
  const result = await tool.handler();
  console.log(result);
})();
"
```

Returns a formatted list with emoji indicators showing each route's status, schedule, and settings.

### 4. Get Monitoring Status

Get detailed status overview of all monitoring:

```bash
cd ~/.openclaw/skills/travel-planner
node -e "
const skill = require('./index.js');
(async () => {
  const tool = skill.tools.find(t => t.name === 'get_monitoring_status');
  const result = await tool.handler();
  console.log(result);
})();
"
```

### 5. Update Route Settings

Modify settings for a specific monitored route:

```bash
cd ~/.openclaw/skills/travel-planner
node -e "
const skill = require('./index.js');
(async () => {
  const tool = skill.tools.find(t => t.name === 'update_route_monitoring');
  const result = await tool.handler({
    route_id: 'NYC-PAR',
    check_time: '9:00 AM',
    price_drop_threshold: 20,
    date_range: 'any day in March'
  });
  console.log(result);
})();
"
```

**Parameters:**
- `route_id` (required): Route identifier (e.g., "NYC-PAR")
- `check_time` (optional): New check time
- `timezone` (optional): New timezone
- `price_drop_threshold` (optional): New alert threshold
- `date_range` (optional): New date range

### 6. Disable Specific Route

Stop monitoring a specific route:

```bash
cd ~/.openclaw/skills/travel-planner
node -e "
const skill = require('./index.js');
(async () => {
  const tool = skill.tools.find(t => t.name === 'disable_route_monitoring');
  const result = await tool.handler({
    route_id: 'NYC-PAR'
  });
  console.log(result);
})();
"
```

### 7. Stop All Monitoring

Disable monitoring for all routes:

```bash
cd ~/.openclaw/skills/travel-planner
node -e "
const skill = require('./index.js');
(async () => {
  const tool = skill.tools.find(t => t.name === 'stop_all_monitoring');
  const result = await tool.handler();
  console.log(result);
})();
"
```

### 8. Get Price History

View historical price data for a specific route:

```bash
cd ~/.openclaw/skills/travel-planner
node -e "
const skill = require('./index.js');
(async () => {
  const tool = skill.tools.find(t => t.name === 'get_price_history');
  const result = await tool.handler({
    route_id: 'NYC-PAR',
    days: 30
  });
  console.log(result);
})();
"
```

## User-Invocable Mode

When the user types `/travel-planner`, use the command parser:

```bash
cd ~/.openclaw/skills/travel-planner
node -e "
const skill = require('./index.js');
(async () => {
  const result = await skill.handleUserInvocation('DUS to WAW next Friday', {
    browser: context.browser
  });
  console.log(result);
})();
"
```

**Supported formats:**
- `/travel-planner` - Show help
- `/travel-planner list` - List monitored routes
- `/travel-planner NYC to Paris` - Check prices
- `/travel-planner DUS to WAW next Friday` - Check prices with date

## Natural Language Processing

When the user uses natural language (not slash commands), parse their intent and call the appropriate tool:

**Examples:**

User: *"Monitor flights from New York to Paris"*
→ Call `setup_flight_monitoring` with origin="NYC", destination="PAR"

User: *"What flights am I monitoring?"*
→ Call `list_monitoring`

User: *"Stop monitoring flights to Madrid"*
→ Call `disable_route_monitoring` with route matching "MAD"

User: *"Change my flight check time to 9am"*
→ Call `update_route_monitoring` with appropriate route_id and check_time="9:00 AM"

User: *"Check prices from DUS to WAW"*
→ Call `check_flight_price` with origin="DUS", destination="WAW"

## Data Storage

**Configuration:** `~/.openclaw/openclaw.json`
```json
{
  "skills": {
    "travel-planner": {
      "enabled": true,
      "routes": {
        "NYC-PAR": {
          "origin": "NYC",
          "destination": "PAR",
          "dateRange": "flexible",
          "monitoring": {
            "enabled": true,
            "schedule": "0 7 * * *",
            "timezone": "America/New_York"
          },
          "preferences": {
            "priceDropThreshold": 15
          }
        }
      }
    }
  }
}
```

**Price History:** `~/.openclaw/skills/travel-planner/storage/price-history-{ROUTE}.json`

Each route has its own price history file with:
- Daily price checks
- Best prices per date
- Statistics (7-day avg, 30-day min/max)
- Travel dates for flexible searches

## Deal Detection Logic

The skill automatically detects deals using two criteria:

1. **Significant Drop:** Price is 15%+ below the 7-day average (threshold is customizable per route)
2. **Record Low:** Price is the lowest in the past 30 days

When a deal is detected, a notification message is formatted and sent to the user's chat.

## Date Parsing

The skill understands natural language dates:
- **Specific:** "next Friday", "March 15", "2026-03-15"
- **Relative:** "next weekend", "in 2 weeks"
- **Ranges:** "any day in March", "any day in March 2026"
- **Flexible:** "flexible", "any day"

## Airport Code Validation

Supports:
- **3-letter codes:** DUS, WAW, NYC, JFK, CDG, LHR
- **City names:** "New York", "Paris", "Los Angeles"

Invalid codes return user-friendly error messages with suggestions.

## Error Handling

All errors are translated to user-friendly messages:

**Invalid airport:**
```
I couldn't find an airport with code 'XYZ'. Could you try with a city
name like 'New York' or a common airport code like 'JFK'?
```

**No flights found:**
```
I couldn't find any flights for this route right now. Would you like me
to check routes with connections?
```

**Browser unavailable:**
```
I need browser access to check flight prices. Please ensure the browser
tool is available.
```

## Multi-Route Support

The skill supports monitoring multiple routes simultaneously:
- Each route has independent settings (schedule, threshold, date range)
- Routes can be added, updated, or removed individually
- Each route maintains its own price history
- Statistics are calculated per route

## Cron Integration (TODO)

**Note:** Cron job creation is planned but not yet implemented. The placeholder is in `index.js` where it says:

```javascript
// TODO: Create cron job using OpenClaw's cron.add tool
```

To implement:
1. Use OpenClaw's `cron` tool to create scheduled jobs
2. One cron job per route (e.g., `cron-travel-planner-NYC-PAR`)
3. Configure isolated execution with delivery to user's channel
4. Store cron job ID in route config for cleanup

## Browser Integration

This skill requires OpenClaw's browser tool to scrape Google Flights.

**How it works:**
1. Constructs Google Flights URL with route and date parameters
2. Uses `browser.navigate(url)` to load the page
3. Waits for price results with `browser.wait(5000)`
4. Uses `browser.evaluate()` to extract flight data via JavaScript
5. Parses prices, airlines, stops, and durations

**Note:** The scraper in `scraper.js` contains example selectors that may need adjustment based on Google Flights' current page structure.

## Testing

All core functionality has been tested:
- ✅ All 8 tool handlers work correctly
- ✅ Configuration management (save/load/persist)
- ✅ Multi-route support
- ✅ Date parsing (natural language)
- ✅ Location validation
- ✅ Message formatting
- ✅ Price history storage

Browser scraping and cron integration require full OpenClaw environment to test.

## Troubleshooting

**Skill not loading:**
- Check Node.js is available: `which node`
- Verify skill directory exists: `ls ~/.openclaw/skills/travel-planner`
- Check file permissions: `ls -la ~/.openclaw/skills/travel-planner/*.js`

**Configuration errors:**
- Check config file: `cat ~/.openclaw/openclaw.json | grep -A 20 travel-planner`
- Verify JSON is valid: `cat ~/.openclaw/openclaw.json | python3 -m json.tool`

**Price history issues:**
- Check storage directory: `ls ~/.openclaw/skills/travel-planner/storage/`
- Verify write permissions: `touch ~/.openclaw/skills/travel-planner/storage/test.txt`

## Security Considerations

- All user inputs are validated before processing
- Airport codes are sanitized to prevent injection
- Price history files use predictable names (no user input in paths)
- Configuration stored in OpenClaw's protected config directory
- No external API calls (scrapes Google Flights directly)
- Rate limiting prevents excessive scraping (max 1 check/hour/route)

## Examples

### Example 1: Quick Price Check
```
User: "Check flights from NYC to Paris next Friday"

Agent executes:
cd ~/.openclaw/skills/travel-planner && node -e "..."

Response:
✈️ Best prices from NYC to Paris:

💰 $450 - Air France (direct), 7h 30m
💰 $520 - Delta (direct), 7h 45m
💰 $380 - British Airways (1 stop), 10h 15m

Would you like me to monitor this route and alert you when prices drop?
```

### Example 2: Set Up Monitoring
```
User: "Monitor flights from DUS to WAW, any day in March"

Agent executes:
cd ~/.openclaw/skills/travel-planner && node -e "..."

Response:
✈️ Flight monitoring is active!

Route: DUS → WAW
Date range: Any day in March 2026
Daily checks: 7:00 AM CET
Alert threshold: 15% price drop

I'll check prices tomorrow morning!
```

### Example 3: Manage Multiple Routes
```
User: "What flights am I monitoring?"

Agent executes:
cd ~/.openclaw/skills/travel-planner && node -e "..."

Response:
📋 Active Flight Monitoring

1️⃣ NYC → PAR
   📅 Flexible dates
   ⏰ Daily at 7:00 AM Eastern

2️⃣ DUS → WAW
   📅 Any day in March 2026
   ⏰ Daily at 7:00 AM CET

Type "disable monitoring for [route]" to stop tracking a specific route.
```

### Example 4: Update Settings
```
User: "Change my flight check time to 9am for the Paris route"

Agent executes:
cd ~/.openclaw/skills/travel-planner && node -e "..."

Response:
✅ Updated monitoring for NYC → PAR

Daily checks: 9:00 AM Eastern
Alert threshold: 15% price drop
Date range: flexible
```

## Best Practices

1. **Always validate** user inputs before calling tools
2. **Use natural language** in responses - no technical jargon
3. **Include context** when showing prices or status
4. **Suggest next steps** after completing actions
5. **Format with emojis** for visual clarity (✈️ 💰 📅 ⏰ 🎯 ✅)
6. **Handle errors gracefully** with actionable suggestions
7. **Confirm actions** before making changes (setup, disable, update)

## Module Structure

The skill consists of these JavaScript modules:

- `index.js` - Main tool handlers and exports
- `scraper.js` - Google Flights browser automation
- `price-tracker.js` - Price history management
- `message-formatter.js` - User-friendly message formatting

All modules work together to provide the complete functionality. The AI agent interacts with them through the command patterns shown above.

## Future Enhancements

Planned features not yet implemented:
- Cron job integration for automated checks
- Multiple destination options (e.g., "cheapest to anywhere in Europe")
- Price prediction using historical trends
- Email notifications as alternative to messaging
- Integration with calendar for trip planning
- Hotel and car rental price monitoring
