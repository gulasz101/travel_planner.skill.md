#!/usr/bin/env node
/**
 * Travel Planner Skill Demo
 *
 * This script demonstrates the skill's functionality without requiring
 * full OpenClaw integration. Run: node demo.js
 */

const skill = require('./index.js');

// Mock browser context for demo
const mockBrowser = {
  navigate: async (url) => console.log(`  → Navigating to: ${url}`),
  wait: async (ms) => console.log(`  → Waiting ${ms}ms...`),
  snapshot: async () => ({ html: '<mock-page>' }),
  evaluate: async () => []  // Return empty flights for demo
};

async function runDemo() {
  console.log('\n🚀 Travel Planner Skill Demo\n');
  console.log('=' .repeat(60));

  // Demo 1: List monitoring (empty state)
  console.log('\n📋 Demo 1: List Monitoring (Empty State)');
  console.log('-'.repeat(60));
  try {
    const listTool = skill.tools.find(t => t.name === 'list_monitoring');
    const result = await listTool.handler();
    console.log(result);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Demo 2: Setup monitoring
  console.log('\n📋 Demo 2: Setup Flight Monitoring');
  console.log('-'.repeat(60));
  try {
    const setupTool = skill.tools.find(t => t.name === 'setup_flight_monitoring');
    const result = await setupTool.handler({
      origin: 'DUS',
      destination: 'WAW',
      date_range: 'flexible',
      check_time: '7:00 AM',
      timezone: 'Europe/Berlin',
      price_drop_threshold: 15
    }, {
      channel: 'telegram',
      chatId: 'demo-user-123'
    });
    console.log(result);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Demo 3: List monitoring (with routes)
  console.log('\n📋 Demo 3: List Monitoring (With Routes)');
  console.log('-'.repeat(60));
  try {
    const listTool = skill.tools.find(t => t.name === 'list_monitoring');
    const result = await listTool.handler();
    console.log(result);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Demo 4: Add another route
  console.log('\n📋 Demo 4: Add Second Route');
  console.log('-'.repeat(60));
  try {
    const setupTool = skill.tools.find(t => t.name === 'setup_flight_monitoring');
    const result = await setupTool.handler({
      origin: 'NYC',
      destination: 'PAR',
      date_range: 'any day in March 2026',
      price_drop_threshold: 20
    }, {
      channel: 'telegram',
      chatId: 'demo-user-123'
    });
    console.log(result);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Demo 5: Get monitoring status
  console.log('\n📋 Demo 5: Get Monitoring Status');
  console.log('-'.repeat(60));
  try {
    const statusTool = skill.tools.find(t => t.name === 'get_monitoring_status');
    const result = await statusTool.handler();
    console.log(result);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Demo 6: Update route settings
  console.log('\n📋 Demo 6: Update Route Settings');
  console.log('-'.repeat(60));
  try {
    const updateTool = skill.tools.find(t => t.name === 'update_route_monitoring');
    const result = await updateTool.handler({
      route_id: 'NYC-PAR',
      check_time: '9:00 AM',
      price_drop_threshold: 10
    });
    console.log(result);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Demo 7: Check flight prices (mock)
  console.log('\n📋 Demo 7: Check Flight Prices (Mock)');
  console.log('-'.repeat(60));
  console.log('Note: This requires browser tool, showing what would happen:');
  try {
    const checkTool = skill.tools.find(t => t.name === 'check_flight_price');
    const result = await checkTool.handler({
      origin: 'DUS',
      destination: 'WAW',
      date: 'next Friday'
    }, {
      browser: mockBrowser
    });
    console.log(result);
  } catch (error) {
    console.error('Expected error (no browser):', error.message);
  }

  // Demo 8: Disable route
  console.log('\n📋 Demo 8: Disable Route');
  console.log('-'.repeat(60));
  try {
    const disableTool = skill.tools.find(t => t.name === 'disable_route_monitoring');
    const result = await disableTool.handler({
      route_id: 'DUS-WAW'
    });
    console.log(result);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Demo 9: Stop all monitoring
  console.log('\n📋 Demo 9: Stop All Monitoring');
  console.log('-'.repeat(60));
  try {
    const stopTool = skill.tools.find(t => t.name === 'stop_all_monitoring');
    const result = await stopTool.handler();
    console.log(result);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('✅ Demo Complete!');
  console.log('\nAll 8 tools demonstrated:');
  skill.tools.forEach((tool, i) => {
    console.log(`  ${i + 1}. ${tool.name}`);
  });

  console.log('\n📝 Note: Browser scraping was mocked in this demo.');
  console.log('   Real usage requires OpenClaw\'s browser tool.');
  console.log('\n🚀 To use with OpenClaw:');
  console.log('   - Deploy to ~/.openclaw/skills/travel-planner');
  console.log('   - Restart OpenClaw gateway');
  console.log('   - Ask: "Monitor flights from DUS to WAW"');
  console.log('');
}

// Run the demo
runDemo().catch(error => {
  console.error('\n❌ Demo failed:', error);
  process.exit(1);
});
