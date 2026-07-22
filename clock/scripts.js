// scripts.js

// State Variables
let is24Hour = false;
let timeOffsetMs = 0; // Difference between real time and user's custom time
let pipIntervalId = null;

// DOM Elements
const timeDisplay = document.getElementById('timeDisplay');
const ampmDisplay = document.getElementById('ampmDisplay');
const dateDisplay = document.getElementById('dateDisplay');
const secondsBar = document.getElementById('secondsBar');
const formatBtn = document.getElementById('formatBtn');
const editBtn = document.getElementById('editBtn');
const editPanel = document.getElementById('editPanel');
const customTimeInput = document.getElementById('customTime');
const saveTimeBtn = document.getElementById('saveTimeBtn');
const resetTimeBtn = document.getElementById('resetTimeBtn');
const offsetStatus = document.getElementById('offsetStatus');

// Format Numbers
const pad = (num) => String(num).padStart(2, '0');

// --- CLOCK ENGINE ---

function updateClock() {
    // Apply user's custom offset to the real time
    const now = new Date(Date.now() + timeOffsetMs);
    
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    let ampm = "";

    // 12H / 24H Logic
    if (!is24Hour) {
        ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12;
        hours = hours ? hours : 12; // 0 becomes 12
        ampmDisplay.textContent = ampm;
        ampmDisplay.style.display = "inline-block";
    } else {
        ampmDisplay.style.display = "none";
    }

    // Update Text
    const timeString = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    timeDisplay.textContent = timeString;

    // Update Date
    const options = { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' };
    dateDisplay.textContent = now.toLocaleDateString(undefined, options);

    // Update Seconds Bar (Visual representation of the minute)
    const secondPercentage = (seconds / 60) * 100;
    secondsBar.style.width = `${secondPercentage}%`;
}

// Run clock every 50ms for smooth UI updates
setInterval(updateClock, 50);

// --- SETTINGS CONTROLS ---

// Toggle 12H/24H
formatBtn.addEventListener('click', () => {
    is24Hour = !is24Hour;
    formatBtn.textContent = is24Hour ? "12H" : "24H";
});

// Toggle Edit Panel
editBtn.addEventListener('click', () => {
    editPanel.classList.toggle('hidden');
    // Pre-fill input with current displayed time
    if (!editPanel.classList.contains('hidden')) {
        const current = new Date(Date.now() + timeOffsetMs);
        customTimeInput.value = `${pad(current.getHours())}:${pad(current.getMinutes())}:${pad(current.getSeconds())}`;
    }
});

// Set Custom Time
saveTimeBtn.addEventListener('click', () => {
    if (!customTimeInput.value) return;

    // Parse the input time (HH:MM:SS)
    const [h, m, s] = customTimeInput.value.split(':').map(Number);
    
    // Create a Date object for today with the custom time
    const customDate = new Date();
    customDate.setHours(h, m, s || 0, 0);

    // Calculate the difference between real time and custom time
    timeOffsetMs = customDate.getTime() - Date.now();
    
    offsetStatus.textContent = "Using Custom Time Offset";
    offsetStatus.style.color = "#4facfe";
    editPanel.classList.add('hidden');
});

// Reset to System Time
resetTimeBtn.addEventListener('click', () => {
    timeOffsetMs = 0;
    offsetStatus.textContent = "Using System Time";
    offsetStatus.style.color = "#888";
    customTimeInput.value = "";
    editPanel.classList.add('hidden');
});

// --- PICTURE-IN-PICTURE (PIN) MODE ---

const pipCanvas = document.getElementById('pipCanvas');
const pipCtx = pipCanvas.getContext('2d');
const pipVideo = document.getElementById('pipVideo');

function drawPipCanvas() {
    const now = new Date(Date.now() + timeOffsetMs);
    let h = now.getHours();
    const m = pad(now.getMinutes());
    const s = pad(now.getSeconds());
    let ampm = "";

    if (!is24Hour) {
        ampm = h >= 12 ? " PM" : " AM";
        h = h % 12 || 12;
    }
    const timeStr = `${pad(h)}:${m}:${s}${ampm}`;

    // Draw Background
    pipCtx.fillStyle = "#141E30";
    pipCtx.fillRect(0, 0, pipCanvas.width, pipCanvas.height);

    // Draw Time Text
    pipCtx.fillStyle = "#00f2fe";
    pipCtx.font = "bold 55px Segoe UI, sans-serif";
    pipCtx.textAlign = "center";
    pipCtx.textBaseline = "middle";
    pipCtx.fillText(timeStr, pipCanvas.width / 2, pipCanvas.height / 2.3);

    // Draw Date Text
    pipCtx.fillStyle = "#cccccc";
    pipCtx.font = "20px Segoe UI, sans-serif";
    const dateStr = now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    pipCtx.fillText(dateStr, pipCanvas.width / 2, pipCanvas.height / 1.3);
}

document.getElementById('pipBtn').addEventListener('click', async () => {
    try {
        if (document.pictureInPictureElement) {
            await document.exitPictureInPicture();
            clearInterval(pipIntervalId);
        } else {
            drawPipCanvas(); // Initial draw
            const stream = pipCanvas.captureStream(10); // 10fps
            pipVideo.srcObject = stream;
            await pipVideo.play();
            await pipVideo.requestPictureInPicture();
            
            // Keep drawing to canvas while pinned
            pipIntervalId = setInterval(drawPipCanvas, 500); // 2 times a second is enough for clocks
        }
    } catch (err) {
        console.error(err);
        alert("Your browser does not support the Picture-in-Picture API for this feature.");
    }
});

// Clean up interval if PiP is closed by the browser's native 'X' button
pipVideo.addEventListener('leavepictureinpicture', () => {
    clearInterval(pipIntervalId);
});