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

const commonPasswords = ["password", "123456", "12345678", "qwerty", "abc123", "admin", "letmein", "welcome", "monkey", "dragon"];

let timeoutId;
function debounce(func, delay) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(func, delay);
}

toggleEye.addEventListener('click', () => {
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeOpen.style.display = 'none';
        eyeClosed.style.display = 'block';
        toggleEye.setAttribute('aria-label', 'Hide password');
    } else {
        passwordInput.type = 'password';
        eyeOpen.style.display = 'block';
        eyeClosed.style.display = 'none';
        toggleEye.setAttribute('aria-label', 'Show password');
    }
});

breachToggle.addEventListener('change', () => {
    if (breachToggle.checked) {
        breachInfo.style.display = 'block';
        checkBreach();
    } else {
        breachInfo.style.display = 'none';
        breachStatus.style.display = 'none';
    }
});

passwordInput.addEventListener('input', () => {
    const password = passwordInput.value;
    checkStrength(password);

    if (breachToggle.checked && password.length > 0) {
        debounce(() => checkBreach(password), 500);
    } else {
        breachStatus.style.display = 'none';
    }
});

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

async function checkBreach() {
    const password = passwordInput.value;
    if (!password) return;

    breachStatus.style.display = 'block';
    breachStatus.style.backgroundColor = 'var(--input-bg)';
    breachStatus.style.color = 'var(--text-muted)';
    breachStatus.textContent = '> Scanning breach databases securely...';

    try {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-1', data);
        
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        const prefix = hashHex.substring(0, 5);
        const suffix = hashHex.substring(5);

        const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
        const text = await response.text();

        const isPwned = text.split('\n').some(line => {
            return line.split(':')[0] === suffix.toUpperCase();
        });

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

    } catch (error) {
        breachStatus.style.backgroundColor = 'rgba(245, 158, 11, 0.1)';
        breachStatus.style.color = 'var(--accent-orange)';
        breachStatus.textContent = '> ERROR: Network issue or browser policy blocked request.';
        console.error("Breach check error:", error);
    }
}
