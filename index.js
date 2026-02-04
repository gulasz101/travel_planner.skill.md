/**
 * Travel Planner OpenClaw Skill
 * Main entry point with tool definitions
 */

const fs = require('fs/promises');
const path = require('path');
const scraper = require('./scraper');
const priceTracker = require('./price-tracker');
const formatter = require('./message-formatter');

/**
 * Get OpenClaw config path
 */
function getConfigPath() {
  const openclawHome = process.env.OPENCLAW_HOME || path.join(process.env.HOME, '.openclaw');
  return path.join(openclawHome, 'openclaw.json');
}

/**
 * Load OpenClaw configuration
 */
async function loadConfig() {
  try {
    const configPath = getConfigPath();
    const data = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // Config doesn't exist or can't be read
    return { skills: { entries: {} } };
  }
}

/**
 * Save OpenClaw configuration
 */
async function saveConfig(config) {
  const configPath = getConfigPath();

  // Ensure directory exists
  const configDir = path.dirname(configPath);
  await fs.mkdir(configDir, { recursive: true });

  await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
}

/**
 * Get skill configuration
 */
async function getSkillConfig() {
  const config = await loadConfig();

  if (!config.skills) {
    config.skills = {};
  }

  if (!config.skills['travel-planner']) {
    config.skills['travel-planner'] = {
      enabled: true,
      routes: {},
      delivery: {
        channel: null,
        chatId: null
      },
      globalDefaults: {
        schedule: '0 7 * * *',
        timezone: 'UTC',
        priceDropThreshold: 15
      }
    };
  }

  return config.skills['travel-planner'];
}

/**
 * Update skill configuration
 */
async function updateSkillConfig(updates) {
  const config = await loadConfig();

  if (!config.skills) {
    config.skills = {};
  }

  if (!config.skills['travel-planner']) {
    config.skills['travel-planner'] = {
      enabled: true,
      routes: {},
      delivery: {},
      globalDefaults: {}
    };
  }

  // Merge updates
  const skillConfig = config.skills['travel-planner'];
  Object.assign(skillConfig, updates);

  await saveConfig(config);

  return skillConfig;
}

/**
 * Generate route ID from origin and destination
 */
function generateRouteId(origin, destination) {
  const o = origin.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 3);
  const d = destination.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 3);
  return `${o}-${d}`;
}

/**
 * Parse time string to cron schedule
 */
function parseTimeToCron(timeStr, timezone = 'UTC') {
  // Parse "7:00 AM", "14:30", "9am", etc.
  const timeMatch = timeStr.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);

  if (!timeMatch) {
    // Default to 7:00 AM
    return '0 7 * * *';
  }

  let hour = parseInt(timeMatch[1], 10);
  const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
  const meridiem = timeMatch[3] ? timeMatch[3].toLowerCase() : null;

  // Convert to 24-hour format
  if (meridiem === 'pm' && hour !== 12) {
    hour += 12;
  } else if (meridiem === 'am' && hour === 12) {
    hour = 0;
  }

  return `${minute} ${hour} * * *`;
}

/**
 * Tool: setup_flight_monitoring
 */
