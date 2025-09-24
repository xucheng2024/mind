# AppClinic

A modern Progressive Web App (PWA) for clinic management and wellness training.

## Features

### 🏥 Core Functions
- **Medical Records**: Digital health record management
- **Profile Management**: User profile and settings
- **Calendar**: Appointment scheduling and management

### 🧠 Brain Training
- **Digit Span Training**: Adaptive working memory exercises
  - **Forward Span**: Repeat digits in the same order
  - **Backward Span**: Repeat digits in reverse order  
  - **Updating Span**: Remember the last N digits (sliding window)
- **Adaptive Difficulty**: Automatic adjustment based on performance
- **Progress Tracking**: Local storage of records and statistics
- **Session Management**: 30 rounds total (10 per mode)

### 🧘 Mind Training
- **Meditation Sessions**: Guided mindfulness practices
- **Breathing Exercises**: Structured breathing techniques
- **Progress Tracking**: Session history and statistics

## Technology Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **State Management**: React Hooks + React Query
- **Storage**: Local Storage + Supabase
- **PWA**: Workbox service worker
- **UI Components**: Radix UI + Lucide Icons
- **Performance**: Code splitting and lazy loading

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Brain Training Details

The Brain Training module implements scientifically-based working memory exercises:

### Adaptive Algorithm
- **Increase difficulty**: 2 consecutive correct answers
- **Decrease difficulty**: 2 consecutive wrong answers
- **Automatic adjustment**: Maintains optimal challenge level

### Training Modes
1. **Forward Span**: Increases sequence length (2-∞ digits)
2. **Backward Span**: Increases sequence length (2-∞ digits)  
3. **Updating Span**: Increases memory window (3-5 digits)

### Performance Tracking
- Personal records for each mode
- Total sessions completed
- Daily streak tracking
- Progress persistence across sessions

## Development

Built with modern web standards for optimal performance and user experience.
