const passwordInput = document.getElementById('passwordInput');
const toggleEye = document.getElementById('toggleEye');
const eyeOpen = document.getElementById('eyeOpen');
const eyeClosed = document.getElementById('eyeClosed');
const strengthBar = document.getElementById('strengthBar');
const strengthText = document.getElementById('strengthText');
const tipsContainer = document.getElementById('tipsContainer');
const breachToggle = document.getElementById('breachToggle');
const breachInfo = document.getElementById('breachInfo');
const breachStatus = document.getElementById('breachStatus');

// Expanded list of top 50 most common passwords
const commonPasswords = [
    "123456", "password", "12345678", "qwerty", "123456789", "12345", "1234", "111111", "1234567", "dragon",
    "123123", "baseball", "abc123", "football", "monkey", "letmein", "696969", "shadow", "master", "666666",
    "qwertyuiop", "123321", "mustang", "1234567890", "michael", "654321", "pussy", "superman", "1qaz2wsx", "7777777",
    "fuckyou", "121212", "000000", "qazwsx", "123qwe", "killer", "trustno1", "jordan", "jennifer", "zxcvbnm",
    "asdfgh", "hunter", "buster", "soccer", "harley", "batman", "andrew", "tigger", "sunshine", "iloveyou"
];

// Global state for debounce and aborting requests
let debounceTimer = null;
let abortController = null;

toggleEye.addEventListener('click', () => {
    // Toggle password visibility
    const isHidden = passwordInput.type === 'password';
    passwordInput.type = isHidden ? 'text' : 'password';
    eyeOpen.style.display = isHidden ? 'none' : 'block';
    eyeClosed.style.display = isHidden ? 'block' : 'none';
    toggleEye.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
});

breachToggle.addEventListener('change', () => {
    if (breachToggle.checked) {
        breachInfo.style.display = 'block';
        // Trigger check immediately if there's already text
        if (passwordInput.value.length > 0) {
            scheduleBreachCheck(passwordInput.value);
        }
    } else {
        breachInfo.style.display = 'none';
        breachStatus.style.display = 'none';
        // Abort any pending check if toggled off
        if (abortController) abortController.abort();
    }
});

passwordInput.addEventListener('input', () => {
    const password = passwordInput.value;
    checkStrength(password);

    if (breachToggle.checked && password.length > 0) {
        scheduleBreachCheck(password);
    } else {
        breachStatus.style.display = 'none';
        if (abortController) abortController.abort();
    }
});

function scheduleBreachCheck(password) {
    // Clear previous debounce timer
    if (debounceTimer) clearTimeout(debounceTimer);
    
    // Abort any currently running fetch request
    if (abortController) abortController.abort();

    // Set new timer
    debounceTimer = setTimeout(() => {
        checkBreach(password);
    }, 500);
}