async function setupFlightMonitoring(params, context) {
  const { origin, destination, date_range, check_time, timezone, price_drop_threshold } = params;

  // Validate inputs
  const originValidation = scraper.validateLocation(origin);
  if (!originValidation.valid) {
    return formatter.formatError('INVALID_AIRPORT', { code: origin });
  }

  const destValidation = scraper.validateLocation(destination);
  if (!destValidation.valid) {
    return formatter.formatError('INVALID_AIRPORT', { code: destination });
  }

  // Get current configuration
  const skillConfig = await getSkillConfig();

  // Extract delivery info from context if available
  if (context && context.channel && !skillConfig.delivery.channel) {
    skillConfig.delivery.channel = context.channel;
    skillConfig.delivery.chatId = context.chatId || context.userId;
  }

  // Generate route ID
  const routeId = generateRouteId(origin, destination);

  // Get or create route config
  const isNewRoute = !skillConfig.routes[routeId];

  const schedule = check_time
    ? parseTimeToCron(check_time, timezone || skillConfig.globalDefaults.timezone)
    : skillConfig.globalDefaults.schedule;

  const routeConfig = {
    id: routeId,
    origin: originValidation.code,
    destination: destValidation.code,
    dateRange: date_range || 'flexible',
    monitoring: {
      enabled: true,
      cronJobId: `travel-planner-${routeId}`,
      schedule,
      timezone: timezone || skillConfig.globalDefaults.timezone
    },
    preferences: {
      priceDropThreshold: price_drop_threshold || skillConfig.globalDefaults.priceDropThreshold,
      maxStops: 1
    },
    createdAt: isNewRoute ? new Date().toISOString() : (skillConfig.routes[routeId]?.createdAt || new Date().toISOString())
  };

  skillConfig.routes[routeId] = routeConfig;

  // Save configuration
  await updateSkillConfig(skillConfig);

  // TODO: Create cron job using OpenClaw's cron.add tool
  // This would need to be implemented once we know the exact OpenClaw API
  // For now, just save the config

  // Format response
  const totalRoutes = Object.keys(skillConfig.routes).length;
  return formatter.formatSetupConfirmation(routeConfig, totalRoutes);
}

/**
 * Tool: check_flight_price
 */
async function checkFlightPrice(params, context) {
  const { origin, destination, date, flexible_dates, return_date } = params;

  // Validate inputs
  const originValidation = scraper.validateLocation(origin);
  if (!originValidation.valid) {
    return formatter.formatError('INVALID_AIRPORT', { code: origin });
  }

  const destValidation = scraper.validateLocation(destination);
  if (!destValidation.valid) {
    return formatter.formatError('INVALID_AIRPORT', { code: destination });
  }

  // Mock data for round-trip or one-way flights
  if (!context || !context.browser) {
    const mockFlights = {
      flights: [
        { price: 120, airline: 'LOT', departure: '06:30', arrival: '08:15', stops: 0, currency: '€', travelDate: 'March 10, 2026' },
        { price: 150, airline: 'Lufthansa', departure: '10:00', arrival: '11:45', stops: 0, currency: '€', travelDate: 'March 10, 2026' },
        { price: 99, airline: 'Ryanair', departure: '14:20', arrival: '16:05', stops: 0, currency: '€', travelDate: 'March 10, 2026' }
      ]
    };

    if (return_date) {
      // Mock round-trip data (matching formatRoundTripResult expectations)
      mockFlights.roundTrip = true;
      mockFlights.origin = originValidation.code;
      mockFlights.destination = destValidation.code;
      mockFlights.departDate = date;
      mockFlights.returnDate = return_date;
      mockFlights.currency = '€';
      mockFlights.flights = [
        {
          price: 230,
          airline: 'LOT',
          stops: 0,
          outbound: {
            price: 120,
            airline: 'LOT',
            departure: '06:30',
            arrival: '08:15',
            stops: 0,
            travelDate: date
          },
          inbound: {
            price: 110,
            airline: 'LOT',
            departure: '18:00',
            arrival: '19:45',
            stops: 0,
            travelDate: return_date
          }
        }
      ];
    }

    // Check if this route is being monitored
    const routeId = generateRouteId(origin, destination);
    const skillConfig = await getSkillConfig();
    const isMonitored = skillConfig.routes[routeId]?.monitoring?.enabled;

    // Format response: round-trip or one-way
    if (mockFlights.roundTrip) {
      return formatter.formatRoundTripResult(mockFlights, !isMonitored);
    }

    return formatter.formatPriceCheckResult(
      mockFlights.flights,
      originValidation.code,
      destValidation.code,
      !isMonitored
    );
  }

  try {
    // Scrape flight prices (pass return_date for round-trip if provided)
    const result = await scraper.scrapeFlightPrices(
      context.browser,
      originValidation.code,
      destValidation.code,
      date,
      return_date || null
    );

    if (!result.success || result.flights.length === 0) {
      return formatter.formatError('NO_FLIGHTS');
    }

    // Check if this route is being monitored
    const routeId = generateRouteId(origin, destination);
    const skillConfig = await getSkillConfig();
    const isMonitored = skillConfig.routes[routeId]?.monitoring?.enabled;

    // Format response: round-trip or one-way
    if (result.roundTrip) {
      return formatter.formatRoundTripResult(result, !isMonitored);
    }

    return formatter.formatPriceCheckResult(
      result.flights,
      originValidation.code,
      destValidation.code,
      !isMonitored
    );
  } catch (error) {
    console.error('Error checking flight prices:', error);
    return formatter.formatError('SERVICE_UNAVAILABLE');
  }
}

