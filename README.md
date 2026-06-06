# CanIHaveAPicture 📸

A web app that lets you invite anyone to take a picture using their camera and send it directly to your email. No backend server required — everything runs in the browser.

## How It Works

1. **You (the sender)** enter your email address and generate a unique invite link.
2. **Share the link** with anyone via chat, email, or social media.
3. **They open the link** → their camera opens → they take a picture → it's sent to your email automatically.

---

## ⚡ Quick Start (First Time Setup)

### 1. Configure EmailJS (Required)

The app uses **EmailJS** to send the photo to your email. You must set this up before the app will work.

1. Go to [EmailJS.com](https://www.emailjs.com/) and create a **free account** (200 emails/month).
2. **Create an Email Service** (e.g., Gmail, Outlook, etc.).
   - Copy the **Service ID** (e.g., `service_abc123`).
3. **Create an Email Template** with these variables:
   - `{{sender_name}}` — the sender's name
   - `{{sender_email}}` — the sender's email address
   - `{{message}}` — custom message from the sender
   - `{{photo}}` — the photo as a base64 data URL (this is the actual image!)
   - `{{photographer_url}}` — the URL the photographer used
4. Copy your **Public Key** (Account → API Keys).
5. Open **`script.js`** and fill in the credentials at the top of the file:

```js
const EMAILJS_CONFIG = {
    PUBLIC_KEY: 'your_public_key',
    SERVICE_ID: 'your_service_id',
    TEMPLATE_ID: 'your_template_id',
};
```

### 2. EmailJS Template Content

In your EmailJS template editor, switch to **HTML** mode and use content like this:

```html
<p>You received a photo from {{sender_name}}!</p>
<p>Message: {{message}}</p>
<img src="{{photo}}" alt="Photo" style="max-width:100%;" />
<p>📍 Captured via: <a href="{{photographer_url}}">CanIHaveAPicture</a></p>
```

> ⚠️ The template **must** be in **HTML** mode, not plain text, for the embedded photo to work.

### 3. Deploy to GitHub Pages

1. Push this repository to **GitHub**.
2. Go to **Settings → Pages**.
3. Under **Branch**, select `main` (or `master`) and `/ (root)` folder.
4. Click **Save**.
5. Your site will be live at `https://<your-username>.github.io/CanIHaveAPicture`.

> 🔒 **HTTPS is required** for camera access. GitHub Pages provides this automatically.

---

## Usage

### As the Sender
1. Open the website.
2. Enter your email (where you want the photo sent).
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

---

## Local Development

### Testing Locally (HTTP — camera won't work)
```bash
# Using Python
python -m http.server 8000
# Then open http://localhost:8000
```

> ⚠️ **Camera access requires HTTPS** or `localhost`. The app will work for link generation locally, but the camera screen will fail on `http://` if not `localhost`.

### Testing Locally with HTTPS (for camera)
You can use a tool like [ngrok](https://ngrok.com/) or [localhost.run](https://localhost.run/) to create an HTTPS tunnel:

```bash
# Example with ngrok
ngrok http 8000
# Then open the https:// URL it provides
```

---

## Project Structure

```
├── index.html      # Main HTML with two screens (config + camera)
├── style.css       # Dark theme, mobile-responsive
├── script.js       # Camera, capture, link generation, email sending
├── README.md       # This documentation
└── .nojekyll       # Ensures GitHub Pages serves files correctly
```

---

## FAQ / Troubleshooting

### ❓ Camera doesn't open
- Make sure you're on **HTTPS** or `localhost` (browsers block camera on HTTP).
- Allow camera permission when prompted by the browser.
- On iOS, Safari requires a user gesture — tap the **Open Camera** button.

### ❓ Photo sends but the email is empty or missing the image
- Ensure your EmailJS template is in **HTML** mode, not plain text.
- Check that `{{photo}}` is included in the template body.
- Large photos may be rejected — reduce quality in `capturePhoto()` if needed.

### ❓ "EmailJS is not configured" alert
- Open `script.js` and fill in `PUBLIC_KEY`, `SERVICE_ID`, and `TEMPLATE_ID`.

### ❓ Can I test without sending to a real email?
- Yes! Use the **Open Camera (as photographer)** button on the config screen to test locally. The send will fail if EmailJS isn't configured, but you can see the camera and capture flow.

### ❓ Sender never received the photo
- Check the sender's **Spam / Junk** folder.
- Verify the EmailJS template is correctly set up and the service is active.
- Check your EmailJS dashboard for send logs and any error messages.

---

## Tech Stack

- **HTML / CSS / JavaScript** — no frameworks
- **WebRTC (`getUserMedia()`)** — browser camera access
- **EmailJS** — serverless email delivery
- **GitHub Pages** — free static hosting with HTTPS

---

## Notes

- 📱 Fully responsive — works on mobile and desktop.
- 🖼️ Photos are sent as base64-encoded JPEGs, embedded inline in the email.
- 📬 EmailJS free plan: **200 emails/month**.
- ⚠️ Some email providers may block or clip large inline images.

---

*Built with ❤️ for the "Can I have a picture?" moments.*