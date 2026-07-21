// scripts.js

// State variables
let typedDigits = ""; 
let totalDurationMs = 0;
let remainingMs = 0;
let targetEndTime = 0;
let isPaused = false;
let isRunning = false;
let animationFrameId = null;
let pipIntervalId = null;
let lastTickSecond = -1;

let audioCtx = null;
let alarmInterval = null;

// DOM Elements
const timeDisplay = document.getElementById('timeDisplay');
const typeHint = document.getElementById('typeHint');
const keypad = document.getElementById('keypad');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const stopAlarmBtn = document.getElementById('stopAlarmBtn');

// Tick Settings
const tickToggle = document.getElementById('tickToggle');
const tickIntervalInput = document.getElementById('tickInterval');

// SVG Ring
const circle = document.getElementById('progressCircle');
const radius = circle.r.baseVal.value;
const circumference = 2 * Math.PI * radius;
circle.style.strokeDasharray = `${circumference} ${circumference}`;
circle.style.strokeDashoffset = 0;

// Request notification permission
if ("Notification" in window && Notification.permission !== "granted") {
    Notification.requestPermission();
}

function setProgress(percent) {
    circle.style.strokeDashoffset = circumference - (percent * circumference);
}

// Convert "100" -> 00:01:00.00
function renderTypedTime() {
    const padded = typedDigits.padStart(6, '0');
    const h = padded.slice(0, 2);
    const m = padded.slice(2, 4);
    const s = padded.slice(4, 6);

    timeDisplay.innerHTML = `${h}:${m}:${s}<span class="ms">.00</span>`;
    
    if (typedDigits.length > 0) timeDisplay.classList.remove('placeholder');
    else timeDisplay.classList.add('placeholder');
}

// Typing Handlers
function appendDigit(digit) {
    if (isRunning || isPaused || typedDigits.length >= 6) return;
    typedDigits += digit;
    renderTypedTime();
}
function backspaceDigit() {
    if (isRunning || isPaused) return;
    typedDigits = typedDigits.slice(0, -1);
    renderTypedTime();
}
function clearDigits() {
    if (isRunning || isPaused) return;
    typedDigits = "";
    renderTypedTime();
}

document.addEventListener('keydown', (e) => {
    if (isRunning || isPaused) return;
    if (e.key >= '0' && e.key <= '9') appendDigit(e.key);
    if (e.key === 'Backspace') backspaceDigit();
    if (e.key === 'Escape') clearDigits();
    if (e.key === 'Enter') startTimer();
});

