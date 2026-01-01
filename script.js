// --- State Management ---
const AppState = {
    logs: JSON.parse(localStorage.getItem('study_pro_logs')) || [],
    syllabus: JSON.parse(localStorage.getItem('study_pro_syllabus')) || [],
    timer: {
        interval: null,
        seconds: 0,
        isRunning: false,
        type: 'self-study',
    }
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Icons
    lucide.createIcons();
    
    // Initialize Components
    initDateDisplay();
    renderLogs();
    renderSyllabus();
    renderStats();
});

function initDateDisplay() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    
    const mobileEl = document.getElementById('current-date-mobile');
    if(mobileEl) mobileEl.innerText = new Date().toLocaleDateString();
}

// --- Navigation Logic ---
function switchTab(tabName) {
    // Hide all views
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
    
    // Show active view with animation
    const activeView = document.getElementById(`view-${tabName}`);
    activeView.classList.remove('hidden');
    activeView.classList.remove('animate-fade-in');
    void activeView.offsetWidth; // trigger reflow for restart animation
    activeView.classList.add('animate-fade-in');

    // Update Desktop Sidebar Style
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    
    // Select buttons based on index (Simple mapping)
    const sidebarBtns = document.querySelectorAll('.nav-item');
    if(tabName === 'dashboard') sidebarBtns[0].classList.add('active');
    if(tabName === 'syllabus') sidebarBtns[1].classList.add('active');
    if(tabName === 'analytics') sidebarBtns[2].classList.add('active');

    // Update Mobile Nav Style
    document.querySelectorAll('.mobile-nav-btn').forEach(btn => btn.classList.remove('active'));
    const mobileBtns = document.querySelectorAll('.mobile-nav-btn');
    if(tabName === 'dashboard') mobileBtns[0].classList.add('active');
    if(tabName === 'syllabus') mobileBtns[1].classList.add('active');
    if(tabName === 'analytics') mobileBtns[2].classList.add('active');

    // Update Header Title
    const titles = { 'dashboard': 'Dashboard', 'syllabus': 'Syllabus Tracker', 'analytics': 'Performance Analytics' };
    document.getElementById('page-title').innerText = titles[tabName];

    // Refresh stats if opening stats page
    if(tabName === 'analytics') renderStats();
}

// --- Timer System ---
function startTimer(type) {
    if (AppState.timer.isRunning) return;

    AppState.timer.type = type;
    AppState.timer.isRunning = true;

    // UI Updates
    document.getElementById('controls-start').classList.add('hidden');
    document.getElementById('controls-running').classList.remove('hidden');
    
    const statusText = document.getElementById('timer-status');
    statusText.innerText = type === 'coaching' ? 'Recording Coaching Session...' : 'Focus Mode Active';
    statusText.className = "text-indigo-600 font-bold animate-pulse";

    AppState.timer.interval = setInterval(() => {
        AppState.timer.seconds++;
        updateTimerDisplay();
    }, 1000);
}

function stopTimer() {
    clearInterval(AppState.timer.interval);
    AppState.timer.isRunning = false;

    // Save Data if meaningful duration (> 1 second)
    if (AppState.timer.seconds > 1) {
        const newLog = {
            id: Date.now(),
            date: new Date().toISOString(),
            duration: AppState.timer.seconds,
            type: AppState.timer.type,
            subject: document.getElementById('subject-select').value
        };
        AppState.logs.unshift(newLog);
        localStorage.setItem('study_pro_logs', JSON.stringify(AppState.logs));
        renderLogs();
        renderStats(); // Update sidebar progress
    }

    // Reset UI
    AppState.timer.seconds = 0;
    updateTimerDisplay();
    document.getElementById('controls-start').classList.remove('hidden');
    document.getElementById('controls-running').classList.add('hidden');
    
    const statusText = document.getElementById('timer-status');
    statusText.innerText = "Select a mode to begin";
    statusText.className = "text-slate-400 font-medium";
}

function updateTimerDisplay() {
    const hrs = Math.floor(AppState.timer.seconds / 3600).toString().padStart(2, '0');
    const mins = Math.floor((AppState.timer.seconds % 3600) / 60).toString().padStart(2, '0');
    const secs = (AppState.timer.seconds % 60).toString().padStart(2, '0');
    document.getElementById('timer-display').innerText = `${hrs}:${mins}:${secs}`;
}

// --- Logs Renderer ---
function renderLogs() {
    const list = document.getElementById('logs-list');
    list.innerHTML = '';

    if (AppState.logs.length === 0) {
        list.innerHTML = '<tr><td colspan="4" class="px-6 py-8 text-center text-slate-400 italic">No activity recorded yet. Start a session!</td></tr>';
        return;
    }

    AppState.logs.slice(0, 5).forEach(log => {
        const dateObj = new Date(log.date);
        const dateStr = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        const timeStr = dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
        const mins = Math.floor(log.duration / 60);
        
        const isSelf = log.type === 'self-study';

        const html = `
            <tr class="hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                <td class="px-6 py-4">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${isSelf ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700'}">
                        ${isSelf ? 'Self Study' : 'Coaching'}
                    </span>
                </td>
                <td class="px-6 py-4 font-medium text-slate-700">${log.subject}</td>
                <td class="px-6 py-4 text-slate-500 text-xs">
                    ${dateStr} <span class="text-slate-300 mx-1">|</span> ${timeStr}
                </td>
                <td class="px-6 py-4 text-right font-mono text-slate-600">${mins}m</td>
            </tr>
        `;
        list.innerHTML += html;
    });
}

