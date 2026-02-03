let player;
let pendingVideoId = null;

let segments = [];
let currentSegment = null;
let activeSegmentIndex = null;

let loopEnabled = false;
let isPaused = false;
let timer = null;

/* ---------- YouTube API ---------- */
function onYouTubeIframeAPIReady() {
  if (pendingVideoId) {
    createPlayer(pendingVideoId);
    pendingVideoId = null;
    showControls();
  }
}

function loadVideo() {
  const url = document.getElementById("youtubeUrl").value;
  const videoId = extractVideoId(url);

  if (!videoId) {
    alert("URL YouTube ไม่ถูกต้อง");
    return;
  }

  if (!window.YT || !YT.Player) {
    pendingVideoId = videoId;
    return;
  }

  createPlayer(videoId);
  showControls();
}

function showControls() {
  const controls = document.getElementById("controls");
  if (controls) {
    controls.classList.remove("hidden");
  }
  const stopBtn = document.getElementById("stopBtn");
  if (stopBtn) {
    stopBtn.classList.remove("hidden");
  }
}

function createPlayer(videoId) {
  if (player) {
    player.loadVideoById(videoId);
    return;
  }

  player = new YT.Player("player", {
    height: "315",
    width: "560",
    videoId,
    playerVars: { playsinline: 1 },
  });
}

/* ---------- Utility ---------- */
function extractVideoId(url) {
  const reg = /(?:youtube\.com\/(?:.*v=|v\/|embed\/)|youtu\.be\/)([^&?/]+)/;
  const m = url.match(reg);
  return m ? m[1] : null;
}

function timeToSeconds(t) {
  const p = t.split(":").map(Number);
  if (p.length === 2 && !p.some(isNaN)) {
    return p[0] * 60 + p[1];
  }
  return 0;
}

function secondsToTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/* ---------- Segments ---------- */
function addSegment(data = {}) {
  segments.push({
    title: data.title || "Segment Title",
    start: data.start || 0,
    end: data.end || 10,
  });
  renderSegments();
}

function deleteSegment(index) {
  stopPlayback();
  segments.splice(index, 1);
  renderSegments();
}

function renderSegments() {
  const wrap = document.getElementById("segments");
  const emptyState = document.getElementById("empty-state");
  wrap.innerHTML = "";

  // Show/hide empty state
  if (emptyState) {
    emptyState.style.display = segments.length === 0 ? "block" : "none";
  }

  segments.forEach((seg, i) => {
    const isActive = activeSegmentIndex === i;
    const isPlaying = isActive && !isPaused;
    const isLooping = loopEnabled && isActive;

    wrap.innerHTML += `
      <div class="segment ${isActive ? "active" : ""}">
        <div class="flex flex-col lg:flex-row lg:items-center gap-3">
          <!-- Title Input -->
          <input 
            value="${seg.title}"
            onchange="segments[${i}].title=this.value"
            class="segment-input segment-input-title flex-1 min-w-0 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
            placeholder="Segment name..."
          >

          <!-- Time Inputs & Actions -->
          <div class="flex flex-wrap items-center gap-3">
            <!-- Time Inputs -->
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-500 dark:text-gray-400 font-medium">Start</span>
              <input 
                type="text" 
                value="${secondsToTime(seg.start)}"
                onchange="segments[${i}].start=timeToSeconds(this.value)"
                class="segment-input segment-input-time w-20 text-center px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all font-mono"
              >
            </div>
            
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-500 dark:text-gray-400 font-medium">End</span>
              <input 
                type="text" 
                value="${secondsToTime(seg.end)}"
                onchange="segments[${i}].end=timeToSeconds(this.value)"
                class="segment-input segment-input-time w-20 text-center px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all font-mono"
              >
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center gap-2 ml-auto lg:ml-0">
            <button 
              onclick="playSegment(${i})"
              class="segment-btn segment-btn-play ${isPlaying ? "playing" : ""}"
              title="${isPlaying ? "Pause" : "Play"}"
            >
              ${
                isPlaying
                  ? '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>'
                  : '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>'
              }
            </button>

            <button 
              onclick="toggleLoop(this)"
              class="segment-btn segment-btn-loop ${isLooping ? "loop-on" : ""}"
              title="Toggle Loop"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46A7.93 7.93 0 0020 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74A7.93 7.93 0 004 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
              </svg>
            </button>

            <button 
              onclick="deleteSegment(${i})"
              class="segment-btn segment-btn-delete"
              title="Delete"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
              </svg>
            </button>
            </div>
          </div>
        </div>
      </div>
    `;
  });
}

function playSegment(index) {
  if (!player) return;

  // กด segment เดิม → pause / resume
  if (activeSegmentIndex === index) {
    if (isPaused) {
      player.playVideo();
      isPaused = false;
    } else {
      player.pauseVideo();
      isPaused = true;
    }
    renderSegments();
    return;
  }

  // เล่น segment ใหม่
  clearInterval(timer);
  activeSegmentIndex = index;
  isPaused = false;
  currentSegment = segments[index];

  player.seekTo(currentSegment.start, true);
  player.playVideo();

  timer = setInterval(() => {
    if (!isPaused && player.getCurrentTime() >= currentSegment.end) {
      if (loopEnabled) {
        player.seekTo(currentSegment.start, true);
      } else {
        stopPlayback();
      }
    }
  }, 100);

  renderSegments();
}

/* ---------- Controls ---------- */
function stopPlayback() {
  clearInterval(timer);
  timer = null;
  currentSegment = null;
  activeSegmentIndex = null;
  isPaused = false;
  loopEnabled = false;

  if (player) player.pauseVideo();
  renderSegments();
}

function toggleLoop(btn) {
  loopEnabled = !loopEnabled;
  renderSegments();
}

function setSpeed(speed) {
  if (player) player.setPlaybackRate(Number(speed));
}

/* ---------- Preset ---------- */
function savePreset() {
  localStorage.setItem(
    "guitarPractice",
    JSON.stringify({
      url: document.getElementById("youtubeUrl").value,
      segments,
    }),
  );
  alert("Saved!");
}

function loadPreset() {
  const data = JSON.parse(localStorage.getItem("guitarPractice"));
  if (!data) return;

  document.getElementById("youtubeUrl").value = data.url;
  segments = data.segments || [];
  renderSegments();
}

/* ---------- Dark Mode ---------- */
function toggleDarkMode() {
  const html = document.documentElement;
  html.classList.toggle("dark");

  // Save preference
  const isDark = html.classList.contains("dark");
  localStorage.setItem("darkMode", isDark ? "dark" : "light");
}

// Initialize dark mode from saved preference
function initDarkMode() {
  const saved = localStorage.getItem("darkMode");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  if (saved === "light") {
    document.documentElement.classList.remove("dark");
  } else if (saved === "dark" || prefersDark) {
    document.documentElement.classList.add("dark");
  }
}

// Initialize on load
document.addEventListener("DOMContentLoaded", () => {
  initDarkMode();
  renderSegments();
});