/**
 * Tool: get_price_history
 */
async function getPriceHistory(params) {
  const { route_id, days } = params;

  try {
    const history = await priceTracker.getPriceHistory(route_id, days || 30);

    if (!history || history.history.length === 0) {
      return `No price history available for route ${route_id}. ` +
             "This route hasn't been checked yet, or monitoring hasn't been set up.";
    }

    const { origin, destination, stats } = history;
    const currentPrice = history.history.length > 0
      ? history.history[history.history.length - 1].bestPrice
      : null;

    return formatter.formatStatusUpdate(origin, destination, currentPrice, stats);
  } catch (error) {
    console.error('Error getting price history:', error);
    return formatter.formatError('SERVICE_UNAVAILABLE');
  }
}

/**
 * Tool: list_monitoring
 */
async function listMonitoring() {
  try {
    const skillConfig = await getSkillConfig();
    return formatter.formatRouteList(skillConfig.routes);
  } catch (error) {
    console.error('Error listing monitoring:', error);
    return formatter.formatError('SERVICE_UNAVAILABLE');
  }
}

/**
 * Tool: disable_route_monitoring
 */
async function disableRouteMonitoring(params) {
  const { route_id } = params;

  try {
    const skillConfig = await getSkillConfig();

    // Find the route (support both ID and natural description)
    let routeToRemove = null;
    let routeKey = null;

    if (skillConfig.routes[route_id]) {
      routeToRemove = skillConfig.routes[route_id];
      routeKey = route_id;
    } else {
      // Try to match by description
      for (const [key, route] of Object.entries(skillConfig.routes)) {
        if (route_id.toLowerCase().includes(route.origin.toLowerCase()) ||
            route_id.toLowerCase().includes(route.destination.toLowerCase())) {
          routeToRemove = route;
          routeKey = key;
          break;
        }
      }
    }

    if (!routeToRemove) {
      return `I couldn't find a route matching "${route_id}". Type '/travel-planner list' to see all monitored routes.`;
    }

    // Remove the route
    delete skillConfig.routes[routeKey];
    await updateSkillConfig(skillConfig);

    // TODO: Remove cron job using OpenClaw's cron.remove tool

    // Delete price history
    await priceTracker.deletePriceHistory(routeKey);

    const remainingCount = Object.keys(skillConfig.routes).length;
    return formatter.formatRouteDisabled(routeKey, remainingCount);
  } catch (error) {
    console.error('Error disabling route monitoring:', error);
    return formatter.formatError('SERVICE_UNAVAILABLE');
  }
}

/**
 * Tool: stop_all_monitoring
 */
async function stopAllMonitoring() {
  try {
    const skillConfig = await getSkillConfig();
    const routeCount = Object.keys(skillConfig.routes).length;

    if (routeCount === 0) {
      return "You don't have any active monitoring to stop.";
    }

    // TODO: Remove all cron jobs using OpenClaw's cron.remove tool

    // Clear all routes
    const routeIds = Object.keys(skillConfig.routes);
    skillConfig.routes = {};
    await updateSkillConfig(skillConfig);

    // Delete all price history files
    for (const routeId of routeIds) {
      await priceTracker.deletePriceHistory(routeId);
    }

    return `✅ Stopped monitoring all ${routeCount} route${routeCount > 1 ? 's' : ''}.\n\n` +
           "All price history has been cleared. You can set up new monitoring anytime!";
  } catch (error) {
    console.error('Error stopping all monitoring:', error);
    return formatter.formatError('SERVICE_UNAVAILABLE');
  }
}

