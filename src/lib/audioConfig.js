// Audio configuration for meditation sessions
export const AUDIO_CONFIG = {
  BODY_SCAN: {
    url: import.meta.env.VITE_AUDIO_BODY_SCAN_URL || '',
    title: 'Body Scan',
    instructor: 'Patrick Kozakiewicz',
    duration: '10 min',
    image: '/body_scan.jpg',
    color: 'blue',
    storageKey: 'breathExerciseCount'
  },
  BODY_BREATH: {
    url: import.meta.env.VITE_AUDIO_BODY_BREATH_URL || '',
    title: 'Body and Breath',
    instructor: 'Mark Williams',
    duration: '10 min',
    image: '/breathe_outdoor.jpg',
    color: 'emerald',
    storageKey: 'secondMeditationCount'
  },
  MOVEMENT: {
    url: import.meta.env.VITE_AUDIO_MOVEMENT_URL || '',
    title: 'Mindful Movement',
    instructor: 'Rebecca Crane',
    duration: '10 min',
    image: '/movement.png',
    color: 'violet',
    storageKey: 'movementCount'
  },
  VIPASSANA: {
    url: import.meta.env.VITE_AUDIO_VIPASSANA_URL || '',
    title: 'Mini Anapana',
    instructor: 'Goenka Practice',
    duration: '15 min',
    image: '/Vipassana.jpg',
    color: 'amber',
    storageKey: 'vipassanaCount'
  }
};
