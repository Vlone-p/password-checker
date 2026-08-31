import { scorePassword } from './logic.js';

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

const debouncedBreachCheck = makeDebounce(async (password) => {
    if (!password) return;
    
    // Copilot Fix: Graceful fallback if Web Crypto API is unavailable (old browsers)
    if (!window.crypto || !window.crypto.subtle) {
        breachStatus.classList.remove('hidden');
        breachStatus.style.backgroundColor = 'rgba(245, 158, 11, 0.1)';
        breachStatus.style.color = 'var(--accent-orange)';
        breachStatus.textContent = '> ERROR: Your browser does not support secure hashing (Web Crypto API).';
        return;
    }

    if (breachAbortController) breachAbortController.abort();
    breachAbortController = new AbortController();
    const signal = breachAbortController.signal;

    breachStatus.classList.remove('hidden');
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
                throw new Error('Rate limited by breach API. Please wait a moment before typing more.');
            } else {
                throw new Error(`Breach service returned HTTP ${resp.status}.`);
            }
        }

        const text = await resp.text();
        const isPwned = text.split('\n').some(line => {
            const returned = line.split(':')[0].trim().toUpperCase();
            return returned === suffix;
        });

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
        if (err.name === 'AbortError') return;
        if (!signal.aborted) {
            breachStatus.style.backgroundColor = 'rgba(245, 158, 11, 0.1)';
            breachStatus.style.color = 'var(--accent-orange)';
            breachStatus.textContent = `> ERROR: ${err.message}`;
            console.error("Breach check failed.");
        }
    } finally {
        if (breachAbortController && breachAbortController.signal === signal) {
            breachAbortController = null;
        }
    }
}, 500);

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
    // Copilot Fix: Handle both ' ' and 'Spacebar' for cross-browser support
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar' || e.code === 'Space') {
        e.preventDefault();
        togglePasswordVisibility();
    }
});

breachToggle.addEventListener('change', () => {
    if (breachToggle.checked) {
        breachInfo.classList.remove('hidden');
        if (passwordInput.value.length > 0) {
            debouncedBreachCheck.call(passwordInput.value);
        }
    } else {
        breachInfo.classList.add('hidden');
        breachStatus.classList.add('hidden');
        debouncedBreachCheck.cancel();
        if (breachAbortController) breachAbortController.abort();
    }
});

// Prevent Spacebar from being typed in the input
passwordInput.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
    }
});

passwordInput.addEventListener('input', (e) => {
    let password = passwordInput.value;
    
    // Strip spaces if user copy-pasted a password with spaces
    if (password.includes(' ')) {
        password = password.replace(/\s/g, '');
        passwordInput.value = password;
    }

    const scoreResult = scorePassword(password);
    renderScore(scoreResult, password);

    if (breachToggle.checked && password.length > 0) {
        debouncedBreachCheck.call(password);
    } else {
        breachStatus.classList.add('hidden');
        debouncedBreachCheck.cancel();
        if (breachAbortController) breachAbortController.abort();
    }
});

function renderScore(result, password) {
    if (password.length === 0) {
        strengthBar.className = 'strength-bar';
        strengthText.textContent = 'Awaiting input...';
        strengthText.style.color = 'var(--text-muted)';
        tipsContainer.innerHTML = '';
        return;
    }

    strengthBar.className = `strength-bar strength-${result.category}`;
    
    const textMap = { 'weak': 'Weak', 'moderate': 'Moderate', 'strong': 'Strong', 'very-strong': 'Very Strong' };
    const colorMap = { 'weak': 'var(--accent-red)', 'moderate': 'var(--accent-orange)', 'strong': 'var(--accent-yellow)', 'very-strong': 'var(--accent-green)' };

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
