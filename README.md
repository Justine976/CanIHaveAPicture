# CanIHaveAPicture 📸

A web app that lets you invite anyone to take a picture using their camera and send it directly to your email.

## How It Works

1. **You (the sender)** enter your email address and generate a unique invite link.
2. **Share the link** with anyone via chat, email, or social media.
3. **They open the link** → their camera opens → they take a picture → it's sent to your email automatically.

## Live Demo

👉 [CanIHaveAPicture](https://your-username.github.io/CanIHaveAPicture)

## Setup for GitHub Pages

### 1. Deploy to GitHub Pages

1. Push this repository to GitHub.
2. Go to **Settings → Pages**.
3. Under "Branch", select `main` (or `master`) and `/ (root)` folder.
4. Click **Save**.
5. Your site will be live at `https://your-username.github.io/CanIHaveAPicture`.

### 2. Configure Email Sending (EmailJS)

This app uses **EmailJS** to send photos via email without a backend server.

1. Go to [EmailJS.com](https://www.emailjs.com/) and create a **free account**.
2. **Create an Email Service** (e.g., Gmail, Outlook, etc.).
   - Copy the **Service ID** (e.g., `service_abc123`).
3. **Create an Email Template** with these variables:
   - `{{sender_name}}` — the sender's name
   - `{{sender_email}}` — the sender's email address
   - `{{message}}` — custom message from the sender
   - `{{photo}}` — the photo as a base64 data URL (this is the actual image!)
   - `{{photographer_url}}` — the URL the photographer used
4. Copy your **Public Key** (Account → API Keys).
5. Open **`script.js`** and fill in the credentials:

```js
const EMAILJS_CONFIG = {
    PUBLIC_KEY: 'your_public_key',
    SERVICE_ID: 'your_service_id',
    TEMPLATE_ID: 'your_template_id',
};
```

> **Important:** EmailJS free plan allows 200 emails/month. Photo size may be limited — larger photos may fail to send. Consider reducing image quality in `capturePhoto()` if needed.

### 3. EmailJS Template Setup

In your EmailJS template, use HTML content like this to embed the photo:

```html
<p>You received a photo from {{sender_name}}!</p>
<p>Message: {{message}}</p>
<p>Photo URL: {{photographer_url}}</p>
<img src="{{photo}}" alt="Photo" style="max-width:100%;" />
```

Make sure the template is set to **HTML** mode, not plain text.

## Usage

### As the Sender
1. Open the website.
2. Enter your email (where you want the photo).
3. Optionally add your name and a message.
4. Click **Generate Invite Link**.
5. Share the link with anyone!

### As the Photographer
1. Open the invite link.
2. The camera opens automatically.
3. Take a picture.
4. Review it, retake if needed.
5. Click **Send Photo**.
6. The photo is emailed to the sender!

## Local Development

Just open `index.html` in a browser (or use Live Server in VS Code).

```bash
# If you have Python:
python -m http.server 8000
# Then open http://localhost:8000
```

## Project Structure

```
├── index.html    # Main HTML structure
├── style.css     # Styling (dark theme)
├── script.js     # Camera, link generation, email sending logic
└── README.md     # This file
```

## Tech Stack

- **HTML / CSS / JavaScript** — no frameworks needed
- **WebRTC** — camera access via `getUserMedia()`
- **EmailJS** — email sending without a backend
- **GitHub Pages** — free hosting

## Notes

- 🔒 **HTTPS is required** for camera access. GitHub Pages provides this automatically.
- 📱 Works on mobile and desktop browsers.
- 🖼️ Photos are sent as base64-encoded JPEGs (~200-500 KB).
- ⚠️ Some email providers may block large attachments. The photo is embedded inline in the email.

---

*Built with ❤️ for the "Can I have a picture?" moments.*