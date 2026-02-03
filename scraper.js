/**
 * Flight price scraper using OpenClaw's browser tool
 * Scrapes Google Flights for real-time price data
 */

/**
 * Parse natural language date to specific date or date range
 */
function parseDate(dateInput) {
  if (!dateInput) {
    // Default to flexible search (next 7 days)
    return { type: 'flexible', dates: [] };
  }

  const input = dateInput.toLowerCase().trim();
  const today = new Date();

  // Handle "next Friday", "next Monday", etc.
  const nextDayMatch = input.match(/next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i);
  if (nextDayMatch) {
    const targetDay = nextDayMatch[1];
    const date = getNextDayOfWeek(today, targetDay);
    return { type: 'specific', dates: [formatDate(date)] };
  }

  // Handle "Friday", "Monday", etc. (assume next occurrence)
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  if (dayNames.includes(input)) {
    const date = getNextDayOfWeek(today, input);
    return { type: 'specific', dates: [formatDate(date)] };
  }

  // Handle "any day in March", "in March 2026", etc.
  const monthMatch = input.match(/(january|february|march|april|may|june|july|august|september|october|november|december)\s*(\d{4})?/i);
  if (monthMatch) {
    const monthName = monthMatch[1];
    const year = monthMatch[2] ? parseInt(monthMatch[2]) : today.getFullYear();
    const dates = getDatesInMonth(monthName, year);
    return { type: 'range', dates, description: `any day in ${monthName} ${year}` };
  }

  // Handle "flexible"
  if (input.includes('flexible') || input.includes('any day')) {
    return { type: 'flexible', dates: [] };
  }

  // Handle "weekend" (next Friday to Sunday)
  if (input.includes('weekend')) {
    const friday = getNextDayOfWeek(today, 'friday');
    const saturday = new Date(friday);
    saturday.setDate(saturday.getDate() + 1);
    const sunday = new Date(saturday);
    sunday.setDate(sunday.getDate() + 1);

    return {
      type: 'range',
      dates: [formatDate(friday), formatDate(saturday), formatDate(sunday)],
      description: 'next weekend'
    };
  }

  // Handle specific date formats like "March 15", "Feb 15", "2026-03-15"
  const specificDateMatch = input.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (specificDateMatch) {
    const [, month, day, year] = specificDateMatch;
    const fullYear = year.length === 2 ? `20${year}` : year;
    const date = new Date(`${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
    return { type: 'specific', dates: [formatDate(date)] };
  }

  // Default to flexible if we can't parse
  return { type: 'flexible', dates: [] };
}

/**
 * Get next occurrence of a day of the week
 */
function getNextDayOfWeek(fromDate, dayName) {
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const targetDay = dayNames.indexOf(dayName.toLowerCase());

  const resultDate = new Date(fromDate);
  const currentDay = resultDate.getDay();

  let daysToAdd = targetDay - currentDay;
  if (daysToAdd <= 0) {
    daysToAdd += 7; // Move to next week
  }

  resultDate.setDate(resultDate.getDate() + daysToAdd);
  return resultDate;
}

/**
 * Get all dates in a given month
 */
function getDatesInMonth(monthName, year) {
  const months = {
    january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
    july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
  };

  const monthIndex = months[monthName.toLowerCase()];
  const firstDay = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0);

  const dates = [];
  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    dates.push(formatDate(new Date(d)));
  }

  return dates;
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Build Google Flights URL
 */
function buildGoogleFlightsUrl(origin, destination, date) {
  const baseUrl = 'https://www.google.com/travel/flights';

  // Normalize airport codes
  const fromCode = origin.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 3);
  const toCode = destination.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 3);

  if (date) {
    // Specific date search
    return `${baseUrl}?q=Flights%20from%20${fromCode}%20to%20${toCode}%20on%20${date}`;
  } else {
    // Flexible date search
    return `${baseUrl}?q=Flights%20from%20${fromCode}%20to%20${toCode}`;
  }
}

/**
 * Scrape flight prices from Google Flights
 * This function expects to be called with OpenClaw's browser tool available in context
 */
async function scrapeFlightPrices(browserContext, origin, destination, dateInput = null) {
  const parsedDate = parseDate(dateInput);

  let allFlights = [];

  if (parsedDate.type === 'specific' && parsedDate.dates.length > 0) {
    // Single date search
    const date = parsedDate.dates[0];
    const flights = await scrapeSingleDate(browserContext, origin, destination, date);
    allFlights = flights;
  } else if (parsedDate.type === 'range' && parsedDate.dates.length > 0) {
    // Multiple dates - for now, just sample a few dates to avoid too many requests
    const sampled = sampleDates(parsedDate.dates, 5);

    for (const date of sampled) {
      const flights = await scrapeSingleDate(browserContext, origin, destination, date);
      allFlights.push(...flights.map(f => ({ ...f, travelDate: date })));
    }
  } else {
    // Flexible search - use Google Flights' default flexible search
    const flights = await scrapeSingleDate(browserContext, origin, destination, null);
    allFlights = flights;
  }

  if (allFlights.length === 0) {
    return {
      success: false,
      flights: [],
      bestPrice: null,
      bestTravelDate: null,
      currency: 'USD'
    };
  }

  // Find best price
  const sortedFlights = allFlights.sort((a, b) => a.price - b.price);
  const bestFlight = sortedFlights[0];

  return {
    success: true,
    flights: sortedFlights,
    bestPrice: bestFlight.price,
    bestTravelDate: bestFlight.travelDate || null,
    currency: bestFlight.currency || 'USD',
    origin,
    destination
  };
}

/**
 * Sample dates from a large array
 */
function sampleDates(dates, maxSamples) {
  if (dates.length <= maxSamples) {
    return dates;
  }

  const step = Math.floor(dates.length / maxSamples);
  const sampled = [];

  for (let i = 0; i < dates.length; i += step) {
    if (sampled.length >= maxSamples) break;
    sampled.push(dates[i]);
  }

  return sampled;
}

/**
 * Scrape flights for a single date
 */
async function scrapeSingleDate(browserContext, origin, destination, date) {
  const url = buildGoogleFlightsUrl(origin, destination, date);

  try {
    // Navigate to Google Flights
    await browserContext.navigate(url);

    // Wait for results to load
    await browserContext.wait(5000); // Wait 5 seconds for page to load

    // Get page snapshot to understand structure
    const snapshot = await browserContext.snapshot();

    // Use evaluate to extract flight data from the page
    const flights = await browserContext.evaluate(`
      (function() {
        const results = [];

        // Google Flights uses specific class names - these are examples and may need adjustment
        // This is a simplified extraction - real implementation would need to inspect actual page structure
        const flightCards = document.querySelectorAll('[role="listitem"]');

        flightCards.forEach(card => {
          try {
            // Extract price (look for currency and number)
            const priceText = card.textContent.match(/[$€£¥]\\s*([\\d,]+)/);
            if (!priceText) return;

            const price = parseInt(priceText[1].replace(/,/g, ''), 10);
            const currency = priceText[0][0] === '$' ? 'USD' : priceText[0][0] === '€' ? 'EUR' : 'USD';

            // Extract airline name
            const airlineElements = card.querySelectorAll('[aria-label*="Airline"]');
            const airline = airlineElements.length > 0 ? airlineElements[0].textContent.trim() : 'Unknown';

            // Extract number of stops
            let stops = 0;
            if (card.textContent.includes('Nonstop') || card.textContent.includes('Direct')) {
              stops = 0;
            } else if (card.textContent.includes('1 stop')) {
              stops = 1;
            } else if (card.textContent.includes('2 stop')) {
              stops = 2;
            }

            // Extract duration
            const durationMatch = card.textContent.match(/(\\d+)\\s*h\\s*(\\d+)?\\s*m/);
            const duration = durationMatch ? durationMatch[0] : null;

            results.push({
              price,
              currency,
              airline,
              stops,
              duration
            });
          } catch (e) {
            // Skip cards that fail to parse
          }
        });

        return results;
      })()
    `);

    return flights || [];
  } catch (error) {
    console.error('Error scraping Google Flights:', error);
    return [];
  }
}

/**
 * Validate airport code or city name
 */
function validateLocation(location) {
  if (!location || typeof location !== 'string') {
    return { valid: false, error: 'INVALID_INPUT' };
  }

  const cleaned = location.trim().toUpperCase();

  // Check if it's a 3-letter airport code
  if (/^[A-Z]{3}$/.test(cleaned)) {
    return { valid: true, code: cleaned, type: 'airport' };
  }

  // Check if it's a city name (at least 2 characters)
  if (cleaned.length >= 2 && /^[A-Z\s]+$/.test(cleaned)) {
    return { valid: true, code: cleaned, type: 'city' };
  }

  return { valid: false, error: 'INVALID_FORMAT' };
}

module.exports = {
  scrapeFlightPrices,
  parseDate,
  buildGoogleFlightsUrl,
  validateLocation,
  formatDate
};
