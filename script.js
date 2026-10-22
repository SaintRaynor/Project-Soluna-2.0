// --- APP INITIALIZATION & AUTHENTICATION CHECK ---
window.onload = function() {
    checkUserSession();
};

function checkUserSession() {
    const currentUser = localStorage.getItem("soluna_current_user");
    if (currentUser) {
        document.getElementById("auth-screen").classList.add("hidden");
        document.getElementById("app-screen").classList.remove("hidden");
        initializeAppData(currentUser);
    } else {
        document.getElementById("auth-screen").classList.remove("hidden");
        document.getElementById("app-screen").classList.add("hidden");
    }
}

function handleAuth() {
    const nameInput = document.getElementById("auth-name").value.trim();
    const pinInput = document.getElementById("auth-pin").value.trim();

    if (!nameInput || pinInput.length !== 4) {
        alert("Please enter your name and a 4-digit PIN.");
        return;
    }

    // Save session
    localStorage.setItem("soluna_current_user", nameInput);
    localStorage.setItem(`soluna_pin_${nameInput}`, pinInput);
    
    checkUserSession();
}

function logoutUser() {
    localStorage.removeItem("soluna_current_user");
    checkUserSession();
}

function initializeAppData(username) {
    // Set UI user details
    document.getElementById("welcome-user-subtitle").textContent = `Welcome back, ${username}`;
    document.getElementById("greeting-title").textContent = `Hello, ${username} ✨`;
    document.getElementById("profile-name").textContent = username;
    document.getElementById("user-avatar-initial").textContent = username.charAt(0).toUpperCase();

    loadDailyQuote();
    loadSavedMood();
    loadJournalEntries();
    updateStats();
}

