# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

### Voice for blind users (no need to touch buttons)

- **In Expo Go:** The app uses a **tap-anywhere then speak** flow so blind users don’t need to find buttons. After the welcome message you’ll hear: *“Tap anywhere on the screen to speak your command.”* **Tap anywhere once** → a voice screen opens → **tap “Tap to speak”** → then say e.g. *“Start navigation”*, *“Scan surroundings”*, *“Emergency help”*, or *“Open devices”*. The app runs the command and speaks the result.
- **In a development build:** Continuous voice listening works. You’ll see “Voice listening” and can say commands without tapping.

Install the WebView dependency (used for voice in Expo Go):

```bash
npx expo install react-native-webview
```

For **continuous** voice (no tap), use a development build:

```bash
npx expo run:android
# or
npx expo run:ios
```

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
