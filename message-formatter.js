/**
 * Message formatter for user-friendly responses
 * Channel-agnostic formatting that works with Telegram, WhatsApp, Signal, etc.
 */

/**
 * Format a price alert message when a good deal is found
 */
function formatPriceAlert(flightData, historicalContext) {
  const { origin, destination, bestPrice, bestTravelDate, airline, stops, duration, currency } = flightData;
  const { percentageDrop, isLowestIn30Days, avgPrice } = historicalContext;

  let message = "🎉 Great deal found!\n\n";
  message += `✈️ ${origin} → ${destination}\n`;
  message += `💰 ${currency}${bestPrice}`;

  if (percentageDrop) {
    message += ` (↓ ${percentageDrop}% from avg)`;
  }

  message += "\n";

  if (bestTravelDate) {
    message += `📅 ${bestTravelDate}\n`;
  }

  message += `🏢 ${airline}`;

  if (stops === 0) {
    message += " (non-stop)";
  } else if (stops === 1) {
    message += " (1 stop)";
  } else {
    message += ` (${stops} stops)`;
  }

  if (duration) {
    message += `, ${duration}`;
  }

  message += "\n\n";

  if (isLowestIn30Days) {
    message += "This is the lowest price in 30 days!";
  } else if (percentageDrop >= 20) {
    message += "This is a significant price drop!";
  }

  return message;
}

/**
 * Format a setup confirmation message
 */
function formatSetupConfirmation(routeConfig, totalRoutes) {
  const { origin, destination, dateRange, monitoring, preferences } = routeConfig;

  let message = "✈️ Flight monitoring is active!\n\n";
  message += `Route: ${origin} → ${destination}\n`;

  if (dateRange && dateRange !== 'flexible') {
    message += `Date range: ${dateRange}\n`;
  } else {
    message += `Date range: Flexible\n`;
  }

  // Parse schedule to human-readable time
  const time = parseScheduleToTime(monitoring.schedule);
  const tz = formatTimezone(monitoring.timezone);
  message += `Daily checks: ${time} ${tz}\n`;
  message += `Alert threshold: ${preferences.priceDropThreshold}% price drop\n\n`;

  if (totalRoutes > 1) {
    message += `You're now monitoring ${totalRoutes} routes!\n`;
  }

  message += "I'll check prices tomorrow morning!";

  return message;
}

/**
 * Format a price check result (one-time query)
 */
function formatPriceCheckResult(flights, origin, destination, includeMonitoringSuggestion = true) {
  if (!flights || flights.length === 0) {
    return `I couldn't find any flights from ${origin} to ${destination} right now. This could mean:\n\n` +
           "• No direct flights available\n" +
           "• The route doesn't exist\n" +
           "• The website is temporarily unavailable\n\n" +
           "Try checking with different airport codes or city names.";
  }

  let message = `✈️ Best prices from ${origin} to ${destination}:\n\n`;

  // Show top 3 flights
  const topFlights = flights.slice(0, 3);
  topFlights.forEach(flight => {
    message += `💰 ${flight.currency}${flight.price} - ${flight.airline}`;

    if (flight.stops === 0) {
      message += " (direct)";
    } else if (flight.stops === 1) {
      message += " (1 stop)";
    } else {
      message += ` (${flight.stops} stops)`;
    }

    if (flight.duration) {
      message += `, ${flight.duration}`;
    }

    if (flight.travelDate) {
      message += `\n   📅 ${flight.travelDate}`;
    }

    message += "\n";
  });

  if (includeMonitoringSuggestion) {
    message += `\nWould you like me to monitor this route and alert you when prices drop? ` +
               `Just ask me to "monitor flights from ${origin} to ${destination}".`;
  }

  return message;
}

/**
 * Format a list of all monitored routes
 */
