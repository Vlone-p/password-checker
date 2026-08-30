##🛡️ Zero-Trust Password Checker

#A modern, privacy-first password strength checker and breach database scanner that runs entirely in the browser. No backend, no tracking, no data collection.
##🌐 Live Demo

Check it out live here: https://vlone-p.github.io/password-checker/
##🧠 The Concept

Traditional password checkers send your password to a server, which is a massive privacy risk. This tool uses a Zero-Trust, Client-Side architecture. Your password never leaves your machine.
#How does the Breach Check work privately?

We use a concept called k-Anonymity using the SHA-1 hashing algorithm:

1. Your browser hashes your password locally using the Web Crypto API.
2. Only the first 5 characters of that hash are sent to the HaveIBeenPwned (HIBP) API.
3. The API returns a list of hundreds of leaked password hashes that start with those 5 characters.
4. Your browser checks if your full hash is in that list locally.

Result: You know if your password is leaked, but HIBP never saw your password.
✨ Features

Real-time Strength Meter: Evaluates length, complexity, and mathematical entropy.Dictionary Attack Detection: Flags common base words (e.g., "password", "letmein") that hackers prioritize in rule-based attacks.Actionable Security Tips: Dynamic, color-coded feedback telling the user exactly what to fix (Red = Critical, Yellow = Helpful, Green = Good).Secure Breach Scanning: k-Anonymity API integration with HIBP.Cyberpunk/Terminal UI: Dark mode, monospace typography, and neon aesthetic.XSS Safe: Uses secure DOM manipulation (textContent) to prevent Cross-Site Scripting via the input field.Mobile Responsive: Works flawlessly on mobile devices without iOS auto-zoom issues.
🛠️ Tech Stack

HTML5: Semantic structureCSS3: Flexbox, CSS Variables, Media Queries (Mobile-first)Vanilla JavaScript: DOM manipulation, async/await for API callsWeb Crypto API: For secure, local SHA-1 hashing
🚀 How to Run Locally

Because this project uses the Web Crypto API, it must be served over a local web server (opening the index.html file directly via file:// will block the API).

If you have Python installed, run this in your terminal:

python -m http.server 8000

Then open http://localhost:8000 in your browser.