// Format remaining milliseconds to HH:MM:SS.ms
function formatTimeFromMs(ms) {
    const totalSecs = Math.floor(ms / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10); // 2 digits
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;

    return {
        main: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`,
        ms: `.${String(centiseconds).padStart(2, '0')}`
    };
}

// Ensure audio context is ready
function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playTickSound() {
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'square'; // 'sine' is softer, 'square' is a sharp click
    osc.frequency.value = 1000;
    
    // Very short, sharp envelope for a "tick"
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
}

function startTimer() {
    if (!isPaused) {
        const padded = typedDigits.padStart(6, '0');
        const h = parseInt(padded.slice(0, 2)) || 0;
        const m = parseInt(padded.slice(2, 4)) || 0;
        const s = parseInt(padded.slice(4, 6)) || 0;

        totalDurationMs = ((h * 3600) + (m * 60) + s) * 1000;
        remainingMs = totalDurationMs;

        if (totalDurationMs <= 0) {
            alert("Please type a valid time duration!");
            return;
        }
        lastTickSecond = Math.ceil(remainingMs / 1000);
    }

    // Set end time using Date.now() for high precision
    targetEndTime = Date.now() + remainingMs;

    keypad.classList.add('hidden');
    typeHint.classList.add('hidden');
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    isPaused = false;
    isRunning = true;
    initAudio();

    // Start UI update loop
    animationFrameId = requestAnimationFrame(updateLoop);
    
    // Start PiP canvas update loop (slower to save CPU)
    if(document.pictureInPictureElement) pipIntervalId = setInterval(updatePipCanvas, 100);
}

function updateLoop() {
    if (!isRunning) return;

    remainingMs = Math.max(0, targetEndTime - Date.now());
    
    // Update Display
    const formatted = formatTimeFromMs(remainingMs);
    timeDisplay.innerHTML = `${formatted.main}<span class="ms">${formatted.ms}</span>`;
    setProgress(remainingMs / totalDurationMs);

    // Document title doesn't need ms, updates every integer second
    const currentSecond = Math.ceil(remainingMs / 1000);
    if (currentSecond !== lastTickSecond) {
        document.title = `(${formatted.main}) Timer`;
        
        // --- TICK SOUND LOGIC ---
        let elapsedSecs = Math.floor(totalDurationMs / 1000) - currentSecond;
        let tickInterval = parseInt(tickIntervalInput.value) || 1;
        
        if (tickToggle.checked && elapsedSecs > 0 && (elapsedSecs % tickInterval === 0) && remainingMs > 0) {
            playTickSound();
        }
        
        lastTickSecond = currentSecond;
    }

    if (remainingMs <= 0) {
        timerFinished();
    } else {
        animationFrameId = requestAnimationFrame(updateLoop);
    }
}

function pauseTimer() {
    isRunning = false;
    isPaused = true;
    cancelAnimationFrame(animationFrameId);
    clearInterval(pipIntervalId);
    
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    startBtn.textContent = "Resume";
}

function resetTimer() {
    isRunning = false;
    isPaused = false;
    cancelAnimationFrame(animationFrameId);
    clearInterval(pipIntervalId);
    stopAlarmSound();

    typedDigits = "";
    totalDurationMs = 0;
    remainingMs = 0;

    renderTypedTime();
    keypad.classList.remove('hidden');
    typeHint.classList.remove('hidden');
    document.title = "Pro Timer";
    setProgress(1);

    startBtn.disabled = false;
    pauseBtn.disabled = true;
    startBtn.textContent = "Start";
}

// Alarm logic
function playAlarmSound() {
    initAudio();
    let toggle = false;
    alarmInterval = setInterval(() => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = toggle ? 880 : 660;
        toggle = !toggle;
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
    }, 400);
}

function timerFinished() {
    isRunning = false;
    timeDisplay.innerHTML = `00:00:00<span class="ms">.00</span>`;
    playAlarmSound();
    stopAlarmBtn.classList.remove('hidden');
    document.title = "⏰ TIME IS UP!";
    if (document.pictureInPictureElement) updatePipCanvas();

    if (Notification.permission === "granted") {
        new Notification("Time's Up!", { body: "Your countdown timer has completed." });
    }
}

function stopAlarmSound() {
    if (alarmInterval) clearInterval(alarmInterval);
    stopAlarmBtn.classList.add('hidden');
}

// --- FULLSCREEN & PICTURE-IN-PICTURE ---
document.getElementById('fullscreenBtn').addEventListener('click', () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
});

const pipCanvas = document.getElementById('pipCanvas');
const pipCtx = pipCanvas.getContext('2d');
const pipVideo = document.getElementById('pipVideo');

function updatePipCanvas() {
    pipCtx.fillStyle = "#0f2027";
    pipCtx.fillRect(0, 0, 300, 300);

    const timeTxt = remainingMs <= 0 ? "00:00:00" : formatTimeFromMs(remainingMs).main;
    
    pipCtx.fillStyle = remainingMs <= 0 ? "#ff0055" : "#00d2ff";
    pipCtx.font = "bold 40px Segoe UI, sans-serif";
    pipCtx.textAlign = "center";
    pipCtx.textBaseline = "middle";
    pipCtx.fillText(timeTxt, 150, 150);
}

document.getElementById('pipBtn').addEventListener('click', async () => {
    try {
        if (document.pictureInPictureElement) {
            await document.exitPictureInPicture();
            clearInterval(pipIntervalId);
        } else {
            updatePipCanvas();
            const stream = pipCanvas.captureStream(10); // 10fps to save CPU in background
            pipVideo.srcObject = stream;
            await pipVideo.play();
            await pipVideo.requestPictureInPicture();
            if(isRunning) pipIntervalId = setInterval(updatePipCanvas, 100);
        }
    } catch (err) {
        alert("Picture-in-Picture float mode is not supported by your browser.");
    }
});

// Controls Listeners
startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);
stopAlarmBtn.addEventListener('click', stopAlarmSound);