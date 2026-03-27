function updateDashboard() {
    const now = new Date();

    // --- 1. CLOCK & DATE ---

    // Extract time components
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    // Determine AM/PM (Optional, remove if you want 24h format)
    // const ampm = hours >= 12 ? 'PM' : 'AM';
    // hours = hours % 12;
    // hours = hours ? hours : 12; // the hour '0' should be '12'

    // Format: HH:MM:SS
    // Note: Remove padStart if using AM/PM logic above for single digit hours
    const timeString = `${String(hours).padStart(2, '0')}:${minutes}:${seconds}`; 
    document.getElementById('time').textContent = timeString;

    // Date Format: Monday, October 2, 2023
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateString = now.toLocaleDateString('en-US', options);
    document.getElementById('date').textContent = dateString;


    // --- 2. DYNAMIC GREETING ---
    const greetingElement = document.getElementById('greeting');
    const hour = now.getHours();

    if (hour < 12) {
        greetingElement.textContent = "Good Morning";
    } else if (hour < 18) {
        greetingElement.textContent = "Good Afternoon";
    } else {
        greetingElement.textContent = "Good Evening";
    }
}

function updateCountdown() {
    // --- 3. COUNTDOWN TO NEXT YEAR ---
    const currentYear = new Date().getFullYear();
    const nextYear = new Date(`January 1, ${currentYear + 1} 00:00:00`);
    const currentTime = new Date();

    const diff = nextYear - currentTime;

    const d = Math.floor(diff / 1000 / 60 / 60 / 24);
    const h = Math.floor((diff / 1000 / 60 / 60) % 24);
    const m = Math.floor((diff / 1000 / 60) % 60);
    const s = Math.floor((diff / 1000) % 60);

    document.getElementById('days').textContent = d;
    document.getElementById('hours').textContent = String(h).padStart(2, '0');
    document.getElementById('minutes').textContent = String(m).padStart(2, '0');
    document.getElementById('seconds').textContent = String(s).padStart(2, '0');
}

// Update the clock immediately and then every second
setInterval(updateDashboard, 1000);
setInterval(updateCountdown, 1000);

// Run once on load to avoid 1-second delay
updateDashboard();
updateCountdown();

// --- ALARM LOGIC ---

let alarmTime = null;
let alarmTimeout = null;
let audioCtx = null;
let oscillator = null;
let alarmInterval = null; // To repeat the beep

function toggleAlarm() {
    const input = document.getElementById('alarm-time-input');
    const btn = document.getElementById('set-alarm-btn');
    const status = document.getElementById('alarm-status');

    if (alarmTime) {
        // If alarm is already set, clear it (Cancel)
        alarmTime = null;
        btn.textContent = "Set Alarm";
        btn.classList.remove('active');
        status.textContent = "Alarm is OFF";
        stopAlarmSound(); // Stop sound if it's currently ringing
    } else {
        // Set the alarm
        if (!input.value) {
            alert("Please select a time first!");
            return;
        }
        alarmTime = input.value;
        btn.textContent = "Cancel Alarm";
        btn.classList.add('active');
        status.textContent = `Alarm set for ${alarmTime}`;
    }
}

// Function to generate the "Beep" sound using Web Audio API
function playBeep() {
    // Create Audio Context only when needed (browsers require interaction)
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Create an oscillator (the sound generator)
    oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'square'; // 'square' sounds more like an alarm than 'sine'
    oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // 440Hz (A4)

    // Connect parts: Oscillator -> Volume(Gain) -> Speakers
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    // Play sound
    oscillator.start();
}

function startAlarmRinging() {
    const stopBtn = document.getElementById('stop-alarm-btn');
    stopBtn.classList.remove('hidden'); // Show the big STOP button

    // Play a beep every 500ms
    playBeep(); 
    // Stop the individual beep after 200ms
    setTimeout(() => { if(oscillator) oscillator.stop(); }, 200);

    // Loop the beep
    alarmInterval = setInterval(() => {
        playBeep();
        setTimeout(() => { if(oscillator) oscillator.stop(); }, 200);
    }, 500);
}

function stopAlarmSound() {
    // Stop logic
    if (alarmInterval) clearInterval(alarmInterval);
    if (oscillator) {
        try { oscillator.stop(); } catch(e){} // Ignore error if already stopped
    }

    // Hide STOP button and reset
    document.getElementById('stop-alarm-btn').classList.add('hidden');

    // Optional: Auto-cancel the alarm logic so it doesn't ring tomorrow
    alarmTime = null;
    document.getElementById('set-alarm-btn').textContent = "Set Alarm";
    document.getElementById('set-alarm-btn').classList.remove('active');
    document.getElementById('alarm-status').textContent = "Alarm Cleared";
}

// --- INTEGRATE INTO EXISTING CLOCK LOOP ---

// We need to check the alarm every second. 
// Add this check inside your existing updateDashboard() function, 
// OR simpler: just set a separate interval here.

setInterval(() => {
    if (alarmTime) {
        const now = new Date();
        // Format current time to HH:MM to match input value
        const currentHours = String(now.getHours()).padStart(2, '0');
        const currentMinutes = String(now.getMinutes()).padStart(2, '0');
        const currentTimeString = `${currentHours}:${currentMinutes}`;
        const currentSeconds = now.getSeconds();

        // Check if times match AND it is the 0th second (so it triggers once)
        if (currentTimeString === alarmTime && currentSeconds === 0) {
            startAlarmRinging();
        }
    }
}, 1000);