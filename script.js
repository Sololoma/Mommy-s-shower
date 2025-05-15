// === Firebase Setup ===
const firebaseConfig = {
  apiKey: "AIzaSyAT41gZqLdcslEXc5xSRbDT7TaN_j0LkKc",
  authDomain: "showersync.firebaseapp.com",
  databaseURL: "https://showersync-default-rtdb.firebaseio.com",
  projectId: "showersync",
  storageBucket: "showersync.appspot.com",
  messagingSenderId: "156071634432",
  appId: "1:156071634432:web:3506d424e2cb98d861e960",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// === Session Management ===
let sessionId = localStorage.getItem("sessionId") || generateSessionId();
localStorage.setItem("sessionId", sessionId);
document.getElementById(
  "sessionIdDisplay"
).textContent = `Session ID: ${sessionId}`;

// Join modal
document.getElementById("show-join-modal").addEventListener("click", () => {
  document.getElementById("join-modal").style.display = "flex";
});

document.getElementById("close-modal").addEventListener("click", () => {
  document.getElementById("join-modal").style.display = "none";
});

document.getElementById("join-btn").addEventListener("click", () => {
  const inputId = document.getElementById("session-id-input").value.trim();
  if (inputId) {
    sessionId = inputId;
    localStorage.setItem("sessionId", sessionId);
    document.getElementById(
      "sessionIdDisplay"
    ).textContent = `Session ID: ${sessionId}`;
    document.getElementById("join-modal").style.display = "none";
    loadSessionData();
  }
});

function generateSessionId() {
  return "sess-" + Math.random().toString(36).substring(2, 10);
}

// === Timer Variables ===
let baseTime = 15 * 60;
let additionalTime = 0;
let totalTime = baseTime;
let remainingTime = totalTime;
let timerInterval = null;
let isRunning = false;
let penalty = 0;

// === Rituals Logic ===
let totalTributes = 0;
const ritualCheckboxes = document.querySelectorAll(
  ".ritual-checklist input[type='checkbox']"
);
ritualCheckboxes.forEach((checkbox) => {
  checkbox.addEventListener("change", () => {
    updateAdditionalTime();
    updateTotalTime();
    updateProgress();
    updateTotalTributesFromRituals();
    saveSessionData();
  });
});

function updateAdditionalTime() {
  additionalTime = Array.from(ritualCheckboxes)
    .filter((cb) => cb.checked)
    .reduce((sum, cb) => sum + parseInt(cb.dataset.time), 0);
}

function updateTotalTime() {
  totalTime = baseTime + additionalTime * 60;
  if (!isRunning) remainingTime = totalTime;
  updateTimerDisplay();
}

function updateTotalTributesFromRituals() {
  const checkedCount = Array.from(ritualCheckboxes).filter(
    (cb) => cb.checked
  ).length;
  const tributeFromRituals = checkedCount * 50;
  const tributeFromButtons = totalTributesFromButtons;
  totalTributes = tributeFromButtons + tributeFromRituals;
  document.getElementById("totalTributes").textContent = totalTributes;
}

// === Timer Functions ===
document.getElementById("startTimer").addEventListener("click", startTimer);
document.getElementById("pauseTimer").addEventListener("click", pauseTimer);
document.getElementById("resetTimer").addEventListener("click", resetTimer);

function startTimer() {
  if (isRunning) return;
  isRunning = true;
  timerInterval = setInterval(() => {
    remainingTime--;
    if (remainingTime < 0) {
      penalty++;
      updatePenalty();
    }
    updateTimerDisplay();
    updateProgress();
    saveSessionData();
  }, 1000);
}

function pauseTimer() {
  clearInterval(timerInterval);
  isRunning = false;
}

function resetTimer() {
  pauseTimer();
  updateAdditionalTime();
  updateTotalTime();
  penalty = 0;
  updatePenalty();
  updateProgress();
  saveSessionData();
}

function updateTimerDisplay() {
  const min = Math.floor(Math.max(remainingTime, 0) / 60);
  const sec = Math.max(remainingTime, 0) % 60;
  document.getElementById("timer").textContent = `${min
    .toString()
    .padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

function updatePenalty() {
  document.getElementById("penaltyAmount").textContent = penalty * 20;
}

// === Progress Bar ===
function updateProgress() {
  const ritualsCompleted = Array.from(ritualCheckboxes).filter(
    (cb) => cb.checked
  ).length;
  const ritualProgress = ritualsCompleted * 25;
  document.getElementById("progressBar").style.width = `${ritualProgress}%`;
  document.getElementById(
    "progressText"
  ).textContent = `${ritualProgress}% completed`;
}

// === Tribute Buttons ===
let totalTributesFromButtons = 0;
document.querySelectorAll(".tribute-btn").forEach((button) => {
  button.addEventListener("click", () => {
    const amount = parseInt(button.closest(".tribute-option").dataset.amount);
    totalTributesFromButtons += amount;
    updateTotalTributesFromRituals();
    saveSessionData();
  });
});

// === Firebase Sync ===
function saveSessionData() {
  const data = {
    remainingTime,
    additionalTime,
    totalTributesFromButtons,
    penalty,
    rituals: Array.from(ritualCheckboxes).map((cb) => cb.checked),
    isRunning,
  };
  db.ref(`sessions/${sessionId}`).set(data);
}

function loadSessionData() {
  db.ref(`sessions/${sessionId}`).on("value", (snapshot) => {
    const data = snapshot.val();
    if (data) {
      remainingTime = data.remainingTime;
      additionalTime = data.additionalTime;
      penalty = data.penalty;
      totalTributesFromButtons = data.totalTributesFromButtons || 0;
      isRunning = data.isRunning;

      ritualCheckboxes.forEach((cb, i) => {
        cb.checked = data.rituals[i] || false;
      });

      updateTotalTime();
      updatePenalty();
      updateTimerDisplay();
      updateProgress();
      updateTotalTributesFromRituals();

      if (isRunning) {
        startTimer();
      } else {
        pauseTimer();
      }
    }
  });
}

// === Init ===
updateAdditionalTime();
updateTotalTime();
updateProgress();
updateTimerDisplay();
updatePenalty();
updateTotalTributesFromRituals();
loadSessionData();