/**
 * Tool: update_route_monitoring
 */
async function updateRouteMonitoring(params) {
  const { route_id, check_time, timezone, price_drop_threshold, date_range } = params;

  try {
    const skillConfig = await getSkillConfig();

    if (!skillConfig.routes[route_id]) {
      return `Route ${route_id} is not being monitored. Use '/travel-planner list' to see all routes.`;
    }

    const route = skillConfig.routes[route_id];

    // Update fields
    if (check_time) {
      route.monitoring.schedule = parseTimeToCron(check_time, timezone || route.monitoring.timezone);
    }

    if (timezone) {
      route.monitoring.timezone = timezone;
    }

    if (price_drop_threshold) {
      route.preferences.priceDropThreshold = price_drop_threshold;
    }

    if (date_range) {
      route.dateRange = date_range;
    }

    await updateSkillConfig(skillConfig);

    // TODO: Update cron job using OpenClaw's cron.update tool

    return `✅ Updated monitoring for ${route.origin} → ${route.destination}\n\n` +
           `Daily checks: ${formatter.parseScheduleToTime(route.monitoring.schedule)} ${formatter.formatTimezone(route.monitoring.timezone)}\n` +
           `Alert threshold: ${route.preferences.priceDropThreshold}% price drop\n` +
           `Date range: ${route.dateRange}`;
  } catch (error) {
    console.error('Error updating route monitoring:', error);
    return formatter.formatError('SERVICE_UNAVAILABLE');
  }
}

/**
 * Tool: get_monitoring_status
 */
async function getMonitoringStatus() {
  try {
    const skillConfig = await getSkillConfig();
    const routes = Object.values(skillConfig.routes);

    if (routes.length === 0) {
      return "You're not monitoring any flight routes yet.\n\n" +
             "To start monitoring, just ask me like:\n" +
             '"Monitor flights from New York to Paris"';
    }

    let message = "📊 Flight Monitoring Status\n\n";

    for (const route of routes) {
      message += `✈️ ${route.origin} → ${route.destination}\n`;
      message += `   📅 ${route.dateRange}\n`;

      const time = formatter.parseScheduleToTime(route.monitoring.schedule);
      const tz = formatter.formatTimezone(route.monitoring.timezone);
      message += `   ⏰ Daily at ${time} ${tz}\n`;
      message += `   🎯 Alert at ${route.preferences.priceDropThreshold}% drop\n\n`;
    }

    message += `Total routes: ${routes.length}`;

    return message;
  } catch (error) {
    console.error('Error getting monitoring status:', error);
    return formatter.formatError('SERVICE_UNAVAILABLE');
  }
}

/**
 * Tool: get_best_travel_times
 */
async function getBestTravelTimes(params) {
  const { route_id } = params;

  try {
    const analysis = await priceTracker.analyzeBestTimeRanges(route_id);

    if (!analysis) {
      return `No price history available for route ${route_id}. ` +
             "I need at least a few days of monitoring data to suggest the best travel times.";
    }

    return formatter.formatBestTimeRanges(analysis);
  } catch (error) {
    console.error('Error analyzing best travel times:', error);
    return formatter.formatError('SERVICE_UNAVAILABLE');
  }
}

/**
 * Recreate cron jobs for all monitored routes on skill startup
 */
