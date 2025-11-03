VIRTUE.EXE — SEASON 1 (PWA)
================================

This is a fully offline Progressive Web App that turns your grind into a game.
Installable on iPhone/Android (Add to Home Screen) and works without internet once loaded.

How to run locally
------------------
1) Unzip the folder.
2) Serve the folder with any static server (phone cannot install a PWA from file://).
   - Quick option: drag the folder into Netlify / Vercel / GitHub Pages / Cloudflare Pages.
   - Or run a local server on your computer (e.g., Python: `python3 -m http.server 8080`) then open http://localhost:8080 on your phone via LAN.
3) Open the site in your mobile browser, tap "Share" → "Add to Home Screen" (iOS) or the install banner (Android).
4) The app stores data in localStorage. Use Settings → Export Backup to save progress.

Notes
-----
- Multipliers, target level, and achievements are in-app under Settings/Achievements.
- XP formula: (Hours × Multiplier) × 10 × Buff × Debuff + (DailyQuests×15)
- Buff = +10% if Flow State (Y). Debuff = −25% if Distraction (Y).
- Early-game levels ramp fast; Season target default Level 20.
