# Travel Planner - OpenClaw Skill

An OpenClaw skill that monitors flight prices between cities using browser automation, tracks price history, and sends notifications when prices drop significantly.

## Features

- **Quick price checks** via `/travel-planner` command
- **Automated monitoring** with daily price checks
- **Smart deal detection** based on price drops and historical trends
- **Multi-route support** - monitor multiple flight routes simultaneously
- **Flexible date ranges** - specific dates, flexible dates, or entire months
- **Channel-agnostic notifications** - works with Telegram, WhatsApp, Signal, etc.

## Quick Start

```bash
# 1. Run setup script
./setup.sh

# 2. Test locally with demo
node demo.js

# 3. Deploy to OpenClaw
cp -r . ~/.openclaw/skills/travel-planner
systemctl --user restart openclaw-gateway

# 4. Verify skill is loaded
openclaw skills
```

Then ask OpenClaw:
- "Check flights from DUS to WAW next Friday"
- "Monitor flights from New York to Paris"
- "What flights am I monitoring?"

## Installation

### Prerequisites

- OpenClaw instance running
- Node.js 18+ (bundled with OpenClaw)
- Configured messaging channel (Telegram, WhatsApp, etc.)

### Setup

1. Clone this repository to your OpenClaw skills directory:

```bash
ssh openclaw@openclaw.local
cd ~/.openclaw/skills
git clone <repository-url> travel-planner
```

2. Restart OpenClaw or reload skills:

```bash
# Method depends on your OpenClaw setup
openclaw reload
# or
systemctl restart openclaw
```

3. Verify the skill is loaded:

```bash
openclaw skills list
```

You should see `travel-planner` in the list.

## Usage

### Two Ways to Use

#### 1. Quick Queries (User-Invocable)

Direct slash command for one-time price checks:

```
/travel-planner DUS to WAW next Friday
/travel-planner NYC to Paris
/travel-planner San Francisco to Tokyo in March
/travel-planner list
```

Just type `/travel-planner` with no arguments to get prompted for details.

#### 2. Natural Language (Agent-Invoked)

Talk to OpenClaw naturally, and it will invoke the appropriate tools:

**Set up monitoring:**
```
"I want to monitor flights from New York to Paris"
"Monitor flights from DUS to WAW, any day in March"
"Also monitor flights to Madrid"
```

**Check prices:**
```
"Check flight prices from NYC to London"
"What are current prices from DUS to WAW?"
```

**Manage monitoring:**
```
"What flights am I monitoring?"
"Change my flight check time to 9am"
"Stop monitoring flights to Madrid"
"Stop all monitoring"
```

## Examples

### Setting Up Monitoring

**User:** "I want to monitor flights from New York to Paris"

**OpenClaw:**
```
✈️ Flight monitoring is active!

Route: New York → Paris
Date range: Flexible
Daily checks: 7:00 AM Eastern
Alert threshold: 15% price drop

I'll check prices tomorrow morning!
```

### Receiving a Deal Alert

When a good deal is found, you'll receive a notification:

```
🎉 Great deal found!

✈️ NYC → Paris
💰 $425 (↓ 18% from avg)
📅 February 15
🏢 Air France (non-stop), 7h 30m

This is the lowest price in 30 days!
```

### Monitoring Multiple Routes

**User:** "Monitor DUS to WAW, any day in March"

**OpenClaw:**
```
✈️ Now monitoring DUS → WAW

Date range: Any day in March 2026
Daily checks: 7:00 AM CET
Alert threshold: 15% price drop

You're now monitoring 2 routes!
```

**User:** "What flights am I monitoring?"

**OpenClaw:**
```
📋 Active Flight Monitoring

1️⃣ NYC → PAR
   📅 Flexible dates
   ⏰ Daily at 7:00 AM Eastern

2️⃣ DUS → WAW
   📅 Any day in March 2026
   ⏰ Daily at 7:00 AM CET

Type "disable monitoring for [route]" to stop tracking a specific route.
```

## How It Works

1. **User sends message** - Natural language or slash command
2. **OpenClaw invokes tool** - Interprets intent and calls appropriate skill tool
3. **Browser scraping** - Uses OpenClaw's browser tool to scrape Google Flights
4. **Price analysis** - Tracks history and detects deals (15%+ drop or 30-day low)
5. **Notifications** - Sends alerts via your configured messaging channel
6. **Cron scheduling** - Runs daily checks automatically in the background

## Configuration

Configuration is stored in `~/.openclaw/openclaw.json`:

