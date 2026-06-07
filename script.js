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
const errorDetail = document.getElementById('error-detail');
const takeAnotherBtn = document.getElementById('take-another-btn');
const retryCamBtn = document.getElementById('retry-cam-btn');
const retrySendBtn = document.getElementById('retry-send-btn');
const retakeOnErrorBtn = document.getElementById('retake-on-error-btn');
const flipBtn = document.getElementById('flip-btn');
const cameraInfo = document.getElementById('camera-info');
const cameraViewEl = document.querySelector('.camera-view');

const inappBanner = document.getElementById('inapp-banner');
const openExternalBtn = document.getElementById('open-external-btn');
const dismissInappBtn = document.getElementById('dismiss-inapp-btn');

let capturedDataUrl = null;
let mediaStream = null;
let senderData = null; // { email, name, message }
let lastCameraError = null;
let currentFacingMode = 'environment'; // 'environment' = back, 'user' = front
let multiCameraSupported = false; // becomes true if device lists >1 video input

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
                facingMode: { ideal: currentFacingMode },
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

        // Mirror the live preview for the front camera (selfie style).
        // The captured photo is un-mirrored in capturePhoto() so it stays correct.
        if (cameraViewEl) {
            cameraViewEl.classList.toggle('video-flipped', currentFacingMode === 'user');
        }

        // Show the flip button only if the device has more than one camera.
        // enumerateDevices() may not have labels until the first getUserMedia
        // permission grant — we still treat "more than one videoinput" as
        // multi-camera support.
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const cams = devices.filter((d) => d.kind === 'videoinput');
            multiCameraSupported = cams.length > 1;
        } catch (e) {
            multiCameraSupported = false;
        }
        if (flipBtn) {
            if (multiCameraSupported) {
                flipBtn.classList.remove('hidden');
                flipBtn.disabled = false;
            } else {
                flipBtn.classList.add('hidden');
            }
        }
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

//
// EmailJS free plan limits the request body to ~50KB. Mobile cameras can
// easily produce 1-3MB JPEGs, so we re-encode at a smaller dimension and
// lower quality by default. This keeps the base64 payload small enough to
// actually be delivered.
//
const MAX_PHOTO_DIM = 1024;     // longest side, pixels
const PHOTO_QUALITY  = 0.6;     // JPEG quality (0..1)
const EMAILJS_BODY_LIMIT = 45 * 1024; // bytes (leave headroom for other params)

function encodeJpeg(srcCanvas, maxDim, quality) {
    let w = srcCanvas.width;
    let h = srcCanvas.height;
    if (w > maxDim || h > maxDim) {
        if (w >= h) {
            h = Math.max(1, Math.round((maxDim / w) * h));
            w = maxDim;
        } else {
            w = Math.max(1, Math.round((maxDim / h) * w));
            h = maxDim;
        }
    }
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    c.getContext('2d').drawImage(srcCanvas, 0, 0, w, h);
    return c.toDataURL('image/jpeg', quality);
}

function capturePhoto() {
    if (!video.videoWidth || !video.videoHeight) {
        // Camera isn't actually producing frames
        alert('Camera is not ready yet. Please wait a moment.');
        return;
    }
    // Draw the raw frame into our canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    // The live <video> element is CSS-mirrored (scaleX(-1)) when on the
    // front camera so the user sees a familiar selfie preview. To make
    // sure the CAPTURED photo isn't mirrored, we apply the inverse
    // transform to the canvas context before drawing.
    ctx.save();
    if (currentFacingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);
    ctx.restore();

    // Compress for sending
    capturedDataUrl = encodeJpeg(canvas, MAX_PHOTO_DIM, PHOTO_QUALITY);
    console.log(
        'Captured photo:',
        video.videoWidth + 'x' + video.videoHeight,
        '→',
        capturedDataUrl.length,
        'bytes (base64)'
    );

    // Show preview (use the compressed version to keep memory low)
    previewImg.src = capturedDataUrl;
    previewArea.classList.remove('hidden');

    // Hide video / show preview
    video.style.display = 'none';
    captureBtn.classList.add('hidden');
    retakeBtn.classList.remove('hidden');
    sendBtn.classList.remove('hidden');
    errorStatus.classList.add('hidden');
    if (retrySendBtn) retrySendBtn.classList.add('hidden');
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
    if (retrySendBtn) retrySendBtn.classList.add('hidden');
    // Re-show the flip button if the device has multiple cameras
    if (flipBtn && multiCameraSupported) {
        flipBtn.classList.remove('hidden');
    }
}

//
// Switch between front and back cameras. Stops the current stream, flips
// `currentFacingMode`, and re-requests a new stream.
//
async function flipCamera() {
    if (flipBtn) flipBtn.disabled = true;
    currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    // Keep the captured preview around while flipping so the user doesn't
    // see a flash of black. Only hide it if there was a capture in progress.
    const wasCaptured = capturedDataUrl != null;
    if (!wasCaptured) {
        cameraPlaceholder.style.display = 'flex';
        cameraPlaceholder.innerHTML = `
            <span>🔄</span>
            <p>Switching camera…</p>
        `;
    }
    try {
        await startCamera();
    } finally {
        if (flipBtn && multiCameraSupported) {
            flipBtn.disabled = false;
        }
    }
}

