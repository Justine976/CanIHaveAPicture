/* =====================================================
   CanIHaveAPicture - Main Application Logic
   =====================================================
   INSTRUCTIONS FOR SETUP:
   1. Go to https://www.emailjs.com/ and create a free account.
   2. Create an Email Service (e.g., Gmail, Outlook, etc.).
   3. Create an Email Template with these variables:
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
    TEMPLATE_ID: 'template_atk5zpe',  // e.g. 'template_xyz789'
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
const cameraInfo = document.getElementById('camera-info');

let capturedDataUrl = null;
let mediaStream = null;
let senderData = null; // { email, name, message }

// ─── Init EmailJS ─────────────────────────────────────
(function initEmailJS() {
    if (EMAILJS_CONFIG.PUBLIC_KEY) {
        emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
    }
})();

// ─── Utility ──────────────────────────────────────────
function showScreen(screen) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
    screen.classList.add('active');
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
    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 960 } },
            audio: false,
        });
        video.srcObject = mediaStream;
        await video.play();
        cameraPlaceholder.style.display = 'none';
        captureBtn.disabled = false;
    } catch (err) {
        console.error('Camera error:', err);
        cameraPlaceholder.innerHTML = `
            <span>🚫</span>
            <p>Camera not available.<br>Please allow camera access and refresh.</p>
        `;
        captureBtn.disabled = true;
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
}

function resetToCamera() {
    capturedDataUrl = null;
    previewImg.src = '';
    previewArea.classList.add('hidden');
    video.style.display = 'block';
    captureBtn.classList.remove('hidden');
    retakeBtn.classList.add('hidden');
    sendBtn.classList.add('hidden');
    sendingStatus.classList.add('hidden');
    successStatus.classList.add('hidden');
    errorStatus.classList.add('hidden');
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
});

// Copy link
copyLinkBtn.addEventListener('click', () => {
    inviteLinkInput.select();
    navigator.clipboard.writeText(inviteLinkInput.value).then(() => {
        copyLinkBtn.textContent = '✅ Copied!';
        setTimeout(() => {
            copyLinkBtn.textContent = '📋 Copy';
        }, 2000);
    });
});

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
    sendBtn.classList.remove('hidden');
    sendBtn.disabled = false;
    sendBtn.textContent = '✈️ Send Photo';
    // If stream ended, restart
    if (!mediaStream || !mediaStream.active) {
        startCamera();
    }
});

// ─── On load: check for invite params ────────────────
(function onLoad() {
    const params = getParamsFromUrl();
    if (params) {
        // Invited user → go straight to camera
        openCamera(params);
    } else {
        // Sender → show config screen
        showScreen(configScreen);
    }
})();

// ─── Cleanup on page unload ──────────────────────────
window.addEventListener('beforeunload', () => {
    stopCamera();
});