async function setupCronJobs() {
  try {
    const skillConfig = await getSkillConfig();
    const routes = skillConfig.routes || {};

    if (Object.keys(routes).length === 0) {
      console.log('No monitored routes found. Skipping cron job setup.');
      return;
    }

    console.log(`Setting up cron jobs for ${Object.keys(routes).length} monitored routes...`);

    for (const [routeId, route] of Object.entries(routes)) {
      if (!route.monitoring?.enabled) {
        console.log(`Route ${routeId} is disabled. Skipping.`);
        continue;
      }

      const cronJobId = `travel-planner-${routeId}`;
      const schedule = route.monitoring.schedule;
      const timezone = route.monitoring.timezone || 'UTC';

      // Check if the cron job already exists
      try {
        const cronJobs = await exec({ command: `openclaw cron list` });
        const cronJobExists = cronJobs.output.includes(cronJobId);

        if (cronJobExists) {
          console.log(`Cron job ${cronJobId} already exists. Skipping.`);
          continue;
        }
      } catch (error) {
        console.error(`Failed to check existing cron jobs: ${error.message}`);
      }

      // Recreate the cron job
      try {
        const command = `
          cd ${process.env.OPENCLAW_HOME || '~/.openclaw'}/skills/travel-planner && 
          node -e "
            const skill = require('./index.js');
            (async () => {
              const tool = skill.tools.find(t => t.name === 'check_flight_price');
              await tool.handler({
                origin: '${route.origin}',
                destination: '${route.destination}',
                date: '${route.dateRange || 'flexible'}',
                flexible_dates: true
              }, {
                channel: '${skillConfig.delivery?.channel || 'telegram'}',
                chatId: '${skillConfig.delivery?.chatId || ''}',
                browser: true
              });
            })();
          "
        `;

        await exec({
          command: `openclaw cron add --id "${cronJobId}" --schedule "${schedule}" --timezone "${timezone}" --command '${command.trim()}'`
        });

        console.log(`Recreated cron job ${cronJobId} for route ${routeId}`);
      } catch (error) {
        console.error(`Failed to recreate cron job for route ${routeId}: ${error.message}`);
      }
    }
  } catch (error) {
    console.error('Failed to setup cron jobs:', error);
  }
}

/**
 * User-invocable handler: Parse command-line arguments
 */
function parseUserCommand(args) {
  if (!args || args.trim() === '' || args === 'list') {
    return { command: 'list' };
  }

  // Parse "DUS to WAW next Friday returning March 20"
  // First try to split on "returning" / "return" to extract return date
  const returnSplit = args.split(/\s+(?:returning|return)\s+/i);
  const mainPart = returnSplit[0];
  const returnDate = returnSplit.length > 1 ? returnSplit[1].trim() : null;

  const toMatch = mainPart.match(/(.+?)\s+to\s+(.+?)(?:\s+(.+))?$/i);

  if (toMatch) {
    return {
      command: 'check',
      origin: toMatch[1].trim(),
      destination: toMatch[2].trim(),
      date: toMatch[3] ? toMatch[3].trim() : null,
      return_date: returnDate
    };
  }

  return { command: 'help' };
}

/**
 * Main user-invocable handler
 */
async function handleUserInvocation(args, context) {
  const parsed = parseUserCommand(args);

  if (parsed.command === 'list') {
    return await listMonitoring();
  }

  if (parsed.command === 'check') {
    return await checkFlightPrice({
      origin: parsed.origin,
      destination: parsed.destination,
      date: parsed.date,
      return_date: parsed.return_date || null
    }, context);
  }

  // Help/interactive prompt
  return "I'll help you check flight prices!\n\n" +
         "Usage: /travel-planner <origin> to <destination> [date] [returning <date>]\n\n" +
         "Examples:\n" +
         "• /travel-planner DUS to WAW next Friday\n" +
         "• /travel-planner NYC to Paris March 10 returning March 17\n" +
         "• /travel-planner list (show monitored routes)\n\n" +
         'To set up monitoring, ask: "Monitor flights from [origin] to [destination]"\n' +
         'To find cheapest weeks, ask: "When is the cheapest time to fly DUS to WAW?"';
}

// Call setupCronJobs on skill load
setupCronJobs().catch(console.error);

