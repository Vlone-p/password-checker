// Copilot's regex escape utility
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Pure function: Calculates Score
export function scorePassword(password) {
    let score = 0;
    let tips = [];
    
    if (password.length === 0) return { score: 0, tips: [], category: 'empty' };

    // Curated list (removed offensive words, kept top common ones)
    const commonPasswords = [
        "123456", "password", "12345678", "qwerty", "123456789", "12345", "1234", "111111", "1234567", "dragon",
        "123123", "baseball", "abc123", "football", "monkey", "letmein", "shadow", "master", "666666", "qwertyuiop",
        "123321", "mustang", "1234567890", "michael", "654321", "superman", "1qaz2wsx", "7777777", "121212", "000000",
        "qazwsx", "123qwe", "killer", "trustno1", "jordan", "jennifer", "zxcvbnm", "asdfgh", "hunter", "buster",
        "soccer", "harley", "batman", "andrew", "tigger", "sunshine", "iloveyou", "12345678910", "superman", "michael1"
    ];

    // Improved Regex: Catches "password", "password1", "!password", but NOT "compassword"
    const isCommon = commonPasswords.some(common => {
        const escaped = escapeRegExp(common);
        // Matches if the word is at the start, or preceded by a non-letter, and followed by anything
        const regex = new RegExp(`(^|[^a-z])${escaped}`, 'i');
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
