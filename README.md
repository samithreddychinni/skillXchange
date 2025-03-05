# SkillXchange Documentation

## 🌟 Overview
SkillXchange is a web-based platform that connects users for skill-sharing through chat and video calls. The platform features a **Next.js** frontend for a dynamic UI and **Firebase** for backend services, including Firestore for real-time database management and Authentication for secure access. Hosted on **Vercel**, it facilitates skill swapping by intelligently matching users based on their skills, experience, preferences, and honor-based rating system.

## 🚀 Features
- **🔐 User Authentication**: Secure signup/login with email and password.
- **👤 Profile Management**: Users specify skills, experience, availability, gender, age, locality, and language.
- **⚡ Intelligent Matching**: Matches users based on:
  - Skill compatibility (50%)
  - Gender preference (25%, favoring the same gender)
  - Age groups (25%)
  - Honor score (Poor, Moderate, High, Excellent)
- **💬 Real-Time Chat**: Send messages and share files via Firebase Storage.
- **🎥 Video Calls**: WebRTC-based calls with mute, toggle, and peer rating.
- **🏅 Honor System**: Updates user credibility based on feedback.

## 🛠️ Technical Details
### Frontend
- **Framework**: Next.js `14.2.3`
- **Styling**: Tailwind CSS & Shadcn UI
- **Client-Side Logic**: JavaScript (ES Modules) + Firebase SDK

### Backend
- **Database**: Firebase Firestore (v9+ modular syntax)
- **Authentication**: Firebase Auth (Email/Password)
- **Collections**:
  - `login`: Stores username & email per UID.
  - `profiles`: Stores user details & preferences.
  - `matches`: Stores matching results.
  - `chats`: Stores chat messages per user pair.

## 📌 Prerequisites
Ensure the following are installed before setup:
- **Node.js** `v18.x+`
- **npm** `v9.x+`
- **Firebase CLI**
- **Vercel CLI**
- **Firebase Account**

## ⚙️ Installation
### 1️⃣ Clone the Repository
```bash
git clone <your-repository-url>
cd skillxchange/frontend
```
### 2️⃣ Install Dependencies
```bash
npm install
```
### 3️⃣ Set Up Environment Variables
Create `.env.local` in `frontend/` and add:
```ini
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=skill-swap-platform-82b4c.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=skill-swap-platform-82b4c
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=skill-swap-platform-82b4c.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```
Obtain values from Firebase Console → Project Settings → General → Your App.

### 4️⃣ Configure Tailwind CSS & Shadcn UI
Ensure `styles/globals.css` includes:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```
Install Tailwind & dependencies:
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```
Update `tailwind.config.js`:
```js
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: { extend: {} },
  plugins: [],
};
```

## 🎯 Usage
### Run Locally
```bash
npm run dev
```
Visit **[localhost:3000](http://localhost:3000)** to test features.

### Test Features
1. **Sign Up**: Username, email, strong password (8+ chars, mix of cases, numbers, and symbols).
2. **Profile Setup**: Add skills, availability, preferences.
3. **Explore Dashboard**: View matches, chat, and start video calls.
4. **Rate Peers**: After calls, update their honor score.

## 🚢 Deployment
### 1️⃣ Deploy to Vercel
#### Prerequisites
- Install Vercel CLI:
```bash
npm install -g vercel
```
- Log in to Vercel:
```bash
vercel login
```
#### Steps
- Build project:
```bash
npm run build
```
- Deploy:
```bash
vercel --prod
```
**Access:** `https://your-vercel-app.vercel.app`

### 2️⃣ Firebase Integration
- Enable Firestore & Authentication (Email/Password) in Firebase Console.
- Set up Firestore collections (`login`, `profiles`).
- Add initial test users.

## 🛠️ Database Setup
### 1️⃣ Create Firebase Project
- Go to **[Firebase Console](https://console.firebase.google.com)**.
- Create project **SkillXchange**.
- Enable **Firestore Database & Authentication**.

### 2️⃣ Configure Firestore Collections
```plaintext
📂 Firestore
 ┣ 📂 login
 ┃ ┗ 📄 {uid} → {username, email}
 ┣ 📂 profiles
 ┃ ┗ 📄 {uid} → {skills, experience, availability, etc.}
 ┣ 📂 matches
 ┃ ┗ 📄 {uid} → {match_ids}
 ┣ 📂 chats
 ┃ ┗ 📂 {chat_id}
 ┃   ┗ 📄 messages
```

### 3️⃣ Import Sample Data
Use a script or Firebase Console to add test users (`user1@example.com` → `Passw0rd!`).

## 🎨 UI & Styling
The UI is designed with **Tailwind CSS** and **Shadcn UI**, ensuring:
- **Modern, responsive design** (matching Vercel v0 output).
- **No basic HTML/CSS styling**.
- **Components follow v0 design**.

## 🛠️ Maintenance & Troubleshooting
| Issue | Solution |
|--------|----------|
| Firebase Errors | Check `.env.local` for correct API keys & install Firebase SDK (`npm install firebase`). |
| UI Issues | Verify Tailwind setup in `styles/globals.css` and `tailwind.config.js`. |
| Deployment Failures | Ensure Vercel CLI is logged in, and Firebase services are correctly set up. |
| Logging | Check **DevTools Console (F12)** & **Firebase Logs**. |

## 🤝 Contributing
We welcome contributions! 
### Steps:
1. **Fork the repo**
2. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature
   ```
3. **Commit changes**:
   ```bash
   git commit -m "Add your feature"
   ```
4. **Push branch**:
   ```bash
   git push origin feature/your-feature
   ```
5. **Submit a Pull Request (PR)**

**Follow**:
- ES Modules & Firebase v9+ standards.
- UI consistency with v0 output.
- Thorough testing before PR submission.

## 📜 License
SkillXchange is licensed under **MIT License**. See [LICENSE](LICENSE) for details.

## 📞 Contact
👨‍💻 **Built By:** Samith Reddy, Shruhath Reddy, Prudhvi Manvith, Likhith  
📧 **Email:** [Samithreddy067@gmail.com](mailto:Samithreddy067@gmail.com)  
🐙 **GitHub:** [samithreddychinni](https://github.com/samithreddychinni)

---
💡 *Empower skill-sharing through seamless connections!* 🚀
