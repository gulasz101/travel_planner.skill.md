# Deployment Guide

## Quick Deployment to OpenClaw

### Step 1: Push to Remote Repository (if needed)

```bash
# If you have a remote repository configured
git push origin main
```

### Step 2: SSH to OpenClaw Instance

```bash
ssh openclaw@openclaw.local
```

### Step 3: Clone or Update Skill

**First time deployment:**
```bash
cd ~/.openclaw/skills
git clone <your-repository-url> travel-planner
```

**Updating existing deployment:**
```bash
cd ~/.openclaw/skills/travel-planner
git pull
```

### Step 4: Verify Files

```bash
cd ~/.openclaw/skills/travel-planner
ls -la
```

You should see:
- SKILL.md
- index.js
- scraper.js
- price-tracker.js
- message-formatter.js
- package.json
- storage/ directory
- README.md

### Step 5: Check Node.js Version

```bash
node --version
```

Should be v18.0.0 or higher.

### Step 6: Restart or Reload OpenClaw

The exact command depends on your OpenClaw setup. Try one of these:

```bash
# Option 1: Reload skills
openclaw reload

# Option 2: Restart OpenClaw service
sudo systemctl restart openclaw

# Option 3: If running as a process
pkill -f openclaw
# Then start it again according to your setup
```

### Step 7: Verify Skill is Loaded

```bash
openclaw skills list
```

Look for `travel-planner` in the output with `enabled: true`.

### Step 8: Test Basic Functionality

Via your messaging app (Telegram, WhatsApp, etc.), send:

```
/travel-planner
```

You should receive a help message explaining how to use the skill.

## Testing Checklist

Once deployed, work through these tests:

### Quick Tests (5 minutes)

1. **Help command:**
   ```
   /travel-planner
   ```
   Expected: Help message with usage instructions

2. **List monitoring (empty state):**
   ```
   /travel-planner list
   ```
   Expected: Message saying no routes are being monitored

3. **Simple price check:**
   ```
   /travel-planner NYC to Paris
   ```
   Expected: Flight prices (or error if browser/network issue)

### Full Test Suite

Follow the complete test plan in TESTING.md.

## Troubleshooting Deployment

### Skill not appearing in list

**Check skill directory location:**
```bash
ls ~/.openclaw/skills/
```

**Check SKILL.md exists:**
```bash
cat ~/.openclaw/skills/travel-planner/SKILL.md
```

**Check OpenClaw logs:**
```bash
journalctl -u openclaw -f
# or
tail -f ~/.openclaw/logs/openclaw.log
```

### Browser automation not working

**Verify browser tool is available:**
Check OpenClaw configuration for browser tool.

**Test browser manually:**
Try opening a browser session via OpenClaw CLI.

### Storage permission issues

**Check storage directory:**
```bash
ls -la ~/.openclaw/skills/travel-planner/storage/
```

**Fix permissions if needed:**
```bash
chmod 755 ~/.openclaw/skills/travel-planner/storage/
```

### Configuration not saving

**Check config file location:**
```bash
ls -la ~/.openclaw/openclaw.json
```

**Check permissions:**
```bash
chmod 644 ~/.openclaw/openclaw.json
```

**Verify config structure:**
```bash
cat ~/.openclaw/openclaw.json | jq '.skills.entries["travel-planner"]'
```

## Development Workflow

### Making Changes

1. **Edit locally** in `/Users/wojciechgula/Projects/travel_planner`
2. **Test locally** (if possible):
   ```bash
   node -e "const s = require('./scraper'); console.log(s.parseDate('next Friday'))"
   ```
3. **Commit changes:**
   ```bash
   git add .
   git commit -m "Description of changes"
   ```
4. **Push to remote:**
   ```bash
   git push origin main
   ```
5. **Deploy to OpenClaw:**
   ```bash
   ssh openclaw@openclaw.local
   cd ~/.openclaw/skills/travel-planner
   git pull
   openclaw reload
   ```
6. **Test changes** via messaging app

### Debugging

**Enable debug logging:**
Add console.log statements in your code. They'll appear in OpenClaw logs.

**Check logs:**
```bash
ssh openclaw@openclaw.local
journalctl -u openclaw -f
```

**Test individual tools:**
You can test tools by invoking them directly via the messaging interface.

## Rollback Procedure

If something goes wrong:

```bash
ssh openclaw@openclaw.local
cd ~/.openclaw/skills/travel-planner

# Check recent commits
git log --oneline -5

# Rollback to previous commit
git checkout <previous-commit-hash>

# Or rollback to specific tag
git checkout v0.1.0

# Reload OpenClaw
openclaw reload
```

## Production Checklist

Before marking as production-ready:

- [ ] All tests in TESTING.md passing
- [ ] Browser scraping works reliably
- [ ] Cron jobs create and execute correctly
- [ ] Notifications delivered successfully
- [ ] Multi-route monitoring works
- [ ] Configuration persists across restarts
- [ ] Error messages are user-friendly
- [ ] No sensitive data in logs
- [ ] Rate limiting works (max 1 check/hour/route)
- [ ] Price history cleanup works (90-day retention)

## Next Steps After Deployment

1. Run through TESTING.md systematically
2. Document any issues in GitHub issues
3. Fix bugs and redeploy
4. Complete cron integration (Phase 5)
5. Test with non-technical user
6. Tag v0.1.0 release when ready
7. Update README with any deployment-specific notes

## Support

If you encounter issues:

1. Check TESTING.md for relevant test cases
2. Check README.md troubleshooting section
3. Review OpenClaw logs
4. Check skill configuration in ~/.openclaw/openclaw.json
5. Verify all files are present and readable

## Security Notes

- Never commit sensitive data (API keys, tokens, chat IDs)
- Keep storage/ directory permissions restrictive (755)
- Review price history files don't contain sensitive data
- Monitor logs for any exposed sensitive information
- Test input validation thoroughly before production use

---

**Ready to deploy?** Follow the steps above and document results in TESTING.md.
