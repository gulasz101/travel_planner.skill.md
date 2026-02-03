/**
 * Price tracking and history management
 * Stores price data per route and analyzes for deals
 */

const fs = require('fs/promises');
const path = require('path');

/**
 * Get the storage directory path
 */
function getStorageDir() {
  // Check if running in OpenClaw environment
  const openclawHome = process.env.OPENCLAW_HOME || process.env.HOME + '/.openclaw';
  const skillPath = path.join(openclawHome, 'skills', 'travel-planner', 'storage');

  // Fallback to local storage for development
  const localPath = path.join(__dirname, 'storage');

  // Use OpenClaw path if it exists, otherwise local
  return skillPath;
}

/**
 * Get price history file path for a specific route
 */
function getPriceHistoryPath(routeId) {
  return path.join(getStorageDir(), `price-history-${routeId}.json`);
}

/**
 * Load price history for a route
 */
async function loadPriceHistory(routeId) {
  const filePath = getPriceHistoryPath(routeId);

  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // File doesn't exist yet, return empty history
    if (error.code === 'ENOENT') {
      return {
        routeId,
        origin: '',
        destination: '',
        dateRange: 'flexible',
        history: [],
        stats: {}
      };
    }
    throw error;
  }
}

/**
 * Save price history for a route
 */
async function savePriceHistory(routeId, historyData) {
  const filePath = getPriceHistoryPath(routeId);

  // Ensure storage directory exists
  const storageDir = getStorageDir();
  try {
    await fs.mkdir(storageDir, { recursive: true });
  } catch (error) {
    // Directory might already exist, ignore
  }

  await fs.writeFile(filePath, JSON.stringify(historyData, null, 2), 'utf-8');
}

/**
 * Add a new price check to history
 */
async function recordPriceCheck(routeId, origin, destination, dateRange, priceData) {
  const history = await loadPriceHistory(routeId);

  // Initialize if this is the first check
  if (!history.origin) {
    history.origin = origin;
    history.destination = destination;
    history.dateRange = dateRange || 'flexible';
  }

  // Create price check entry
  const checkEntry = {
    checkDate: new Date().toISOString(),
    prices: priceData.flights || [],
    bestPrice: priceData.bestPrice,
    bestTravelDate: priceData.bestTravelDate,
    currency: priceData.currency || 'USD'
  };

  history.history.push(checkEntry);

  // Keep only last 90 days
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  history.history = history.history.filter(entry => {
    const entryDate = new Date(entry.checkDate);
    return entryDate >= ninetyDaysAgo;
  });

  // Update statistics
  history.stats = calculateStats(history.history);

  await savePriceHistory(routeId, history);

  return history;
}

/**
 * Calculate statistics from price history
 */
function calculateStats(history) {
  if (!history || history.length === 0) {
    return {
      avg7day: null,
      avg30day: null,
      min30day: null,
      max30day: null,
      lastCheck: null
    };
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Filter by time period
  const last7Days = history.filter(entry => new Date(entry.checkDate) >= sevenDaysAgo);
  const last30Days = history.filter(entry => new Date(entry.checkDate) >= thirtyDaysAgo);

  // Calculate averages
  const avg7day = calculateAverage(last7Days.map(e => e.bestPrice));
  const avg30day = calculateAverage(last30Days.map(e => e.bestPrice));

  // Calculate min/max
  const prices30day = last30Days.map(e => e.bestPrice).filter(p => p != null);
  const min30day = prices30day.length > 0 ? Math.min(...prices30day) : null;
  const max30day = prices30day.length > 0 ? Math.max(...prices30day) : null;

  // Last check time
  const lastCheck = history.length > 0 ? history[history.length - 1].checkDate : null;

  return {
    avg7day: avg7day ? Math.round(avg7day) : null,
    avg30day: avg30day ? Math.round(avg30day) : null,
    min30day,
    max30day,
    lastCheck
  };
}

/**
 * Helper: Calculate average of array of numbers
 */
function calculateAverage(numbers) {
  const valid = numbers.filter(n => n != null && !isNaN(n));
  if (valid.length === 0) return null;

  const sum = valid.reduce((acc, n) => acc + n, 0);
  return sum / valid.length;
}

/**
 * Analyze if current price is a good deal
 */
function analyzeDeal(currentPrice, stats, threshold = 15) {
  if (!currentPrice || !stats) {
    return {
      isDeal: false,
      reason: 'insufficient_data',
      percentageDrop: null,
      isLowestIn30Days: false
    };
  }

  // Check if this is the lowest price in 30 days
  const isLowestIn30Days = stats.min30day != null && currentPrice <= stats.min30day;

  // Calculate percentage drop from 7-day average
  let percentageDrop = null;
  if (stats.avg7day != null) {
    percentageDrop = Math.round(((stats.avg7day - currentPrice) / stats.avg7day) * 100);
  }

  // Determine if it's a deal
  const isDeal = isLowestIn30Days || (percentageDrop != null && percentageDrop >= threshold);

  let reason = null;
  if (isDeal) {
    if (isLowestIn30Days) {
      reason = '30_day_low';
    } else if (percentageDrop >= threshold) {
      reason = 'significant_drop';
    }
  }

  return {
    isDeal,
    reason,
    percentageDrop,
    isLowestIn30Days,
    avgPrice: stats.avg7day
  };
}

/**
 * Get price history for display
 */
async function getPriceHistory(routeId, days = 30) {
  const history = await loadPriceHistory(routeId);

  if (!history.history || history.history.length === 0) {
    return null;
  }

  // Filter to requested number of days
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const filtered = history.history.filter(entry => {
    const entryDate = new Date(entry.checkDate);
    return entryDate >= cutoffDate;
  });

  return {
    routeId: history.routeId,
    origin: history.origin,
    destination: history.destination,
    dateRange: history.dateRange,
    history: filtered,
    stats: history.stats
  };
}

/**
 * Delete price history for a route
 */
async function deletePriceHistory(routeId) {
  const filePath = getPriceHistoryPath(routeId);

  try {
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, that's okay
      return true;
    }
    throw error;
  }
}

module.exports = {
  loadPriceHistory,
  savePriceHistory,
  recordPriceCheck,
  calculateStats,
  analyzeDeal,
  getPriceHistory,
  deletePriceHistory,
  getStorageDir,
  getPriceHistoryPath
};
