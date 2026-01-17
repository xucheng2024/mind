// Audio configuration for meditation sessions
export const AUDIO_CONFIG = {
  BODY_SCAN: {
    url: 'https://rsfkkiuoutgacrblubtt.supabase.co/storage/v1/object/sign/meditation/Patrick-Kozakiewicz-Short-Body-Scan.mp3?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82N2RkOTBiMy03MDE3LTQyZTYtODhlMS0wMzk5MGJlNWE4MTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJtZWRpdGF0aW9uL1BhdHJpY2stS296YWtpZXdpY3otU2hvcnQtQm9keS1TY2FuLm1wMyIsImlhdCI6MTc1NTI0NTg0MCwiZXhwIjoxOTEyOTI1ODQwfQ.ZEvMe4AuhEcENDxSv2iNjDfK_ypwPjvS9I8nrzl8Wyc',
    title: 'Body Scan',
    instructor: 'Patrick Kozakiewicz',
    duration: '10 min',
    image: '/body_scan.jpg',
    color: 'blue',
    storageKey: 'breathExerciseCount'
  },
  BODY_BREATH: {
    url: 'https://rsfkkiuoutgacrblubtt.supabase.co/storage/v1/object/sign/meditation/Meditation-1-Mindfulness-of-Body-and-Breath.mp3?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82N2RkOTBiMy03MDE3LTQyZTYtODhlMS0wMzk5MGJlNWE4MTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJtZWRpdGF0aW9uL01lZGl0YXRpb24tMS1NaW5kZnVsbmVzcy1vZi1Cb2R5LWFuZC1CcmVhdGgubXAzIiwiaWF0IjoxNzU1MjQ2NTI3LCJleHAiOjE5MTI5MjY1Mjd9.pu5qcQfCyGBka3JRArNqUQXFp13GGh5RiJzcNdR5CyY',
    title: 'Body and Breath',
    instructor: 'Mark Williams',
    duration: '10 min',
    image: '/breathe_outdoor.jpg',
    color: 'emerald',
    storageKey: 'secondMeditationCount'
  },
  MOVEMENT: {
    url: 'https://rsfkkiuoutgacrblubtt.supabase.co/storage/v1/object/sign/meditation/Movement-with-Rebecca-Crane-10-min.mp3?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82N2RkOTBiMy03MDE3LTQyZTYtODhlMS0wMzk5MGJlNWE4MTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJtZWRpdGF0aW9uL01vdmVtZW50LXdpdGgtUmViZWNjYS1DcmFuZS0xMC1taW4ubXAzIiwiaWF0IjoxNzU1MjQ3NjA2LCJleHAiOjE5MTI5Mjc2MDZ9.uVntCBeQbaA0JpW1Tu717Ekb95pXVkg4RqDzK4wThs8',
    title: 'Mindful Movement',
    instructor: 'Rebecca Crane',
    duration: '10 min',
    image: '/movement.png',
    color: 'violet',
    storageKey: 'movementCount'
  },
  VIPASSANA: {
    url: 'https://rsfkkiuoutgacrblubtt.supabase.co/storage/v1/object/sign/meditation/Vipassana.mp3?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82N2RkOTBiMy03MDE3LTQyZTYtODhlMS0wMzk5MGJlNWE4MTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJtZWRpdGF0aW9uL1ZpcGFzc2FuYS5tcDMiLCJpYXQiOjE3NTg2MzU1NjMsImV4cCI6MjA3Mzk5NTU2M30.omJd7YBN8_Ir5G3kclHkTcHSHQCzUy1Pa4mYIW-nito',
    title: 'Mini Anapana',
    instructor: 'Goenka Practice',
    duration: '15 min',
    image: '/Vipassana.jpg',
    color: 'amber',
    storageKey: 'vipassanaCount'
  }
};