// --- Syllabus System ---
function addSyllabusItem() {
    const input = document.getElementById('syllabus-input');
    const text = input.value.trim();
    if (!text) return;

    AppState.syllabus.push({ id: Date.now(), text: text, done: false });
    saveSyllabus();
    input.value = '';
    renderSyllabus();
}

function toggleSyllabus(id) {
    const item = AppState.syllabus.find(i => i.id === id);
    if (item) {
        item.done = !item.done;
        saveSyllabus();
        renderSyllabus();
    }
}

function deleteSyllabus(id) {
    AppState.syllabus = AppState.syllabus.filter(i => i.id !== id);
    saveSyllabus();
    renderSyllabus();
}

function saveSyllabus() {
    localStorage.setItem('study_pro_syllabus', JSON.stringify(AppState.syllabus));
}

function renderSyllabus() {
    const list = document.getElementById('syllabus-list');
    list.innerHTML = '';
    
    // Calculate Progress
    const total = AppState.syllabus.length;
    const completed = AppState.syllabus.filter(i => i.done).length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
    
    document.getElementById('syllabus-progress-text').innerText = `${percent}%`;

    AppState.syllabus.forEach(item => {
        const html = `
            <div class="group flex items-center justify-between bg-slate-50 p-4 rounded-xl border ${item.done ? 'border-green-200 bg-green-50/50' : 'border-slate-200'} transition-all hover:border-indigo-200 hover:shadow-sm">
                <label class="checkbox-wrapper flex items-center gap-4 cursor-pointer select-none">
                    <div class="relative">
                        <input type="checkbox" onchange="toggleSyllabus(${item.id})" ${item.done ? 'checked' : ''} class="peer sr-only">
                        <div class="w-6 h-6 border-2 border-slate-300 rounded-md peer-checked:bg-indigo-600 peer-checked:border-indigo-600 transition-all flex items-center justify-center bg-white">
                            <svg class="w-4 h-4 text-white hidden pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                    </div>
                    <span class="${item.done ? 'line-through text-slate-400' : 'text-slate-700 font-semibold'} text-sm">${item.text}</span>
                </label>
                <button onclick="deleteSyllabus(${item.id})" class="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
        `;
        list.innerHTML += html;
    });
    // Refresh icons
    lucide.createIcons();
}

// --- Analytics Logic ---
function renderStats() {
    const totalSelf = AppState.logs.filter(l => l.type === 'self-study').reduce((acc, curr) => acc + curr.duration, 0);
    const totalCoach = AppState.logs.filter(l => l.type === 'coaching').reduce((acc, curr) => acc + curr.duration, 0);
    const totalTime = totalSelf + totalCoach;

    // Update Number Cards
    document.getElementById('stat-self').innerText = (totalSelf / 3600).toFixed(1) + 'h';
    document.getElementById('stat-coaching').innerText = (totalCoach / 3600).toFixed(1) + 'h';

    // Update Sidebar Daily Goal (Arbitrary 6 hour goal)
    const sidebarHrs = (totalTime / 3600).toFixed(1);
    const goalHrs = 6;
    const progressPercent = Math.min((sidebarHrs / goalHrs) * 100, 100);
    
    // Safety check for elements existing
    const sbHours = document.getElementById('sidebar-hours');
    if(sbHours) sbHours.innerText = sidebarHrs + 'h';
    
    const sbProgress = document.getElementById('sidebar-progress');
    if(sbProgress) sbProgress.style.width = `${progressPercent}%`;


    // Subject Breakdown Bars
    const subjectStats = {};
    AppState.logs.forEach(log => {
        if (!subjectStats[log.subject]) subjectStats[log.subject] = 0;
        subjectStats[log.subject] += log.duration;
    });

    const barsContainer = document.getElementById('stats-bars');
    barsContainer.innerHTML = '';

    if (totalTime === 0) {
        barsContainer.innerHTML = '<p class="text-slate-400 text-sm">No data to display.</p>';
        return;
    }

    Object.entries(subjectStats)
        .sort(([,a], [,b]) => b - a) // Sort descending
        .forEach(([sub, secs]) => {
            const pct = ((secs / totalTime) * 100).toFixed(1);
            const hrs = (secs / 3600).toFixed(1);
            
            const html = `
                <div>
                    <div class="flex justify-between text-sm mb-2">
                        <span class="font-bold text-slate-700">${sub}</span>
                        <span class="text-slate-500 font-mono">${hrs}h (${pct}%)</span>
                    </div>
                    <div class="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                        <div class="bg-indigo-600 h-full rounded-full transition-all duration-500" style="width: ${pct}%"></div>
                    </div>
                </div>
            `;
            barsContainer.innerHTML += html;
        });
}

function clearAllData() {
    if(confirm("Are you sure? This will delete all your tracking history.")) {
        localStorage.removeItem('study_pro_logs');
        localStorage.removeItem('study_pro_syllabus');
        location.reload();
    }
}