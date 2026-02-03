#!/bin/bash
set -e

echo "🚀 Setting up Travel Planner skill..."

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Create storage directory
echo "📁 Creating storage directory..."
mkdir -p storage

# Create OpenClaw config directory if it doesn't exist
echo "⚙️  Setting up OpenClaw config..."
mkdir -p ~/.openclaw/skills

# Initialize config file if it doesn't exist
if [ ! -f ~/.openclaw/openclaw.json ]; then
    echo '{}' > ~/.openclaw/openclaw.json
    chmod 644 ~/.openclaw/openclaw.json
    echo "✓ Created openclaw.json"
else
    echo "✓ openclaw.json already exists"
fi

# Check if OpenClaw is installed
if ! command -v openclaw &> /dev/null; then
    echo "⚠️  Warning: OpenClaw CLI not found in PATH"
    echo "   The skill will still work, but some features may be limited"
else
    OPENCLAW_VERSION=$(openclaw --version 2>/dev/null || echo "unknown")
    echo "✓ OpenClaw detected: $OPENCLAW_VERSION"
fi

# Ensure browser is running with the openclaw profile
echo ""
echo "🌐 Checking browser tool..."
if command -v openclaw &> /dev/null; then
    if openclaw browser --browser-profile openclaw status &> /dev/null; then
        echo "✓ Browser is running (profile: openclaw)"
    else
        echo "   Starting browser with openclaw profile..."
        openclaw browser --browser-profile openclaw start
        # Verify it came up
        if openclaw browser --browser-profile openclaw status &> /dev/null; then
            echo "✓ Browser started (profile: openclaw)"
        else
            echo "⚠️  Browser start failed — check OpenClaw logs"
        fi
    fi
else
    echo "⚠️  OpenClaw CLI not found — cannot start browser"
fi

echo ""
echo "✅ Travel Planner skill setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Copy this directory to: ~/.openclaw/skills/travel-planner"
echo "   2. Restart OpenClaw gateway: systemctl --user restart openclaw-gateway"
echo "   3. Test the skill: openclaw skills"
echo ""
echo "   Or run the demo: node demo.js"