// --- TAB NAVIGATION CONTROLLER ---
function switchTab(tabId) {
    document.querySelectorAll('.tab-view').forEach(view => view.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

    document.getElementById(`view-${tabId}`).classList.add('active');

    const tabMap = { 'home': 0, 'mood': 1, 'journal': 2, 'calm': 3, 'profile': 4 };
    const navButtons = document.querySelectorAll('.nav-item');
    if (navButtons[tabMap[tabId]]) {
        navButtons[tabMap[tabId]].classList.add('active');
    }
}

// --- 1. MOOD TRACKER LOGIC ---
function trackMood(moodString, emoji) {
    const username = localStorage.getItem("soluna_current_user");
    const today = new Date().toLocaleDateString();
    const moodData = { date: today, mood: moodString, emoji: emoji };

    document.getElementById("current-mood-status").textContent = `Logged Today: ${moodString}`;
    document.getElementById("home-mood-display").textContent = moodString;

    let history = JSON.parse(localStorage.getItem(`soluna_mood_${username}`)) || [];
    history = history.filter(item => item.date !== today);
    history.unshift(moodData);
    
    localStorage.setItem(`soluna_mood_${username}`, JSON.stringify(history));
    renderMoodHistory();
    updateStats();
}

function loadSavedMood() {
    const username = localStorage.getItem("soluna_current_user");
    let history = JSON.parse(localStorage.getItem(`soluna_mood_${username}`)) || [];
    const today = new Date().toLocaleDateString();
    const todaysEntry = history.find(item => item.date === today);

    if (todaysEntry) {
        document.getElementById("current-mood-status").textContent = `Logged Today: ${todaysEntry.mood}`;
        document.getElementById("home-mood-display").textContent = todaysEntry.mood;
    }
    renderMoodHistory();
}

function renderMoodHistory() {
    const username = localStorage.getItem("soluna_current_user");
    const list = document.getElementById("mood-history-list");
    list.innerHTML = "";
    let history = JSON.parse(localStorage.getItem(`soluna_mood_${username}`)) || [];

    if (history.length === 0) {
        list.innerHTML = "<li>No past moods recorded yet.</li>";
        return;
    }

    history.slice(0, 5).forEach(item => {
        const li = document.createElement("li");
        li.innerHTML = `<span>${item.date}</span> <strong>${item.mood}</strong>`;
        list.appendChild(li);
    });
}

// --- 2. PERSONAL JOURNAL LOGIC (WITH DELETE) ---
function saveJournalEntry() {
    const username = localStorage.getItem("soluna_current_user");
    const input = document.getElementById("journal-input");
    const text = input.value.trim();

    if (!text) {
        alert("Please write something before saving.");
        return;
    }

    let entries = JSON.parse(localStorage.getItem(`soluna_journal_${username}`)) || [];
    const newEntry = {
        id: Date.now(),
        date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: text
    };

    entries.unshift(newEntry);
    localStorage.setItem(`soluna_journal_${username}`, JSON.stringify(entries));
    
    input.value = "";
    loadJournalEntries();
    updateStats();
}

function loadJournalEntries() {
    const username = localStorage.getItem("soluna_current_user");
    const container = document.getElementById("journal-list");
    container.innerHTML = "";
    let entries = JSON.parse(localStorage.getItem(`soluna_journal_${username}`)) || [];

    if (entries.length === 0) {
        container.innerHTML = "<p style='font-size:0.85rem; color:#64748b;'>Your journal is empty. Write your first reflection above!</p>";
        return;
    }

    entries.forEach(entry => {
        const div = document.createElement("div");
        div.className = "journal-item";
        div.innerHTML = `
            <div class="journal-content">
                <small>${entry.date}</small>
                <p>${entry.text}</p>
            </div>
            <button class="delete-btn" onclick="deleteJournalEntry(${entry.id})" title="Delete entry">🗑️</button>
        `;
        container.appendChild(div);
    });
}

function deleteJournalEntry(id) {
    if (!confirm("Are you sure you want to delete this journal entry?")) return;

    const username = localStorage.getItem("soluna_current_user");
    let entries = JSON.parse(localStorage.getItem(`soluna_journal_${username}`)) || [];
    
    entries = entries.filter(entry => entry.id !== id);
    localStorage.setItem(`soluna_journal_${username}`, JSON.stringify(entries));
    
    loadJournalEntries();
    updateStats();
}

// --- 3. DAILY INSPIRATION LOGIC ---
function loadDailyQuote() {
    const quotes = [
        "\"You are free from judgment, especially from yourself.\"",
        "\"Take things one day, one class, and one breath at a time.\"",
        "\"Your mental health is a priority, not an afterthought.\"",
        "\"Small progress each day adds up to big results.\"",
        "\"It's okay to take a pause and catch your breath.\""
    ];
    const random = quotes[Math.floor(Math.random() * quotes.length)];
    document.getElementById("quote-text").textContent = random;
}

// --- 4. CALM CORNER BREATHING EXERCISE ---
let breathingActive = false;
let breathingTimer;

function toggleBreathing() {
    const circle = document.getElementById("circle");
    const text = document.getElementById("breathing-text");
    const btn = document.getElementById("breathe-btn");

    if (breathingActive) {
        clearInterval(breathingTimer);
        breathingActive = false;
        circle.classList.remove("scale-up");
        text.textContent = "Ready";
        btn.textContent = "Start Breathing";
        return;
    }

    breathingActive = true;
    btn.textContent = "Stop Exercise";
    runCycle(circle, text);
    breathingTimer = setInterval(() => {
        if (!breathingActive) return;
        runCycle(circle, text);
    }, 8000);
}

function runCycle(circle, text) {
    text.textContent = "Breathe In";
    circle.classList.add("scale-up");

    setTimeout(() => {
        if (!breathingActive) return;
        text.textContent = "Breathe Out";
        circle.classList.remove("scale-up");
    }, 4000);
}

// --- 5. STATS & PROFILE UPDATER ---
function updateStats() {
    const username = localStorage.getItem("soluna_current_user");
    const entries = JSON.parse(localStorage.getItem(`soluna_journal_${username}`)) || [];
    const moods = JSON.parse(localStorage.getItem(`soluna_mood_${username}`)) || [];

    document.getElementById("stat-total-entries").textContent = entries.length;
    document.getElementById("stat-total-moods").textContent = moods.length;
    document.getElementById("streak-badge").textContent = `🔥 ${moods.length} Days`;
}