function formatRouteList(routes) {
  if (!routes || Object.keys(routes).length === 0) {
    return "You're not monitoring any flight routes yet.\n\n" +
           "To start monitoring, just ask me like:\n" +
           '"Monitor flights from New York to Paris"';
  }

  let message = "📋 Active Flight Monitoring\n\n";

  const routeList = Object.values(routes);
  routeList.forEach((route, index) => {
    const num = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'][index] || `${index + 1}️⃣`;
    message += `${num} ${route.origin} → ${route.destination}\n`;

    if (route.dateRange && route.dateRange !== 'flexible') {
      message += `   📅 ${route.dateRange}\n`;
    } else {
      message += `   📅 Flexible dates\n`;
    }

    const time = parseScheduleToTime(route.monitoring.schedule);
    const tz = formatTimezone(route.monitoring.timezone);
    message += `   ⏰ Daily at ${time} ${tz}\n`;

    // Add current price info if available
    // This would come from the price history file
    message += "\n";
  });

  message += 'Type "disable monitoring for [route]" to stop tracking a specific route.';

  return message;
}

/**
 * Format a status update message
 */
function formatStatusUpdate(origin, destination, currentPrice, stats, currency = 'USD') {
  let message = `📊 Monitoring Status\n\n`;
  message += `Route: ${origin} → ${destination}\n`;

  if (currentPrice) {
    message += `Current price: ${currency}${currentPrice}\n`;
  }

  if (stats) {
    if (stats.avg7day) {
      message += `7-day average: ${currency}${stats.avg7day}\n`;
    }
    if (stats.min30day) {
      message += `30-day low: ${currency}${stats.min30day}\n`;
    }
    if (stats.lastCheck) {
      const lastCheck = formatTimeAgo(stats.lastCheck);
      message += `Last check: ${lastCheck}\n`;
    }
  }

  return message;
}

/**
 * Format a route disabled confirmation
 */
function formatRouteDisabled(routeId, remainingCount) {
  const [origin, dest] = routeId.split('-');

  let message = `✅ Stopped monitoring ${origin} → ${dest}\n\n`;

  if (remainingCount > 0) {
    message += `You still have ${remainingCount} active route${remainingCount > 1 ? 's' : ''} being monitored.\n`;
    message += "Type '/travel-planner list' to see all.";
  } else {
    message += "You're no longer monitoring any routes.";
  }

  return message;
}

/**
 * Format an error message in a user-friendly way
 */
function formatError(errorType, context = {}) {
  switch (errorType) {
    case 'INVALID_AIRPORT':
      return `I couldn't find an airport with code '${context.code}'. ` +
             "Could you try with a city name like 'New York' or a common airport code like 'JFK'?";

    case 'NO_FLIGHTS':
      return `I couldn't find any flights for this route right now. ` +
             "Would you like me to check routes with connections?";

    case 'PAGE_LOAD_FAILED':
      return "I couldn't load the flight search page right now. " +
             "I'll try again during the next scheduled check.";

    case 'INVALID_TIME':
      return "The time you specified doesn't look right. " +
             "Please use a format like '7:00 AM' or '14:30'.";

    case 'SERVICE_UNAVAILABLE':
      return "The flight search website is temporarily unavailable. " +
             "I'll keep trying automatically.";

    case 'INVALID_DATE':
      return `I couldn't understand the date '${context.date}'. ` +
             "Try formats like 'next Friday', 'March 15', or 'in 2 weeks'.";

    default:
      return "Something went wrong, but I'll keep trying. " +
             "If this keeps happening, please let me know!";
  }
}

/**
 * Helper: Parse cron schedule to human-readable time
 */
function parseScheduleToTime(cronSchedule) {
  // Parse "0 7 * * *" to "7:00 AM"
  const parts = cronSchedule.split(' ');
  if (parts.length < 2) return "7:00 AM";

  const minute = parts[0].padStart(2, '0');
  const hour = parseInt(parts[1], 10);

  if (hour === 0) return `12:${minute} AM`;
  if (hour < 12) return `${hour}:${minute} AM`;
  if (hour === 12) return `12:${minute} PM`;
  return `${hour - 12}:${minute} PM`;
}

/**
 * Helper: Format timezone abbreviation
 */
function formatTimezone(timezone) {
  const tzMap = {
    'Europe/Berlin': 'CET',
    'Europe/Warsaw': 'CET',
    'America/New_York': 'Eastern',
    'America/Los_Angeles': 'Pacific',
    'America/Chicago': 'Central',
    'UTC': 'UTC'
  };

  return tzMap[timezone] || timezone;
}

/**
 * Helper: Format timestamp to relative time
 */
function formatTimeAgo(timestamp) {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return "yesterday";
  return `${diffDays} days ago`;
}

/**
 * Format round-trip price check results
 */
