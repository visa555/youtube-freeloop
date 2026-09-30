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
  const segmentsSection = document.getElementById("segmentsSection");
  if (segmentsSection) {
    segmentsSection.classList.remove("hidden");
  }

}

function createPlayer(videoId) {
  document.getElementById("player").classList.add("loaded");

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

function setSegmentEnd(index, timeStr) {
  let endTime = timeToSeconds(timeStr);
  if (player && player.getDuration) {
    const duration = player.getDuration();
    if (duration && endTime >= duration) {
      endTime = Math.max(0, Math.floor(duration) - 1);
    }
  }
  segments[index].end = endTime;
  renderSegments();
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
  const addSegmentBtnWrapper = document.getElementById("addSegmentBtnWrapper");
  const controlsSaveBtn = document.getElementById("controlsSaveBtn");
  wrap.innerHTML = "";

  // Show/hide empty state and Add Segment button
  if (emptyState) {
    emptyState.style.display = segments.length === 0 ? "block" : "none";
  }
  if (addSegmentBtnWrapper) {
    addSegmentBtnWrapper.classList.toggle("hidden", segments.length === 0);
  }
  // Show/hide Save button based on segments count
  if (controlsSaveBtn) {
    controlsSaveBtn.classList.toggle("hidden", segments.length === 0);
    controlsSaveBtn.classList.toggle("flex", segments.length > 0);
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
                onchange="setSegmentEnd(${i}, this.value)"
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
              onclick="stopSegment(${i})"
              class="segment-btn segment-btn-stop ${isActive ? "" : "hidden"}"
              title="Stop"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="1"/>
              </svg>
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

  // ตรวจสอบและปรับค่า end ถ้ามากกว่าหรือเท่ากับความยาวคลิป
  const duration = player.getDuration();
  if (duration && currentSegment.end >= duration) {
    currentSegment.end = Math.max(0, Math.floor(duration) - 1);
    segments[index].end = currentSegment.end;
    renderSegments();
  }

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

function stopSegment(index) {
  if (activeSegmentIndex === index) {
    stopPlayback();
  }
}

function toggleLoop(btn) {
  loopEnabled = !loopEnabled;
  renderSegments();
}

function setSpeed(speed) {
  if (player) player.setPlaybackRate(Number(speed));
  const val = Number(speed);
  const label = document.getElementById("speedLabel");
  if (label) label.textContent = val.toFixed(2).replace(/\.?0+$/, "") + "x";
  document.getElementById("speedDecBtn").disabled = val <= 0.25;
  document.getElementById("speedIncBtn").disabled = val >= 1;
}

function adjustSpeed(delta) {
  const slider = document.getElementById("speedSlider");
  if (!slider) return;
  const newVal = Math.min(1, Math.max(0.25, Math.round((Number(slider.value) + delta) * 100) / 100));
  slider.value = newVal;
  setSpeed(newVal);
}

/* ---------- Playlist ---------- */
let overwritePlaylistId = null;
let currentPlaylistId = null;

function getPlaylists() {
  return JSON.parse(localStorage.getItem("guitarPlaylists") || "[]");
}

function savePlaylists(playlists) {
  localStorage.setItem("guitarPlaylists", JSON.stringify(playlists));
}

function openSavePlaylistModal() {
  if (currentPlaylistId) {
    const playlists = getPlaylists();
    const idx = playlists.findIndex(p => p.id === currentPlaylistId);
    if (idx !== -1) {
      playlists[idx].url = document.getElementById("youtubeUrl").value;
      playlists[idx].segments = JSON.parse(JSON.stringify(segments));
      playlists[idx].savedAt = new Date().toISOString();
      savePlaylists(playlists);
      updatePlaylistButtonsVisibility();
      showToast(`บันทึกทับ "${playlists[idx].name}" เรียบร้อย!`);
      return;
    }
  }
  overwritePlaylistId = null;
  const url = document.getElementById("youtubeUrl").value;
  document.getElementById("playlistUrlPreview").textContent = url || "(ยังไม่ได้เลือกวิดีโอ)";
  document.getElementById("playlistNameInput").value = "";
  document.getElementById("confirmSaveBtn").textContent = "บันทึก";
  renderExistingPlaylistsInModal();
  document.getElementById("savePlaylistModal").classList.remove("hidden");
  document.body.style.overflow = "hidden";
  setTimeout(() => document.getElementById("playlistNameInput").focus(), 50);
}

function renderExistingPlaylistsInModal() {
  const playlists = getPlaylists();
  const section = document.getElementById("existingPlaylistsSection");
  const list = document.getElementById("existingPlaylistsList");
  if (playlists.length === 0) {
    section.classList.add("hidden");
    return;
  }
  section.classList.remove("hidden");
  list.innerHTML = playlists.map(p => {
    const segCount = (p.segments || []).length;
    return `<button onclick="selectOverwritePlaylist('${p.id}')" id="ow-${p.id}"
      class="w-full text-left px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500 bg-white dark:bg-gray-700/50 transition-all text-sm flex items-center justify-between gap-2">
      <span class="font-medium text-gray-800 dark:text-gray-100 truncate">${escapeHtml(p.name)}</span>
      <span class="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">${segCount} seg</span>
    </button>`;
  }).join("");
}

function selectOverwritePlaylist(id) {
  overwritePlaylistId = id;
  const playlist = getPlaylists().find(p => p.id === id);
  if (playlist) {
    document.getElementById("playlistNameInput").value = playlist.name;
  }
  document.getElementById("confirmSaveBtn").textContent = "บันทึกทับ";
  document.querySelectorAll("#existingPlaylistsList button").forEach(btn => {
    const selected = btn.id === `ow-${id}`;
    btn.classList.toggle("border-purple-500", selected);
    btn.classList.toggle("dark:border-purple-400", selected);
    btn.classList.toggle("bg-purple-50", selected);
    btn.classList.toggle("dark:bg-purple-900/30", selected);
  });
}

function clearOverwriteSelection() {
  if (!overwritePlaylistId) return;
  overwritePlaylistId = null;
  document.getElementById("confirmSaveBtn").textContent = "บันทึก";
  document.querySelectorAll("#existingPlaylistsList button").forEach(btn => {
    btn.classList.remove("border-purple-500", "dark:border-purple-400", "bg-purple-50", "dark:bg-purple-900/30");
  });
}

function closeSavePlaylistModal() {
  document.getElementById("savePlaylistModal").classList.add("hidden");
  document.body.style.overflow = "auto";
}

function confirmSavePlaylist() {
  const name = document.getElementById("playlistNameInput").value.trim();
  if (!name) {
    document.getElementById("playlistNameInput").focus();
    return;
  }
  const url = document.getElementById("youtubeUrl").value;
  const playlists = getPlaylists();

  if (overwritePlaylistId) {
    const idx = playlists.findIndex(p => p.id === overwritePlaylistId);
    if (idx !== -1) {
      playlists[idx].name = name;
      playlists[idx].url = url;
      playlists[idx].segments = JSON.parse(JSON.stringify(segments));
      playlists[idx].savedAt = new Date().toISOString();
      savePlaylists(playlists);
      closeSavePlaylistModal();
      updatePlaylistButtonsVisibility();
      showToast("บันทึกทับ Playlist เรียบร้อย!");
      return;
    }
  }

  const newId = Date.now().toString();
  playlists.unshift({
    id: newId,
    name,
    url,
    segments: JSON.parse(JSON.stringify(segments)),
    savedAt: new Date().toISOString(),
  });
  currentPlaylistId = newId;
  savePlaylists(playlists);
  closeSavePlaylistModal();
  updatePlaylistButtonsVisibility();
  showToast("บันทึก Playlist เรียบร้อย!");
}

function openPlaylistsModal() {
  renderPlaylistsModal();
  document.getElementById("playlistsModal").classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closePlaylistsModal() {
  document.getElementById("playlistsModal").classList.add("hidden");
  document.body.style.overflow = "auto";
}

function loadPlaylist(id) {
  const playlist = getPlaylists().find(p => p.id === id);
  if (!playlist) return;
  currentPlaylistId = id;
  document.getElementById("youtubeUrl").value = playlist.url;
  segments = JSON.parse(JSON.stringify(playlist.segments || []));
  if (playlist.url) loadVideo();
  renderSegments();
  closePlaylistsModal();
}

function deletePlaylist(id) {
  if (!confirm("ต้องการลบ Playlist นี้?")) return;
  savePlaylists(getPlaylists().filter(p => p.id !== id));
  renderPlaylistsModal();
  updatePlaylistButtonsVisibility();
}

function renderPlaylistsModal() {
  const container = document.getElementById("playlistsList");
  const playlists = getPlaylists();

  if (playlists.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 text-gray-400 dark:text-gray-500">
        <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="currentColor" viewBox="0 0 24 24">
          <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
        </svg>
        <p class="font-medium">ยังไม่มี Playlist</p>
        <p class="text-sm mt-1">กดปุ่ม Save เพื่อบันทึก Playlist แรก</p>
      </div>`;
    return;
  }

  container.innerHTML = playlists.map(p => {
    const date = new Date(p.savedAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });
    const segCount = (p.segments || []).length;
    return `
      <div class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500 transition-all">
        <div class="flex items-start gap-3">
          <div class="flex-1 min-w-0">
            <h3 class="font-semibold text-gray-800 dark:text-gray-100">${escapeHtml(p.name)}</h3>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">${escapeHtml(p.url || "")}</p>
            <div class="flex items-center gap-3 mt-2">
              <span class="text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full font-medium">${segCount} segment${segCount !== 1 ? "s" : ""}</span>
              <span class="text-xs text-gray-400 dark:text-gray-500">${date}</span>
            </div>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0 mt-1">
            <button onclick="loadPlaylist('${p.id}')" class="px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium rounded-lg transition-all flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              Load
            </button>
            <button onclick="deletePlaylist('${p.id}')" class="p-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-500 rounded-lg transition-all">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
            </button>
          </div>
        </div>
      </div>`;
  }).join("");
}

function escapeHtml(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.style.cssText = "position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%) translateY(1rem);padding:0.75rem 1.5rem;background:#10b981;color:white;font-weight:500;border-radius:0.75rem;box-shadow:0 4px 12px rgba(0,0,0,.2);z-index:200;opacity:0;transition:all .3s ease;white-space:nowrap";
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateX(-50%) translateY(0)";
  });
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(-50%) translateY(1rem)";
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

function migrateLegacyPreset() {
  const legacy = localStorage.getItem("guitarPractice");
  if (!legacy) return;
  try {
    const data = JSON.parse(legacy);
    if (data && data.url && getPlaylists().length === 0) {
      savePlaylists([{
        id: Date.now().toString(),
        name: "Saved Preset",
        url: data.url,
        segments: data.segments || [],
        savedAt: new Date().toISOString(),
      }]);
    }
  } catch (e) {}
  localStorage.removeItem("guitarPractice");
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

function updatePlaylistButtonsVisibility() {
  const hasPlaylists = getPlaylists().length > 0;

  const headerPlaylistsBtn = document.getElementById("headerPlaylistsBtn");
  if (headerPlaylistsBtn) {
    headerPlaylistsBtn.classList.toggle("hidden", !hasPlaylists);
    headerPlaylistsBtn.classList.toggle("flex", hasPlaylists);
  }

  const emptyStateLoadBtn = document.getElementById("emptyStateLoadBtn");
  if (emptyStateLoadBtn) {
    emptyStateLoadBtn.classList.toggle("hidden", !hasPlaylists);
    emptyStateLoadBtn.classList.toggle("inline-flex", hasPlaylists);
  }

}

/* ---------- What's New ---------- */
function closeWhatsNew() {
  localStorage.setItem("seenPlaylistFeature", "1");
  document.getElementById("whatsNewModal").classList.add("hidden");
  document.body.style.overflow = "auto";
}

function showWhatsNewIfNeeded() {
  if (localStorage.getItem("seenPlaylistFeature")) return;
  document.getElementById("whatsNewModal").classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

// Initialize on load
document.addEventListener("DOMContentLoaded", () => {
  initDarkMode();
  migrateLegacyPreset();
  renderSegments();
  updatePlaylistButtonsVisibility();
  showWhatsNewIfNeeded();
});
