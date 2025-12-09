const FONTS = [
    // Standard Fonts
    "Arial",
    "Verdana",
    "Helvetica",
    "Tahoma",
    "Trebuchet MS",
    "Times New Roman",
    "Georgia",
    "Garamond",
    "Courier New",
    "Brush Script MT",
    // Google Fonts - Sans Serif
    "Roboto",
    "Open Sans",
    "Montserrat",
    "Lato",
    "Poppins",
    "Noto Sans",
    "Source Sans Pro",
    "Raleway",
    "Ubuntu",
    "Nunito",
    "Work Sans",
    "Inter",
    "Rubik",
    "Quicksand",
    "Karla",
    "Mulish",
    "Josefin Sans",
    // Google Fonts - Serif
    "Merriweather",
    "Playfair Display",
    "Lora",
    "PT Serif",
    "Noto Serif",
    "Bitter",
    "Crimson Text",
    "Libre Baskerville",
    "Arvo",
    "EB Garamond",
    "Domine",
    // Google Fonts - Display / Handwriting / Mono
    "Oswald",
    "Comfortaa",
    "Righteous",
    "Lobster",
    "Pacifico",
    "Dancing Script",
    "Caveat",
    "Satisfy",
    "Great Vibes",
    "Sacramento",
    "Permanent Marker",
    "Indie Flower",
    "Shadows Into Light",
    "Amatic SC",
    "Roboto Mono",
    "Inconsolata",
    "Source Code Pro",
    "Space Mono",
    "Fira Code",
    "Press Start 2P"
];

const fontList = document.getElementById('font-list');
const searchInput = document.getElementById('font-search');
const tabs = document.querySelectorAll('.tab-btn');
const emptyState = document.getElementById('empty-state');
const currentFontDisplay = document.getElementById('current-font-display');
const currentFontName = document.getElementById('current-font-name');
const resetBtn = document.getElementById('reset-btn');

let currentTab = 'recents'; // 'recents' or 'all'
let recentFonts = [];
let tabSpecificFonts = {}; // { tabId: fontName }
let currentTabId = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Get current tab first
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]) {
        currentTabId = tabs[0].id;
    }

    await loadState();
    render();
    updateCurrentFontDisplay();

    // We DO NOT auto-apply font here anymore, because we assume:
    // 1. If it was already set, the content script (and page) is already showing it (unless reloaded).
    // 2. If we just opened the popup, we shouldn't overwrite the page unless the user clicks something,
    //    OR if we want to ensure persistence, we could check if tabSpecificFonts[currentTabId] exists
    //    and re-send it just in case the content script was lost (e.g. reload). 
    //    The user complained about "automatically set in another tab", which was caused by global state.
    //    Sending the *correct* tab-specific font here is safe.

    if (currentTabId && tabSpecificFonts[currentTabId]) {
        sendMessageToContent({ action: "changeFont", font: tabSpecificFonts[currentTabId] });
    }
});

// Reset Button
resetBtn.addEventListener('click', async () => {
    if (currentTabId) {
        delete tabSpecificFonts[currentTabId];
        await chrome.storage.local.set({ tabSpecificFonts });
        updateCurrentFontDisplay();
        sendMessageToContent({ action: "resetFont" });
    }
});

// Helper to safely send message
function sendMessageToContent(message) {
    if (!currentTabId) return;
    chrome.tabs.sendMessage(currentTabId, message, (response) => {
        if (chrome.runtime.lastError) {
            // Ignore error
        }
    });
}

// Tab Switching
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentTab = tab.dataset.tab;
        searchInput.value = ''; // Clear search on tab switch
        render();
    });
});

// Search
searchInput.addEventListener('input', () => {
    render();
});

async function loadState() {
    const result = await chrome.storage.local.get(['recentFonts', 'tabSpecificFonts']);
    recentFonts = result.recentFonts || [];
    tabSpecificFonts = result.tabSpecificFonts || {};
}

async function addToRecents(fontName) {
    // Remove if exists, add to front
    recentFonts = recentFonts.filter(f => f !== fontName);
    recentFonts.unshift(fontName);
    // Limit to 10
    if (recentFonts.length > 10) recentFonts.pop();

    if (currentTabId) {
        tabSpecificFonts[currentTabId] = fontName;
        await chrome.storage.local.set({ recentFonts, tabSpecificFonts });
        updateCurrentFontDisplay();
    }
}

function updateCurrentFontDisplay() {
    currentFontDisplay.classList.remove('hidden');
    const fontForTab = currentTabId ? tabSpecificFonts[currentTabId] : null;
    currentFontName.textContent = fontForTab || "None";
}

function render() {
    fontList.innerHTML = '';
    const searchTerm = searchInput.value.toLowerCase();

    let sourceList = currentTab === 'all' ? FONTS : recentFonts;

    const filteredFonts = sourceList.filter(font =>
        font.toLowerCase().includes(searchTerm)
    );

    if (filteredFonts.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    } else {
        emptyState.classList.add('hidden');
    }

    filteredFonts.forEach(font => {
        const li = document.createElement('li');
        li.className = 'font-item';

        // Create preview element
        const nameSpan = document.createElement('span');
        nameSpan.textContent = font;
        nameSpan.style.fontFamily = font; // Preview in the popup itself if installed, otherwise fallback

        li.appendChild(nameSpan);

        li.addEventListener('click', () => {
            applyFont(font);
        });

        fontList.appendChild(li);
    });
}

function applyFont(fontName) {
    addToRecents(fontName);
    sendMessageToContent({ action: "changeFont", font: fontName });
}
