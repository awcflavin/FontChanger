const STANDARD_FONTS = [
    "Arial", "Verdana", "Helvetica", "Tahoma", "Trebuchet MS",
    "Times New Roman", "Georgia", "Garamond", "Courier New", "Brush Script MT"
];

const STYLE_ID = 'font-changer-style';
const LINK_ID = 'font-changer-link';

console.log("FontChanger: Content script loaded on " + window.location.href);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("FontChanger: Message received", request);
    if (request.action === "changeFont") {
        applyFont(request.font);
        sendResponse({ status: "success", font: request.font });
    } else if (request.action === "resetFont") {
        resetFont();
        sendResponse({ status: "reset" });
    }
    return true;
});

function resetFont() {
    console.log("FontChanger: Resetting font");
    let style = document.getElementById(STYLE_ID);
    if (style) {
        style.remove();
        console.log("FontChanger: Style removed");
    }
}

function applyFont(fontName) {
    // 1. Handle Google Fonts import if needed
    if (!STANDARD_FONTS.includes(fontName)) {
        updateFontLink(fontName);
    }

    // 2. Update CSS
    updateFontStyle(fontName);
}

function updateFontLink(fontName) {
    let link = document.getElementById(LINK_ID);
    if (!link) {
        link = document.createElement('link');
        link.id = LINK_ID;
        link.rel = 'stylesheet';
        document.head.appendChild(link);
    }
    // Replace spaces with + for URL
    const formattedName = fontName.replace(/\s+/g, '+');
    link.href = `https://fonts.googleapis.com/css2?family=${formattedName}&display=swap`;
}

function updateFontStyle(fontName) {
    console.log("FontChanger: Applying font style for", fontName);
    let style = document.getElementById(STYLE_ID);
    if (!style) {
        style = document.createElement('style');
        style.id = STYLE_ID;
        document.head.appendChild(style);
        console.log("FontChanger: Created new style element");
    }

    // Force redraw technique + aggressive selection
    style.textContent = `
        * {
            font-family: '${fontName}', sans-serif !important;
        }
    `;
    console.log("FontChanger: Style content updated");
}

