/* =====================================================
   CanIHaveAPicture - Main Application Logic
   =====================================================
   INSTRUCTIONS FOR SETUP:
   1. Go to https://www.emailjs.com/ and create a free account.
   2. Create an Email Service (e.g., Gmail, Outlook, etc.).
   3. Create an Email Template with these variables:
        {{to_email}}      - the recipient email address (set this as the "To Email" field)
        {{sender_name}}   - the sender's name
        {{sender_email}}  - the sender's email address
        {{message}}       - custom message from sender
        {{photo}}         - the photo as a base64 data URL
        {{photographer_url}} - URL the photographer used
   4. Get your Service ID, Template ID, and Public Key.
   5. Paste them below.
   ===================================================== */

// ═══════════════════════════════════════════════════════
// ✏️  CONFIGURATION - Fill in your EmailJS credentials
// ═══════════════════════════════════════════════════════
const EMAILJS_CONFIG = {
    PUBLIC_KEY: 'Ou0iyeUQPLQjw5JVW',   // e.g. 'abc123def456'
    SERVICE_ID: 'service_79pai39',   // e.g. 'service_abc123'
    TEMPLATE_ID: 'template_mitugag',  // e.g. 'template_xyz789'
};
// ═══════════════════════════════════════════════════════

// ─── DOM refs ──────────────────────────────────────────
const configScreen = document.getElementById('config-screen');
const cameraScreen = document.getElementById('camera-screen');

const configForm = document.getElementById('config-form');
const senderEmailInput = document.getElementById('sender-email');
const senderNameInput = document.getElementById('sender-name');
const messageInput = document.getElementById('message');

const linkArea = document.getElementById('link-area');
const inviteLinkInput = document.getElementById('invite-link');
const copyLinkBtn = document.getElementById('copy-link-btn');
const displayEmailSpan = document.getElementById('display-email');
const openCameraAsPhotographerBtn = document.getElementById(
    'open-camera-as-photographer-btn'
);
const shareLinkBtn = document.getElementById('share-link-btn');

const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const cameraPlaceholder = document.getElementById('camera-placeholder');
const captureBtn = document.getElementById('capture-btn');
const retakeBtn = document.getElementById('retake-btn');
const sendBtn = document.getElementById('send-btn');
const previewArea = document.getElementById('preview-area');
const previewImg = document.getElementById('preview-img');
const sendingStatus = document.getElementById('sending-status');
const successStatus = document.getElementById('success-status');
const successEmailInfo = document.getElementById('success-email-info');
const errorStatus = document.getElementById('error-status');
const takeAnotherBtn = document.getElementById('take-another-btn');
const retryCamBtn = document.getElementById('retry-cam-btn');
const cameraInfo = document.getElementById('camera-info');

const inappBanner = document.getElementById('inapp-banner');
const openExternalBtn = document.getElementById('open-external-btn');
const dismissInappBtn = document.getElementById('dismiss-inapp-btn');

let capturedDataUrl = null;
let mediaStream = null;
let senderData = null; // { email, name, message }
let lastCameraError = null;

// ─── Init EmailJS ─────────────────────────────────────
(function initEmailJS() {
    if (EMAILJS_CONFIG.PUBLIC_KEY) {
        emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
    }
})();

// ─── In-app browser detection ─────────────────────────
// Detect Facebook Messenger, Facebook, Instagram, Line, Snapchat, etc.
// These in-app browsers usually BLOCK getUserMedia() or have other quirks.
function isInAppBrowser() {
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    // Common in-app browser user-agent patterns
    return /FBAN|FBAV|FB_IAB|Instagram|Line|Snapchat|Twitter|WhatsApp|MicroMessenger|WeChat|LinkedInApp|Pinterest|TikTok|MessengerLite/i.test(
        ua
    );
}

function showInAppBanner() {
    if (inappBanner) inappBanner.classList.remove('hidden');
}

function hideInAppBanner() {
    if (inappBanner) inappBanner.classList.add('hidden');
}

