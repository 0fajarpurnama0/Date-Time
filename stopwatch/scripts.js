// scripts.js

// State variables
let startTime = 0;
let elapsedTime = 0;
let timerInterval;
let running = false;
let lapCount = 1;

// DOM Elements
const display = document.getElementById('display');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const lapBtn = document.getElementById('lapBtn');
const resetBtn = document.getElementById('resetBtn');
const lapsList = document.getElementById('lapsList');

// Format time to HH:MM:SS.ms
function formatTime(time) {
    let hours = Math.floor(time / 3600000);
    let minutes = Math.floor((time % 3600000) / 60000);
    let seconds = Math.floor((time % 60000) / 1000);
    let milliseconds = Math.floor((time % 1000) / 10); // 2 digits for centiseconds

    // Pad with leading zeros
    return (
        String(hours).padStart(2, '0') + ':' +
        String(minutes).padStart(2, '0') + ':' +
        String(seconds).padStart(2, '0') + '.' +
        String(milliseconds).padStart(2, '0')
    );
}

// Update the display
function printTime() {
    elapsedTime = Date.now() - startTime;
    display.textContent = formatTime(elapsedTime);
}

// Button Functions
function startTimer() {
    if (!running) {
        // Calculate when we started (accounting for past elapsed time if paused)
        startTime = Date.now() - elapsedTime;
        
        // Update display every 10 milliseconds
        timerInterval = setInterval(printTime, 10);
        running = true;

        // Manage button states
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        lapBtn.disabled = false;
    }
}

function pauseTimer() {
    if (running) {
        clearInterval(timerInterval);
        running = false;

        // Manage button states
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        lapBtn.disabled = true;
        startBtn.textContent = "Resume";
    }
}

function resetTimer() {
    clearInterval(timerInterval);
    running = false;
    elapsedTime = 0;
    lapCount = 1;
    
    display.textContent = "00:00:00.00";
    lapsList.innerHTML = ""; // Clear laps
    
    // Manage button states
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    lapBtn.disabled = true;
    startBtn.textContent = "Start";
}

function recordLap() {
    if (running) {
        const li = document.createElement('li');
        const lapNumber = document.createElement('span');
        const lapTime = document.createElement('span');

        lapNumber.textContent = `Lap ${lapCount}`;
        lapTime.textContent = formatTime(elapsedTime);

        li.appendChild(lapNumber);
        li.appendChild(lapTime);
        
        // Add to top of list
        lapsList.insertBefore(li, lapsList.firstChild); 
        lapCount++;
    }
}

// Event Listeners
startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);
lapBtn.addEventListener('click', recordLap);