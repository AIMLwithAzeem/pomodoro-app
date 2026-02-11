// DOM Elements
const timeDisplay = document.getElementById('time-display');
const startPauseBtn = document.getElementById('start-pause-btn');
const resetBtn = document.getElementById('reset-btn');
const customInput = document.getElementById('custom-minutes');
const setTimeBtn = document.getElementById('set-time-btn');
const progressRing = document.querySelector('.progress-ring__circle');
const quoteContainer = document.getElementById('quote-container');
const quoteText = document.getElementById('quote-text');

// Constants
const RADIUS = progressRing.r.baseVal.value;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Setup Progress Ring
progressRing.style.strokeDasharray = `${CIRCUMFERENCE} ${CIRCUMFERENCE}`;
progressRing.style.strokeDashoffset = 0;

// State Variables
let defaultTime = 25 * 60; // 25 minutes in seconds
let timeLeft = defaultTime;
let timerInterval = null;
let isRunning = false;
let totalTime = defaultTime; // Used for progress calculation
// Embedded Quotes
const quotes = [
    { text: "Time is the most valuable thing a man can spend." },
    { text: "The key is in not spending time, but in investing it." },
    { text: "Lost time is never found again." },
    { text: "Your time is limited, so don't waste it living someone else's life." },
    { text: "Time stays long enough for anyone who will use it." },
    { text: "Focus on being productive instead of busy." },
    { text: "Until we can manage time, we can manage nothing else." },
    { text: "A man who dares to waste one hour of time has not discovered the value of life." },
    { text: "Determine never to be idle. No person will have occasion to complain of the want of time who never loses any." },
    { text: "Time is what we want most, but what we use worst." }
];

// Initialize Display
updateTimeDisplay();

// Event Listeners
startPauseBtn.addEventListener('click', toggleTimer);
resetBtn.addEventListener('click', resetTimer);
setTimeBtn.addEventListener('click', setCustomTime);
customInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        setCustomTime();
    }
});
customInput.addEventListener('input', () => {
    customInput.classList.remove('input-error');
});

// Functions

function toggleTimer() {
    if (isRunning) {
        pauseTimer();
    } else {
        // If timer finished, reset it first before starting
        if (timeLeft <= 0) {
            timeLeft = totalTime;
            updateTimeDisplay();
            setProgress(1);
        }
        startTimer();
    }
}

function startTimer() {
    if (timeLeft <= 0) return;

    // Ensure no duplicate intervals
    if (timerInterval) clearInterval(timerInterval);

    // Hide quote when starting
    hideQuote();

    isRunning = true;
    startPauseBtn.innerHTML = '<span class="icon">⏸</span> Pause';
    startPauseBtn.classList.add('active'); // Optional styling hook

    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimeDisplay();
        updateProgress();

        if (timeLeft <= 0) {
            completeTimer();
        }
    }, 1000);
}

function pauseTimer() {
    isRunning = false;
    clearInterval(timerInterval);
    timerInterval = null; // Clear reference
    startPauseBtn.innerHTML = '<span class="icon">▶</span> Resume';
    startPauseBtn.classList.remove('active');
}

function resetTimer() {
    pauseTimer();
    hideQuote(); // Hide quote on reset
    timeLeft = totalTime; // Reset to the current set total time (default or custom)
    updateTimeDisplay();
    setProgress(1); // Full ring
    startPauseBtn.innerHTML = '<span class="icon">▶</span> Start';
    customInput.classList.remove('input-error');
}

function setCustomTime() {
    const val = parseFloat(customInput.value);
    // Allow integers only for simplicity, or floor it.
    // Range 1 to 120.
    if (!isNaN(val) && val >= 1 && val <= 180) { // Extended to 180 as reasonable max
        const minutes = Math.floor(val);
        pauseTimer();
        hideQuote(); // Hide quote when setting new time
        defaultTime = minutes * 60;
        totalTime = defaultTime;
        timeLeft = defaultTime;
        updateTimeDisplay();
        setProgress(1);
        startPauseBtn.innerHTML = '<span class="icon">▶</span> Start';
        customInput.value = ''; // Clear input
        customInput.classList.remove('input-error');
    } else {
        triggerInputError();
    }
}

function triggerInputError() {
    customInput.classList.add('input-error');
    customInput.focus();
}

function updateTimeDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    timeDisplay.textContent = formattedTime;
    document.title = `${formattedTime} - Focus`;
}

function updateProgress() {
    const progress = timeLeft / totalTime;
    setProgress(progress);
}

function setProgress(percent) {
    const offset = CIRCUMFERENCE - (percent * CIRCUMFERENCE);
    progressRing.style.strokeDashoffset = offset;
}

function completeTimer() {
    pauseTimer();
    timeLeft = 0;
    updateTimeDisplay();
    setProgress(0);
    startPauseBtn.innerHTML = '<span class="icon">▶</span> Restart';
    playCompletionSound();
    showRandomQuote();
    sendToN8N(); // Trigger webhook
}

function showRandomQuote() {
    if (quotes.length > 0) {
        const randomIndex = Math.floor(Math.random() * quotes.length);
        quoteText.textContent = `"${quotes[randomIndex].text}"`;
        quoteContainer.classList.remove('hidden');
    }
}

function sendToN8N() {
    const webhookUrl = 'https://unsmooth-sulkily-hermila.ngrok-free.dev/webhook/pomodro';
    const data = {
        'user': 'Azeem',
        'app': 'Dental Pomodoro',
        'action': 'Session Completed',
        'time': new Date().toLocaleString()
    };

    fetch(webhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
        .then(response => {
            if (response.ok) {
                console.log('Successfully sent to N8N');
            } else {
                console.error('Failed to send to N8N:', response.statusText);
            }
        })
        .catch(error => {
            console.error('Error sending to N8N:', error);
        });
}

function hideQuote() {
    quoteContainer.classList.add('hidden');
    // Optional: Clear text after fade out if desired, but not strictly necessary
}

function playCompletionSound() {
    // Simple synthesized chime using Web Audio API
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.type = 'sine';
    // Play a nice major chord arpeggio quickly
    const now = ctx.currentTime;

    // Note 1
    osc.frequency.setValueAtTime(523.25, now); // C5
    gainNode.gain.setValueAtTime(0.1, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.start(now);
    osc.stop(now + 0.5);

    // Create a second deeper note for fullness
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(261.63, now); // C4
    gain2.gain.setValueAtTime(0.1, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.0);

    osc2.start(now);
    osc2.stop(now + 1.0);
}
