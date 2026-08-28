# Workout Volume Tracker

A React Native (Expo) mobile app to track workout volume per muscle group with dashboards, progress charts, and workout planning capabilities.

## Features

- **Dashboard**: View weekly volume per muscle group, progress charts, and quick stats
- **Workout Logging**: Log sets with weight and reps, auto-calculate volume
- **Exercise Database**: 60+ pre-loaded exercises mapped to muscle groups
- **Workout Planner**: Create templates and schedule workouts on a calendar
- **Volume Tracking**: Track tonnage (weight × reps) per muscle group
- **Progress Visualization**: Bar charts and line charts for progress over time
- **Weekly Targets**: Set and track volume goals per muscle

## Tech Stack

- **Framework**: Expo (SDK 54)
- **Language**: TypeScript
- **UI**: Tamagui + React Native
- **Navigation**: Expo Router (file-based routing)
- **Backend**: Supabase (Auth + PostgreSQL)
- **State Management**: Zustand
- **Charts**: react-native-chart-kit

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- A Supabase account (free tier works)

### 1. Clone and Install

```bash
cd workout-tracker
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor and run the contents of `supabase/schema.sql`
3. Go to Project Settings > API and copy your project URL and anon key

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run the App

```bash
# Start the development server
npm start

# Or run on specific platform
npm run ios
npm run android
```

## Project Structure

```
workout-tracker/
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Bottom tab screens
│   │   ├── index.tsx      # Dashboard
│   │   ├── workout.tsx    # Workout logging
│   │   ├── planner.tsx    # Workout planner
│   │   └── profile.tsx    # Settings
│   └── (auth)/            # Auth screens
├── components/            # Reusable components
│   ├── dashboard/         # Dashboard widgets
│   ├── workout/           # Workout components
│   └── planner/           # Planner components
├── hooks/                 # Custom React hooks
├── stores/                # Zustand stores
├── lib/                   # Utilities & Supabase client
├── constants/             # Exercises & muscles data
└── supabase/              # Database schema
```

## Volume Calculation

Volume is calculated as **tonnage** (total weight lifted):

```
Set Volume = Weight × Reps
Exercise Volume = Sum of all set volumes
Muscle Volume = Exercise volumes (100% primary, 50% secondary)
```

## Muscle Groups (10)

1. Chest
2. Back
3. Shoulders
4. Biceps
5. Triceps
6. Quadriceps
7. Hamstrings
8. Glutes
9. Calves
10. Core

## License

MIT
