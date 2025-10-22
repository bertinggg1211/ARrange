# 🚀 Complete Setup Guide for React Native E-commerce App with AR

## 📋 Prerequisites

### System Requirements
- **Node.js**: Version 18 or higher
- **npm**: Comes with Node.js
- **Git**: For version control
- **React Native CLI**: `npm install -g react-native-cli`

### Platform-Specific Requirements

#### For Android Development:
- **Android Studio** (latest version)
- **Android SDK** (API level 33 or higher)
- **Java Development Kit (JDK) 17**
- **Android Emulator** or physical Android device

#### For iOS Development (Mac only):
- **Xcode** (latest version)
- **iOS Simulator** or physical iOS device
- **CocoaPods**: `sudo gem install cocoapods`

## 🔧 Installation Steps

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/ThesisFinal.git
cd ThesisFinal
```

### 2. Install Dependencies

#### Main Project Dependencies:
```bash
npm install
```

#### Server Dependencies:
```bash
cd server
npm install
cd ..
```

#### iOS Dependencies (Mac only):
```bash
cd ios
pod install
cd ..
```

### 3. Environment Configuration

#### Create Environment Files

**Create `.env` file in the root directory:**
```bash
# React Native App Environment Variables
# (This file is for the mobile app configuration)
```

**Create `server/.env` file:**
```bash
# Server Environment Variables
# Copy this template and fill in your actual values

# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_role_key_here

# JWT Configuration
JWT_SECRET=your_secure_jwt_secret_here

# Cloudinary Configuration (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Kiri Engine Configuration (for AR scanning)
KIRI_API_KEY=your_kiri_api_key_here
KIRI_BASE_URL=https://api.kiriengine.app
KIRI_WEBHOOK_SECRET=your_webhook_secret_here
APP_PUBLIC_URL=https://your-ngrok-url.ngrok-free.dev

# Server Configuration
PORT=5000
NODE_ENV=development
```

### 4. Database Setup

#### Supabase Setup:
1. Go to [Supabase](https://supabase.com) and create a new project
2. Get your project URL and API keys from Settings > API
3. Update the `server/.env` file with your Supabase credentials
4. Run the database setup scripts:

```bash
cd server
node setup-supabase-tables.js
```

#### Database Schema:
The project includes several SQL files for database setup:
- `setup-supabase-tables.sql` - Main database schema
- `create-chat-tables.js` - Chat functionality tables
- `orders-database-schema.sql` - Orders management

### 5. External Services Setup

#### Cloudinary (Image Storage):
1. Sign up at [Cloudinary](https://cloudinary.com)
2. Get your cloud name, API key, and API secret
3. Update `server/.env` with your Cloudinary credentials

#### Kiri Engine (AR Scanning):
1. Sign up at [Kiri Engine](https://kiriengine.app)
2. Get your API key and webhook secret
3. Update `server/.env` with your Kiri credentials

### 6. Network Configuration

#### Update Server URLs:
Edit `src/config/environment.js` and `src/config/serverConfig.js` to match your setup:

```javascript
// Update these URLs to match your development environment
const ENVIRONMENT_CONFIGS = {
  [ENVIRONMENTS.DEVELOPMENT]: {
    API_BASE_URL: 'http://YOUR_LOCAL_IP:5000',  // Change this
    SOCKET_URL: 'http://YOUR_LOCAL_IP:5000',     // Change this
    IMAGE_BASE_URL: 'http://YOUR_LOCAL_IP:5000', // Change this
    DEBUG_MODE: true,
    APP_NAME: 'ARrange (Dev)',
  },
  // ... other environments
};
```

## 🚀 Running the Application

### 1. Start the Server
```bash
cd server
npm start
# or for development with auto-restart:
npm run dev
```

### 2. Start the React Native App

#### For Android:
```bash
# Make sure Android emulator is running or device is connected
npm run android
```

#### For iOS (Mac only):
```bash
# Make sure iOS Simulator is running
npm run ios
```

#### For Development Server Only:
```bash
npm start
```

## 🔧 Troubleshooting

### Common Issues:

#### 1. Metro Bundler Issues:
```bash
# Clear Metro cache
npx react-native start --reset-cache
```

#### 2. Android Build Issues:
```bash
# Clean Android build
cd android
./gradlew clean
cd ..
```

#### 3. iOS Build Issues:
```bash
# Clean iOS build
cd ios
rm -rf Pods
pod install
cd ..
```

#### 4. Node Modules Issues:
```bash
# Clear node modules and reinstall
rm -rf node_modules
rm -rf server/node_modules
npm install
cd server && npm install && cd ..
```

### Environment Variables Missing:
If you get errors about missing environment variables:
1. Check that `server/.env` file exists
2. Verify all required variables are set
3. Restart the server after making changes

### Database Connection Issues:
1. Verify Supabase credentials in `server/.env`
2. Check that your Supabase project is active
3. Run database setup scripts again

## 📱 Platform-Specific Setup

### Android Setup:
1. Install Android Studio
2. Set up Android SDK
3. Create an Android Virtual Device (AVD)
4. Enable USB Debugging on physical devices

### iOS Setup (Mac only):
1. Install Xcode from App Store
2. Install iOS Simulator
3. Run `pod install` in the `ios` directory

## 🔐 Security Notes

- Never commit `.env` files to version control
- Use strong, unique secrets for production
- Regularly rotate API keys and secrets
- Use environment-specific configurations

## 📞 Support

If you encounter issues:
1. Check the console logs for error messages
2. Verify all environment variables are set correctly
3. Ensure all dependencies are installed
4. Check that external services (Supabase, Cloudinary, Kiri) are accessible

## 🎯 Quick Start Checklist

- [ ] Node.js 18+ installed
- [ ] Git repository cloned
- [ ] Dependencies installed (`npm install` in root and server)
- [ ] Environment files created with correct values
- [ ] Database setup completed
- [ ] External services configured
- [ ] Server running (`npm start` in server directory)
- [ ] React Native app running (`npm run android` or `npm run ios`)

---

**Note**: This is a complex React Native application with AR functionality. Make sure to follow all setup steps carefully and configure all external services properly.