// Try to open the current page in the device's default browser.
// This is best-effort — different platforms handle it differently.
function openInExternalBrowser() {
    const url = window.location.href;
    const ua = navigator.userAgent || '';
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const isAndroid = /Android/i.test(ua);

    if (isIOS) {
        // iOS: there is NO reliable JS-only way to escape an in-app browser.
        // Show instructions and let the user tap the "Open in browser" option
        // that Messenger/Instagram already provide in their UI.
        // A common trick is to try opening with _blank, but this usually
        // just opens another in-app tab. Best UX = tell the user.
        alert(
            'To open in your browser:\n\n' +
            '• In Messenger: tap the three dots (•••) at the top of the chat → "Open in Browser"\n\n' +
            '• In Instagram: tap the three dots (•••) → "Open in Browser"\n\n' +
            'Or copy the link and paste it into Safari/Chrome.'
        );
        // Also copy the URL to clipboard as a fallback
        try {
            navigator.clipboard.writeText(url);
        } catch (e) {
            /* ignore */
        }
    } else if (isAndroid) {
        // Android intent: tries to open in the default browser via a fallback chain
        const intentUrl =
            'intent://' +
            url.replace(/^https?:\/\//, '') +
            '#Intent;scheme=https;package=com.android.chrome;end';
        try {
            window.location.href = intentUrl;
        } catch (e) {
            window.open(url, '_blank');
        }
    } else {
        window.open(url, '_blank');
    }
}

if (openExternalBtn) {
    openExternalBtn.addEventListener('click', openInExternalBrowser);
}
if (dismissInappBtn) {
    dismissInappBtn.addEventListener('click', hideInAppBanner);
}

// ─── Utility ──────────────────────────────────────────
function showScreen(screen) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
    screen.classList.add('active');
    // Scroll to top when switching screens (mobile)
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function getBaseUrl() {
    // Works on GitHub Pages and local
    return window.location.origin + window.location.pathname;
}

// ─── URL parameter handling ───────────────────────────
function getParamsFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const to = params.get('to');
    const name = params.get('name');
    const msg = params.get('msg');
    if (to) {
        return { email: to, name: name || '', message: msg || '' };
    }
    return null;
}

function buildInviteUrl(email, name, message) {
    const base = getBaseUrl();
    const params = new URLSearchParams();
    params.set('to', email);
    if (name) params.set('name', name);
    if (message) params.set('msg', message);
    return `${base}?${params.toString()}`;
}

// ─── Camera ───────────────────────────────────────────
async function startCamera() {
    // Clean up any previous stream
    stopCamera();

    // Reset error UI
    errorStatus.classList.add('hidden');
    if (retryCamBtn) retryCamBtn.classList.add('hidden');
    cameraPlaceholder.innerHTML = `
        <span>📷</span>
        <p>Camera will appear here</p>
    `;
    cameraPlaceholder.style.display = 'flex';

    // If we know we're in an in-app browser, pre-warn the user
    if (isInAppBrowser() && inappBanner?.classList.contains('hidden')) {
        showInAppBanner();
    }

    // Check for secure context (HTTPS or localhost)
    const isSecure =
        window.isSecureContext ||
        location.protocol === 'https:' ||
        location.hostname === 'localhost' ||
        location.hostname === '127.0.0.1';

    if (!isSecure) {
        cameraPlaceholder.innerHTML = `
            <span>🔒</span>
            <p>Camera requires HTTPS.<br>Please open this page on a secure (https://) URL.</p>
        `;
        captureBtn.disabled = true;
        return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        cameraPlaceholder.innerHTML = `
            <span>🚫</span>
            <p>Camera API not supported in this browser.<br>Please try Chrome or Safari.</p>
        `;
        captureBtn.disabled = true;
        return;
    }

    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: { ideal: 'environment' },
                width: { ideal: 1280 },
                height: { ideal: 960 },
            },
            audio: false,
        });
        video.srcObject = mediaStream;
        // iOS Safari: must call play() after srcObject set, and play() returns a promise
        try {
            await video.play();
        } catch (playErr) {
            console.warn('video.play() rejected (often on in-app browsers):', playErr);
        }
        cameraPlaceholder.style.display = 'none';
        captureBtn.disabled = false;
        lastCameraError = null;
    } catch (err) {
        console.error('Camera error:', err);
        lastCameraError = err;
        const name = err && err.name;
        let msg;
        if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
            msg =
                'Camera permission was denied.<br>Please allow camera access in your browser settings and retry.';
        } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
            msg = 'No camera was found on this device.';
        } else if (name === 'NotReadableError' || name === 'TrackStartError') {
            msg = 'The camera is already in use by another app.<br>Close it and try again.';
        } else if (name === 'OverconstrainedError') {
            msg = 'No suitable camera was found.';
        } else if (name === 'SecurityError') {
            msg = 'Camera access is blocked.<br>This often happens inside in-app browsers (Messenger, Instagram).<br>Open the link in Chrome or Safari.';
        } else {
            msg = `Camera not available.<br><small>${(err && err.message) || 'Unknown error'}</small>`;
        }
        cameraPlaceholder.innerHTML = `<span>🚫</span><p>${msg}</p>`;
        captureBtn.disabled = true;
        if (retryCamBtn) retryCamBtn.classList.remove('hidden');
        // If we're in an in-app browser, also surface the banner
        if (isInAppBrowser()) {
            showInAppBanner();
        }
    }
}

