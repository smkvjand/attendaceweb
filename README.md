# AttendEase Web

Google-Material-inspired web version of the AttendEase attendance app.
Connects to the **same Firebase project** as your Android app.

## File Structure

```
attendease/
├── index.html              ← Main app (single page)
├── css/
│   └── style.css           ← All styles
├── js/
│   ├── firebase-config.js  ← YOUR CONFIG GOES HERE
│   └── app.js              ← Firebase logic & state
└── README.md
```

## Quick Start

### 1. Add Firebase Config
Open `js/firebase-config.js` and replace with your config from Firebase Console.

### 2. Deploy to GitHub Pages
1. Create a public GitHub repo named `attendease`
2. Upload all files (drag & drop in GitHub UI)
3. Go to Settings → Pages → Source: main branch → Save
4. Site is live at `https://your-username.github.io/attendease`

### 5. Add authorized domain
Firebase Console → Authentication → Settings → Authorized domains
→ Add `your-username.github.io`

That's it — same database as your Android app!
