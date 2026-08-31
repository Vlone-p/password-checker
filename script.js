
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

// Copilot's Cancelable Debounce Factory
function makeDebounce(fn, delay) {
    let timeout = null;
    return {
        call: (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn(...args), delay);
        },
        cancel: () => {
            clearTimeout(timeout);
            timeout = null;
        }
    };
}

let breachAbortController = null;

// Setup the debounced breach check
const debouncedBreachCheck = makeDebounce(async (password) => {
    if (!password) return;
    
    // Cancel any previous request
    if (breachAbortController) breachAbortController.abort();
    breachAbortController = new AbortController();
    const signal = breachAbortController.signal;

    breachStatus.style.display = 'block';
    breachStatus.style.backgroundColor = 'var(--input-bg)';
    breachStatus.style.color = 'var(--text-muted)';
    breachStatus.textContent = '> Scanning breach databases securely...';

    try {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-1', data);
        
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
        
        const prefix = hashHex.slice(0, 5);
        const suffix = hashHex.slice(5);

        const resp = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, { signal });

        if (!resp.ok) {
            if (resp.status === 429) {
                throw new Error('Rate limited by breach API. Try again later.');
            } else {
                throw new Error(`Breach service returned HTTP ${resp.status}.`);
            }
        }

        const text = await resp.text();
        const isPwned = text.split('\n').some(line => line.split(':')[0] === suffix);

        if (!signal.aborted) {
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
    } catch (err) {
        if (err.name === 'AbortError') return; // Expected when cancelling
        if (!signal.aborted) {
            breachStatus.style.backgroundColor = 'rgba(245, 158, 11, 0.1)';
            breachStatus.style.color = 'var(--accent-orange)';
            breachStatus.textContent = `> ERROR: ${err.message}`;
            console.error("Breach check failed."); // No passwords/hashes logged
        }
    } finally {
        if (breachAbortController && breachAbortController.signal === signal) {
            breachAbortController = null;
        }
    }
}, 500);

// Toggle Eye Click & Keyboard Accessibility
function togglePasswordVisibility() {
    const isHidden = passwordInput.type === 'password';
    passwordInput.type = isHidden ? 'text' : 'password';
    eyeOpen.style.display = isHidden ? 'none' : 'block';
    eyeClosed.style.display = isHidden ? 'block' : 'none';
    toggleEye.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
    toggleEye.setAttribute('aria-pressed', isHidden ? 'true' : 'false');
}

toggleEye.addEventListener('click', togglePasswordVisibility);
toggleEye.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        togglePasswordVisibility();
    }
});

breachToggle.addEventListener('change', () => {
    if (breachToggle.checked) {
        breachInfo.style.display = 'block';
        if (passwordInput.value.length > 0) {
            debouncedBreachCheck.call(passwordInput.value);
        }
    } else {
        breachInfo.style.display = 'none';
        breachStatus.style.display = 'none';
        debouncedBreachCheck.cancel();
        if (breachAbortController) breachAbortController.abort();
    }
});

passwordInput.addEventListener('input', () => {
    const password = passwordInput.value;
    const scoreResult = scorePassword(password);
    renderScore(scoreResult, password);

    if (breachToggle.checked && password.length > 0) {
        debouncedBreachCheck.call(password);
    } else {
        breachStatus.style.display = 'none';
        debouncedBreachCheck.cancel();
        if (breachAbortController) breachAbortController.abort();
    }
});

// Pure Function: Calculates Score (No DOM manipulation)
function scorePassword(password) {
    let score = 0;
    let tips = [];
    
    if (password.length === 0) return { score: 0, tips: [], category: 'empty' };

    // Copilot's regex fix to prevent "compassword" false positives
    const isCommon = commonPasswords.some(common => {
        const regex = new RegExp(`\\b${common}\\b`, 'i');
        return regex.test(password);
    });
    
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
    let category = 'weak';
    if (displayScore <= 3) category = 'weak';
    else if (displayScore <= 5) category = 'moderate';
    else if (displayScore <= 7) category = 'strong';
    else category = 'very-strong';
    
    return { score: displayScore, tips, category };
}

// DOM Renderer: Updates UI based on pure function output
function renderScore(result, password) {
    if (password.length === 0) {
        strengthBar.className = 'strength-bar';
        strengthText.textContent = 'Awaiting input...';
        strengthText.style.color = 'var(--text-muted)';
        tipsContainer.innerHTML = '';
        return;
    }

    // Map category to CSS class
    strengthBar.className = `strength-bar strength-${result.category}`;
    
    const textMap = {
        'weak': 'Weak',
        'moderate': 'Moderate',
        'strong': 'Strong',
        'very-strong': 'Very Strong'
    };
    
    const colorMap = {
        'weak': 'var(--accent-red)',
        'moderate': 'var(--accent-orange)',
        'strong': 'var(--accent-yellow)',
        'very-strong': 'var(--accent-green)'
    };

    strengthText.textContent = textMap[result.category];
    strengthText.style.color = colorMap[result.category];

    tipsContainer.innerHTML = '';
    result.tips.forEach(tip => {
        const div = document.createElement('div');
        div.className = `tip-item tip-${tip.level}`;
        div.textContent = tip.text;
        tipsContainer.appendChild(div);
    });
}