// Export tools for OpenClaw
module.exports = {
  // User-invocable handler
  handleUserInvocation,

  // Tool definitions
  tools: [
    {
      name: 'setup_flight_monitoring',
      description: 'Set up automated flight price monitoring between two cities',
      parameters: {
        type: 'object',
        properties: {
          origin: {
            type: 'string',
            description: 'Origin city or airport code (e.g., "DUS", "NYC", "New York")'
          },
          destination: {
            type: 'string',
            description: 'Destination city or airport code (e.g., "WAW", "Paris")'
          },
          date_range: {
            type: 'string',
            description: 'Date flexibility (e.g., "any day in March 2026", "next Friday", "flexible")'
          },
          check_time: {
            type: 'string',
            description: 'Time to check daily in HH:MM format or natural language (e.g., "7:00 AM", "14:30")'
          },
          timezone: {
            type: 'string',
            description: 'IANA timezone (e.g., "Europe/Berlin", "America/New_York")'
          },
          price_drop_threshold: {
            type: 'number',
            description: 'Percentage drop to trigger alert (default: 15)'
          }
        },
        required: ['origin', 'destination']
      },
      handler: setupFlightMonitoring
    },
    {
      name: 'check_flight_price',
      description: 'Check current flight prices for a route. Supports one-way and round-trip searches (provide return_date for round-trip).',
      parameters: {
        type: 'object',
        properties: {
          origin: {
            type: 'string',
            description: 'Origin city or airport code'
          },
          destination: {
            type: 'string',
            description: 'Destination city or airport code'
          },
          date: {
            type: 'string',
            description: 'Travel date in natural language (e.g., "next Friday", "March 15")'
          },
          flexible_dates: {
            type: 'boolean',
            description: 'Check nearby dates for better prices (default: true)'
          },
          return_date: {
            type: 'string',
            description: 'Return date for round-trip'
          }
        },
        required: ['origin', 'destination']
      },
      handler: checkFlightPrice
    },
    {
      name: 'get_price_history',
      description: 'Get historical price data and trends for a route',
      parameters: {
        type: 'object',
        properties: {
          route_id: {
            type: 'string',
            description: 'Route identifier (e.g., "DUS-WAW")'
          },
          days: {
            type: 'number',
            description: 'Number of days to retrieve (default: 30)'
          }
        },
        required: ['route_id']
      },
      handler: getPriceHistory
    },
    {
      name: 'list_monitoring',
      description: 'List all routes currently being monitored',
      parameters: {
        type: 'object',
        properties: {}
      },
      handler: listMonitoring
    },
    {
      name: 'disable_route_monitoring',
      description: 'Stop monitoring a specific route',
      parameters: {
        type: 'object',
        properties: {
          route_id: {
            type: 'string',
            description: 'Route identifier (e.g., "DUS-WAW") or natural description'
          }
        },
        required: ['route_id']
      },
      handler: disableRouteMonitoring
    },
    {
      name: 'stop_all_monitoring',
      description: 'Stop all flight price monitoring',
      parameters: {
        type: 'object',
        properties: {}
      },
      handler: stopAllMonitoring
    },
    {
      name: 'update_route_monitoring',
      description: 'Update settings for a specific monitored route',
      parameters: {
        type: 'object',
        properties: {
          route_id: {
            type: 'string',
            description: 'Route identifier (e.g., "DUS-WAW")'
          },
          check_time: {
            type: 'string',
            description: 'New check time'
          },
          timezone: {
            type: 'string',
            description: 'New timezone'
          },
          price_drop_threshold: {
            type: 'number',
            description: 'New threshold percentage'
          },
          date_range: {
            type: 'string',
            description: 'New date range'
          }
        },
        required: ['route_id']
      },
      handler: updateRouteMonitoring
    },
    {
      name: 'get_monitoring_status',
      description: 'Get overview of all monitoring activity',
      parameters: {
        type: 'object',
        properties: {}
      },
      handler: getMonitoringStatus
    },
    {
      name: 'get_best_travel_times',
      description: 'Analyze price history to suggest the cheapest weeks to travel for a monitored route',
      parameters: {
        type: 'object',
        properties: {
          route_id: {
            type: 'string',
            description: 'Route identifier (e.g., "DUS-WAW")'
          }
        },
        required: ['route_id']
      },
      handler: getBestTravelTimes
    }
  ]
};
