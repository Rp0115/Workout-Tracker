# Pro-Forma: A Mobile Workout Planner

A cross-platform mobile application built with React Native and Expo that allows users to create, manage, and track personalized workout plans.

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/[your-username]/[your-repo])
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![React Native](https://img.shields.io/badge/React_Native-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-000020?style=flat&logo=expo&logoColor=white)](https://expo.dev/)

## Table of Contents

- [About The Project](#about-the-project)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Firebase Setup](#firebase-setup)
  - [Installation & Launch](#installation--launch)
- [Contributing](#contributing)
- [License](#license)
- [Contributors](#contributors)

---

## About The Project

Pro-Forma is a modern, intuitive workout planner designed to help users take control of their fitness journey. Built with **React Native** and **Expo**, this app provides a seamless cross-platform experience for both iOS and Android. It leverages **Firebase** for backend services, ensuring real-time data synchronization and secure user authentication.

This application provides a centralized, mobile-first platform where users can:

- **Create** custom, reusable workout plans from scratch.
- **Discover** new exercises from a comprehensive, built-in library.
- **Organize** and reorder plans with an intuitive drag-and-drop interface.

The goal is to provide a clean, fast, and user-friendly experience that makes fitness planning simple and effective.

---

## Key Features

- 🏋️ **Custom Workout Plans:** Create and edit detailed workout plans, specifying exercises, sets, and reps.
- 🔄 **Drag-and-Drop Interface:** Easily reorder entire workout plans on the main screen and individual exercises within a plan.
- 📚 **Comprehensive Exercise Library:** Browse, search, and filter through a pre-loaded library of hundreds of exercises to find the perfect movement.
- 🔍 **Advanced Filtering:** Filter exercises by muscle group, equipment, difficulty, category, and force type.
- 📱 **Cross-Platform & Responsive:** Built with Expo to run smoothly on both iOS and Android devices from a single codebase.
- ☁️ **Firebase Integration:** User data is securely stored and synced in real-time using Firestore, with user accounts managed by Firebase Authentication.
- 🎨 **Sleek UI:** A clean, modern interface with light and dark mode support for a comfortable user experience.

---

## Tech Stack

This project is a mobile application developed using the React Native and Expo frameworks.

| Component              | Technology / Library                                                                                                                                                                                              |
| :--------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Framework**          | ![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB) ![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white) |
| **Language**           | ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6.svg?style=for-the-badge&logo=typescript&logoColor=white)                                                                                             |
| **Backend & Database** | ![Firebase](https://img.shields.io/badge/Firebase-FFCA28.svg?style=for-the-badge&logo=firebase&logoColor=black)                                                                                                   |
| **UI & Animation**     | `react-native-draggable-flatlist`, `@expo/vector-icons`                                                                                                                                                           |

---

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS version recommended)
- [Expo Go](https://expo.dev/client) app on your iOS or Android device.
- A code editor like [VS Code](https://code.visualstudio.com/).

### Firebase Setup

This project uses Firebase for authentication and database storage. You'll need to set up your own Firebase project.

1.  Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2.  **Enable Firestore:** In the console, go to `Build > Firestore Database` and create a database. Start in **test mode** for easy setup (you can change security rules later).
3.  **Enable Authentication:** Go to `Build > Authentication` and enable the "Email/Password" sign-in method.
4.  **Get Config:** Go to your Project Settings (click the gear icon ⚙️) and under the "General" tab, scroll down to "Your apps".
5.  Click the web icon `</>` to create a new web app.
6.  After creating the app, you will be given a `firebaseConfig` object. Copy this object.
7.  Create a file named `firebaseConfig.js` (or `.ts`) in the root of the project and paste your config object into it, like so:

    ```javascript
    // Import the functions you need from the SDKs you need
    import { initializeApp } from "firebase/app";
    import { getFirestore } from "firebase/firestore";
    import { getAuth } from "firebase/auth";

    // Your web app's Firebase configuration
    const firebaseConfig = {
      apiKey: "YOUR_API_KEY",
      authDomain: "YOUR_AUTH_DOMAIN",
      projectId: "YOUR_PROJECT_ID",
      storageBucket: "YOUR_STORAGE_BUCKET",
      messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
      appId: "YOUR_APP_ID",
    };

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    export const db = getFirestore(app);
    export const auth = getAuth(app);
    ```

    > **Important:** The `firebaseConfig.js` file contains sensitive keys. Ensure it is added to your `.gitignore` file to prevent it from being committed to your repository.

### Installation & Launch

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/Rp0115/Workout-Tracker.git
    ```
2.  **Navigate into the project directory:**
    ```sh
    cd Workout-Tracker
    ```
3.  **Install NPM dependencies:**
    ```sh
    npm install
    ```
4.  **Launch the application:**
    ```sh
    npx expo start
    ```
    - This will start the Metro bundler. You can now open the app on your phone by scanning the QR code with the Expo Go app.

---

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## License

Distributed under the MIT License. See `LICENSE` file for more information.

## Contributors

- Riju Pant - https://github.com/Rp0115

Project Link: https://github.com/Rp0115/Workout-Tracker.git