function stopCamera() {
    if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
        mediaStream = null;
    }
    video.srcObject = null;
}

function capturePhoto() {
    if (!video.videoWidth || !video.videoHeight) {
        // Camera isn't actually producing frames
        alert('Camera is not ready yet. Please wait a moment.');
        return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    capturedDataUrl = canvas.toDataURL('image/jpeg', 0.9);

    // Show preview
    previewImg.src = capturedDataUrl;
    previewArea.classList.remove('hidden');

    // Hide video / show preview
    video.style.display = 'none';
    captureBtn.classList.add('hidden');
    retakeBtn.classList.remove('hidden');
    sendBtn.classList.remove('hidden');
    errorStatus.classList.add('hidden');
}

function resetToCamera() {
    capturedDataUrl = null;
    previewImg.src = '';
    previewArea.classList.add('hidden');
    video.style.display = 'block';
    captureBtn.classList.remove('hidden');
    retakeBtn.classList.add('hidden');
    sendBtn.classList.add('hidden');
    sendBtn.disabled = false;
    sendBtn.textContent = '✈️ Send Photo';
    sendingStatus.classList.add('hidden');
    successStatus.classList.add('hidden');
    errorStatus.classList.add('hidden');
    if (retryCamBtn) retryCamBtn.classList.add('hidden');
}

// ─── Send photo via EmailJS ──────────────────────────
async function sendPhoto() {
    if (!capturedDataUrl) return;
    if (!EMAILJS_CONFIG.PUBLIC_KEY || !EMAILJS_CONFIG.SERVICE_ID || !EMAILJS_CONFIG.TEMPLATE_ID) {
        alert(
            '⚠️ EmailJS is not configured.\n\n' +
            'Please open script.js and fill in your EmailJS credentials:\n' +
            '1. Sign up at https://www.emailjs.com/\n' +
            '2. Create a Service and a Template\n' +
            '3. Paste your Public Key, Service ID, and Template ID'
        );
        return;
    }

    sendingStatus.classList.remove('hidden');
    sendBtn.disabled = true;
    sendBtn.textContent = '⏳ Sending…';

    try {
        const templateParams = {
            to_email: senderData?.email || '',
            sender_name: senderData?.name || 'Someone',
            sender_email: senderData?.email || '',
            message: senderData?.message || '',
            photo: capturedDataUrl,
            photographer_url: window.location.href,
        };

        const response = await emailjs.send(
            EMAILJS_CONFIG.SERVICE_ID,
            EMAILJS_CONFIG.TEMPLATE_ID,
            templateParams
        );

        console.log('Email sent successfully:', response);

        sendingStatus.classList.add('hidden');
        successStatus.classList.remove('hidden');
        successEmailInfo.textContent = `📬 Photo sent to ${senderData?.email || 'the sender'}`;
        sendBtn.classList.add('hidden');
        retakeBtn.classList.add('hidden');
    } catch (err) {
        console.error('Send error:', err);
        sendingStatus.classList.add('hidden');
        errorStatus.classList.remove('hidden');
        if (retryCamBtn) retryCamBtn.classList.add('hidden');
        sendBtn.disabled = false;
        sendBtn.textContent = '✈️ Send Photo';
    }
}

// ─── Open camera screen ──────────────────────────────
function openCamera(data) {
    senderData = data;
    if (data?.email) {
        cameraInfo.textContent = `📬 Photo will be sent to: ${data.email}`;
        if (data.name) {
            cameraInfo.textContent += ` (from ${data.name})`;
        }
    }
    showScreen(cameraScreen);
    resetToCamera();
    startCamera();
}

// ─── Generate invite link ────────────────────────────
configForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = senderEmailInput.value.trim();
    const name = senderNameInput.value.trim();
    const message = messageInput.value.trim();

    if (!email) return;

    const link = buildInviteUrl(email, name, message);
    inviteLinkInput.value = link;
    displayEmailSpan.textContent = email;

    linkArea.classList.remove('hidden');

    // Show the native Share button only if the browser supports it
    if (shareLinkBtn) {
        if (navigator.share) {
            shareLinkBtn.classList.remove('hidden');
        } else {
            shareLinkBtn.classList.add('hidden');
        }
    }
});