function formatRoundTripResult(result, includeMonitoringSuggestion = true) {
  const { origin, destination, flights, departDate, returnDate, currency } = result;
  const curr = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency;

  if (!flights || flights.length === 0) {
    return `I couldn't find any round-trip flights from ${origin} to ${destination} ` +
           `for ${departDate} → ${returnDate}. Try different dates or check one-way options.`;
  }

  let message = `✈️ Round-trip prices ${origin} → ${destination}\n`;
  message += `📅 ${departDate} → ${returnDate}\n\n`;

  const topFlights = flights.slice(0, 3);
  topFlights.forEach((flight, i) => {
    message += `💰 ${curr}${flight.price} - ${flight.airline}`;

    if (flight.outbound && flight.inbound) {
      // Combined from separate legs
      const outStops = flight.outbound.stops === 0 ? 'direct' : `${flight.outbound.stops} stop${flight.outbound.stops > 1 ? 's' : ''}`;
      const inStops = flight.inbound.stops === 0 ? 'direct' : `${flight.inbound.stops} stop${flight.inbound.stops > 1 ? 's' : ''}`;
      message += `\n   ↗️ Outbound: ${curr}${flight.outbound.price} (${outStops}${flight.outbound.duration ? ', ' + flight.outbound.duration : ''})`;
      message += `\n   ↙️ Return:   ${curr}${flight.inbound.price} (${inStops}${flight.inbound.duration ? ', ' + flight.inbound.duration : ''})`;
    } else {
      // Google returned a combined price
      if (flight.stops === 0) {
        message += " (direct both ways)";
      } else {
        message += ` (${flight.stops} stop${flight.stops > 1 ? 's' : ''} total)`;
      }
      if (flight.duration) {
        message += `, ${flight.duration}`;
      }
    }

    message += "\n\n";
  });

  if (includeMonitoringSuggestion) {
    message += `Would you like me to monitor this route? ` +
               `Just ask me to "monitor flights from ${origin} to ${destination}".`;
  }

  return message;
}

/**
 * Format best time range suggestions from price history analysis
 */
function formatBestTimeRanges(analysis) {
  if (!analysis || !analysis.weeks || analysis.weeks.length === 0) {
    return "Not enough price history yet to suggest best travel times. " +
           "I'll need a few days of monitoring to build up data.";
  }

  const { origin, destination, currency, weeks } = analysis;
  const curr = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency;

  let message = `📊 Best times to fly ${origin} → ${destination}\n`;
  message += `(based on price history)\n\n`;

  const rank = ['🥇', '🥈', '🥉'];
  weeks.forEach((week, i) => {
    const label = rank[i] || `${i + 1}.`;
    message += `${label} ${formatDateRange(week.weekStart, week.weekEnd)}\n`;
    message += `   💰 Avg: ${curr}${week.avgPrice}  |  Best: ${curr}${week.bestPrice}\n`;
    if (i < weeks.length - 1) message += "\n";
  });

  const cheapest = weeks[0];
  const mostExpensive = weeks[weeks.length - 1];
  const saving = mostExpensive.avgPrice - cheapest.avgPrice;
  if (saving > 0 && weeks.length > 1) {
    const pct = Math.round((saving / mostExpensive.avgPrice) * 100);
    message += `\n💡 Flying during the cheapest window saves you ${curr}${saving} (${pct}%) compared to the most expensive week shown.`;
  }

  return message;
}

/**
 * Helper: Format a date range as human-readable string
 */
function formatDateRange(startStr, endStr) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const start = new Date(startStr + 'T00:00:00');
  const end = new Date(endStr + 'T00:00:00');

  const startMonth = months[start.getMonth()];
  const endMonth = months[end.getMonth()];
  const startDay = start.getDate();
  const endDay = end.getDate();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay}–${endDay}`;
  }
  return `${startMonth} ${startDay} – ${endMonth} ${endDay}`;
}

module.exports = {
  formatPriceAlert,
  formatSetupConfirmation,
  formatPriceCheckResult,
  formatRoundTripResult,
  formatBestTimeRanges,
  formatRouteList,
  formatStatusUpdate,
  formatRouteDisabled,
  formatError,
  parseScheduleToTime,
  formatTimezone,
  formatTimeAgo
};