function checkStrength(password) {
    let score = 0;
    let tips = [];
    
    if (password.length === 0) {
        strengthBar.style.width = '0%';
        strengthBar.style.backgroundColor = 'var(--bg-color)';
        strengthBar.style.boxShadow = 'none';
        strengthText.textContent = 'Awaiting input...';
        strengthText.style.color = 'var(--text-muted)';
        tipsContainer.innerHTML = '';
        return;
    }

    const lowerPass = password.toLowerCase();
    const isCommon = commonPasswords.some(common => lowerPass.includes(common));
    
    if (isCommon) {
        tips.push({ text: "Contains a common dictionary word. While extra characters help, hackers specifically target variations of these words.", level: "yellow" });
        score -= 2; 
    }

    if (password.length < 8) {
        tips.push({ text: "Too short. Use at least 12 characters.", level: "red" });
    } else if (password.length < 12) {
        tips.push({ text: "Decent length, but 12+ characters is highly recommended.", level: "yellow" });
        score += 2;
    } else {
        tips.push({ text: "Great length! Length is your best defense against brute-force.", level: "green" });
        score += 4;
    }
    
    if (/[a-z]/.test(password)) { score += 1; } else { 
        tips.push({ text: "Add lowercase letters (a-z).", level: "red" }); 
    }
    if (/[A-Z]/.test(password)) { score += 1; } else { 
        tips.push({ text: "Add uppercase letters (A-Z).", level: "yellow" }); 
    }
    if (/[0-9]/.test(password)) { score += 1; } else { 
        tips.push({ text: "Add numbers (0-9).", level: "yellow" }); 
    }
    if (/[^a-zA-Z0-9]/.test(password)) { score += 1; } else { 
        tips.push({ text: "Add special characters (!@#$%^&*).", level: "yellow" }); 
    }

    if (/[a-z]/.test(password) && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^a-zA-Z0-9]/.test(password)) {
        tips.push({ text: "Excellent character variety.", level: "green" });
    }

    let displayScore = Math.max(0, score);
    if (displayScore <= 3) {
        strengthBar.style.width = '25%';
        strengthBar.style.backgroundColor = 'var(--accent-red)';
        strengthBar.style.boxShadow = '0 0 10px var(--accent-red)';
        strengthText.textContent = 'Weak';
        strengthText.style.color = 'var(--accent-red)';
    } else if (displayScore <= 5) {
        strengthBar.style.width = '50%';
        strengthBar.style.backgroundColor = 'var(--accent-orange)';
        strengthBar.style.boxShadow = '0 0 10px var(--accent-orange)';
        strengthText.textContent = 'Moderate';
        strengthText.style.color = 'var(--accent-orange)';
    } else if (displayScore <= 7) {
        strengthBar.style.width = '75%';
        strengthBar.style.backgroundColor = 'var(--accent-yellow)';
        strengthBar.style.boxShadow = '0 0 10px var(--accent-yellow)';
        strengthText.textContent = 'Strong';
        strengthText.style.color = 'var(--accent-yellow)';
    } else {
        strengthBar.style.width = '100%';
        strengthBar.style.backgroundColor = 'var(--accent-green)';
        strengthBar.style.boxShadow = '0 0 10px var(--accent-green)';
        strengthText.textContent = 'Very Strong';
        strengthText.style.color = 'var(--accent-green)';
    }

    tipsContainer.innerHTML = '';
    tips.forEach(tip => {
        const div = document.createElement('div');
        div.className = `tip-item tip-${tip.level}`;
        div.textContent = tip.text;
        tipsContainer.appendChild(div);
    });
}

async function checkBreach(password) {
    // Setup new AbortController for this specific request
    abortController = new AbortController();
    const signal = abortController.signal;

    breachStatus.style.display = 'block';
    breachStatus.style.backgroundColor = 'var(--input-bg)';
    breachStatus.style.color = 'var(--text-muted)';
    breachStatus.textContent = '> Scanning breach databases securely...';

    try {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-1', data);
        
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        // Force uppercase to match HIBP API response format
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
        
        const prefix = hashHex.substring(0, 5);
        const suffix = hashHex.substring(5);

        const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, { signal });

        // Handle HTTP errors (Rate limiting, server down, etc.)
        if (!response.ok) {
            if (response.status === 429) {
                throw new Error('Rate limited by API. Please wait a moment before typing more.');
            } else {
                throw new Error(`API returned HTTP ${response.status}. Service might be down.`);
            }
        }

        const text = await response.text();

        const isPwned = text.split('\n').some(line => {
            return line.split(':')[0] === suffix;
        });

        // Only update UI if this request wasn't aborted by a newer keystroke
        if (!signal.aborted) {
            breachStatus.style.display = 'block';
            if (isPwned) {
                breachStatus.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                breachStatus.style.color = 'var(--accent-red)';
                breachStatus.textContent = '> WARNING: Breach detected! Found in public data leaks.';
            } else {
                breachStatus.style.backgroundColor = 'rgba(34, 197, 94, 0.1)';
                breachStatus.style.color = 'var(--accent-green)';
                breachStatus.textContent = '> SECURE: Not found in known data breaches.';
            }
        }

    } catch (error) {
        // If the error is because we aborted it, do nothing (a newer request is handling it)
        if (error.name === 'AbortError') {
            return;
        }
        
        // Handle network errors and API errors gracefully
        if (!signal.aborted) {
            breachStatus.style.backgroundColor = 'rgba(245, 158, 11, 0.1)';
            breachStatus.style.color = 'var(--accent-orange)';
            breachStatus.textContent = `> ERROR: ${error.message}`;
            // Security best practice: log generic error, never log the password or hash
            console.error("Breach check failed.");
        }
    } finally {
        // Clean up controller if this one is still the active one
        if (abortController && abortController.signal === signal) {
            abortController = null;
        }
    }
}