// Copy link
copyLinkBtn.addEventListener('click', async () => {
    const link = inviteLinkInput.value;
    let copied = false;
    try {
        await navigator.clipboard.writeText(link);
        copied = true;
    } catch (e) {
        // Fallback for older / in-app browsers
        try {
            inviteLinkInput.select();
            inviteLinkInput.setSelectionRange(0, link.length);
            copied = document.execCommand('copy');
        } catch (e2) {
            copied = false;
        }
    }
    if (copied) {
        copyLinkBtn.textContent = '✅ Copied!';
    } else {
        copyLinkBtn.textContent = '📋 Tap to select';
        inviteLinkInput.select();
    }
    setTimeout(() => {
        copyLinkBtn.textContent = '📋 Copy';
    }, 2000);
});

// Native share (mobile-first)
if (shareLinkBtn) {
    shareLinkBtn.addEventListener('click', async () => {
        const link = inviteLinkInput.value;
        const senderName = senderNameInput.value.trim();
        const msg = messageInput.value.trim();
        const shareData = {
            title: 'CanIHaveAPicture 📸',
            text:
                (senderName ? `${senderName} is ` : 'I\'m ') +
                'asking: can you take a picture for me?' +
                (msg ? `\n\n${msg}` : ''),
            url: link,
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                // Fallback: copy to clipboard
                await navigator.clipboard.writeText(link);
                shareLinkBtn.textContent = '✅ Link copied!';
                setTimeout(() => {
                    shareLinkBtn.textContent = '📤 Share Invite';
                }, 2000);
            }
        } catch (err) {
            // User cancelled or share failed; ignore
        }
    });
}

// Open camera as photographer (for testing / same-device use)
openCameraAsPhotographerBtn.addEventListener('click', () => {
    const email = senderEmailInput.value.trim();
    const name = senderNameInput.value.trim();
    const message = messageInput.value.trim();
    if (!email) {
        alert('Please enter your email first.');
        return;
    }
    openCamera({ email, name, message });
});

// ─── Camera controls ─────────────────────────────────
captureBtn.addEventListener('click', capturePhoto);

retakeBtn.addEventListener('click', () => {
    resetToCamera();
});

sendBtn.addEventListener('click', sendPhoto);

takeAnotherBtn.addEventListener('click', () => {
    successStatus.classList.add('hidden');
    resetToCamera();
    // If stream ended, restart
    if (!mediaStream || !mediaStream.active) {
        startCamera();
    }
});

if (retryCamBtn) {
    retryCamBtn.addEventListener('click', () => {
        retryCamBtn.classList.add('hidden');
        errorStatus.classList.add('hidden');
        startCamera();
    });
}

// ─── On load: check for invite params ────────────────
(function onLoad() {
    // Surface the in-app banner proactively on the config screen
    // (the camera screen will show it via startCamera on its own)
    if (isInAppBrowser()) {
        showInAppBanner();
    }

    const params = getParamsFromUrl();
    if (params) {
        // Invited user → go straight to camera
        openCamera(params);
    } else {
        // Sender → show config screen
        showScreen(configScreen);
    }
})();

// ─── Visibility / page lifecycle ─────────────────────
// iOS Safari can suspend/reset the camera stream when the page
// is backgrounded. Restart it when the user comes back.
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && cameraScreen.classList.contains('active')) {
        if (!mediaStream || !mediaStream.active) {
            startCamera();
        }
    }
});

// ─── Cleanup on page unload ──────────────────────────
window.addEventListener('beforeunload', () => {
    stopCamera();
});