```json
{
  "skills": {
    "entries": {
      "travel-planner": {
        "enabled": true,
        "config": {
          "routes": {
            "NYC-PAR": {
              "origin": "NYC",
              "destination": "PAR",
              "dateRange": "flexible",
              "monitoring": {
                "enabled": true,
                "cronJobId": "travel-planner-NYC-PAR",
                "schedule": "0 7 * * *",
                "timezone": "America/New_York"
              },
              "preferences": {
                "priceDropThreshold": 15
              }
            }
          },
          "globalDefaults": {
            "schedule": "0 7 * * *",
            "timezone": "UTC",
            "priceDropThreshold": 15
          }
        }
      }
    }
  }
}
```

### Settings You Can Customize

- **Check time** - When daily price checks run (e.g., "7:00 AM", "14:30")
- **Timezone** - IANA timezone (e.g., "Europe/Berlin", "America/New_York")
- **Price drop threshold** - Percentage drop to trigger alert (default: 15%)
- **Date range** - Flexible, specific dates, or date ranges per route

Change settings by asking OpenClaw:
```
"Change my flight check time to 9am for the Paris route"
"Set alert threshold to 20% for DUS to WAW"
```

## Price History

Price history is stored per route in:
```
~/.openclaw/skills/travel-planner/storage/price-history-{ROUTE}.json
```

Example: `price-history-NYC-PAR.json`

The skill keeps 90 days of history and automatically cleans up old data.

## Deal Detection

A flight is considered a "good deal" if:
- Price is **15%+ below the 7-day average** (customizable per route)
- OR price is the **lowest in 30 days**

Statistics tracked:
- 7-day average price
- 30-day min/max prices
- Last check timestamp
- Best travel date (for flexible searches)

## Troubleshooting

### "I couldn't load the flight search page"
- Google Flights may be temporarily unavailable
- Network connectivity issues
- The skill will retry during the next scheduled check

### "I couldn't find an airport with code 'XYZ'"
- Use standard 3-letter airport codes (DUS, WAW, NYC, LAX)
- Or use full city names (New York, Paris, Los Angeles)

### "No flights available for this route"
- The route may not have direct flights
- Try different airport codes for the same city
- Check if the date range is valid

### Monitoring not working
- Ensure OpenClaw's cron system is running
- Check that the skill is enabled: `openclaw skills list`
- Verify your messaging channel is configured
- Check logs: `journalctl -u openclaw -f`

## Development

### Running Locally

For local development and testing:

```bash
cd /Users/wojciechgula/Projects/travel_planner

# Test individual modules
node -e "const s = require('./scraper'); console.log(s.parseDate('next Friday'))"
node -e "const f = require('./message-formatter'); console.log(f.formatError('INVALID_AIRPORT', {code: 'XYZ'}))"
```

### Testing on OpenClaw

1. Make changes locally
2. Commit to git
3. Deploy to OpenClaw:

```bash
ssh openclaw@openclaw.local
cd ~/.openclaw/skills/travel-planner
git pull
openclaw reload
```

4. Test via your messaging app

### File Structure

```
travel-planner/
├── SKILL.md              # Skill definition for OpenClaw
├── index.js              # Main tool definitions and handlers
├── scraper.js            # Google Flights browser automation
├── price-tracker.js      # Price history and analysis
├── message-formatter.js  # User-friendly message formatting
├── storage/              # Price history data (per route)
│   ├── price-history-NYC-PAR.json
│   ├── price-history-DUS-WAW.json
│   └── .gitkeep
├── package.json          # Project metadata
└── README.md            # This file
```

## Security & Privacy

- **No external APIs** - All data scraped directly from Google Flights
- **Local storage** - Price history stored on your OpenClaw instance
- **No data sharing** - Your data never leaves your server
- **Rate limiting** - Maximum 1 check per route per hour to avoid detection
- **Input validation** - All user inputs are validated and sanitized

## Limitations

- **Google Flights only** - Currently only scrapes Google Flights
- **Browser-dependent** - Requires working browser automation
- **Rate limits** - Too many checks may trigger Google's anti-bot measures
- **No booking** - Only monitors prices, doesn't book flights
- **Page structure changes** - Google Flights updates may require scraper adjustments

## Future Enhancements

- Support for multiple destination options
- Email notifications as alternative to messaging apps
- Price prediction using machine learning
- Integration with calendar for trip planning
- Support for hotel and car rental price monitoring
- Multi-city route support

## Contributing

This is a personal project, but contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on an OpenClaw instance
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

- **Issues:** Report bugs at the repository's issue tracker
- **Questions:** Ask in OpenClaw community channels
- **Documentation:** See SKILL.md for technical details

## Version

Current version: **0.1.0**

See TESTING.md for test results and validation.