//
// Re-compress the captured photo to a smaller size. Used when the first
// send fails with HTTP 413 (EmailJS free plan: 50KB body limit).
// Drops dimension by ~33% and quality by ~30% each step.
//
function recompressSmaller() {
    if (!capturedDataUrl) return;
    const img = new Image();
    img.onload = () => {
        const c = document.createElement('canvas');
        // Reduce by ~33% from the current base64's implied dimensions is
        // hard to know exactly, so just halve the encoded-data heuristic:
        // try a much smaller dimension (640) and lower quality (0.4).
        const targetDim = 640;
        const targetQuality = 0.4;
        const scale = Math.min(targetDim / img.width, targetDim / img.height, 1);
        c.width = Math.max(1, Math.round(img.width * scale));
        c.height = Math.max(1, Math.round(img.height * scale));
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        const newData = c.toDataURL('image/jpeg', targetQuality);
        console.log(
            'Recompressed:',
            capturedDataUrl.length,
            '→',
            newData.length,
            'bytes (',
            Math.round((1 - newData.length / capturedDataUrl.length) * 100),
            '% smaller)'
        );
        capturedDataUrl = newData;
        previewImg.src = newData;
        // Now try sending again
        sendPhoto();
    };
    img.onerror = () => {
        alert('Could not re-process the photo. Please retake it.');
    };
    img.src = capturedDataUrl;
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
    errorStatus.classList.add('hidden');
    if (retrySendBtn) retrySendBtn.classList.add('hidden');
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
        if (retrySendBtn) retrySendBtn.classList.add('hidden');
    } catch (err) {
        console.error('Send error:', err);
        sendingStatus.classList.add('hidden');
        errorStatus.classList.remove('hidden');
        if (retryCamBtn) retryCamBtn.classList.add('hidden');

        // EmailJS error shape: { status, text }
        const status = err && (err.status || (err.response && err.response.status));
        const rawText = (err && (err.text || err.message)) || 'Unknown error';
        const isTooLarge = status === 413 || /too large|request entity|payload|exceed/i.test(rawText);

        if (errorDetail) {
            if (isTooLarge) {
                errorDetail.innerHTML =
                    'The photo is too large for EmailJS (free plan: ~50KB limit).<br>' +
                    'Mobile cameras produce big files — tap below to retry with a smaller version.';
            } else if (isInAppBrowser()) {
                // Common case on mobile: the in-app browser blocked the EmailJS
                // request. Tell the user to open in a real browser.
                errorDetail.innerHTML =
                    'Send failed inside an in-app browser (Messenger, Instagram, etc.).<br>' +
                    'Tap <strong>Open in Browser</strong> at the top to try with Chrome / Safari.';
            } else {
                errorDetail.textContent = `Error ${status || ''}: ${rawText}`.trim();
            }
        }

        // ALWAYS show the retry-send button on any error. This is the most
        // important fix for mobile / Messenger where the button was previously
        // easy to miss because the error block sat below the fold.
        if (retrySendBtn) {
            retrySendBtn.classList.remove('hidden');
            retrySendBtn.textContent = isTooLarge
                ? '🔁 Retry with smaller size'
                : '🔁 Retry Send';
        }
        // Also show the "Retake Photo" button so the user can recover
        // even if retrying the send doesn't help.
        if (retakeOnErrorBtn) {
            retakeOnErrorBtn.classList.remove('hidden');
        }

        // Hide the regular Send / Retake buttons in the controls row so the
        // user only sees the error-recovery buttons (no dead-end state).
        if (sendBtn) sendBtn.classList.add('hidden');
        if (retakeBtn) retakeBtn.classList.add('hidden');

        // Make sure the user can SEE the error block on small screens.
        try {
            errorStatus.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch (e) {
            /* older browsers */
        }

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

if (retrySendBtn) {
    retrySendBtn.addEventListener('click', () => {
        // Hide the error UI and the button, then re-compress + re-send
        errorStatus.classList.add('hidden');
        retrySendBtn.classList.add('hidden');
        if (retakeOnErrorBtn) retakeOnErrorBtn.classList.add('hidden');
        recompressSmaller();
    });
}

if (retakeOnErrorBtn) {
    retakeOnErrorBtn.addEventListener('click', () => {
        // Go back to the camera — the user can take a new picture
        errorStatus.classList.add('hidden');
        retakeOnErrorBtn.classList.add('hidden');
        if (retrySendBtn) retrySendBtn.classList.add('hidden');
        resetToCamera();
    });
}

if (flipBtn) {
    flipBtn.addEventListener('click', () => {
        flipCamera();
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
