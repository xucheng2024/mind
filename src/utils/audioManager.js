import { Howl } from 'howler';

class AudioManager {
  constructor() {
    this.audioCache = new Map();
    this.currentAudio = null;
    this.isPlaying = false;
  }

  // Load audio with caching support
  async loadAudio(url, options = {}) {
    try {
      // Check if audio is already cached
      if (this.audioCache.has(url)) {
        console.log('🎵 Audio loaded from cache:', url);
        return this.audioCache.get(url);
      }

      // Create new Howl instance
      const audio = new Howl({
        src: [url],
        html5: true, // Better PWA support
        preload: true,
        volume: options.volume || 1.0,
        onload: () => {
          console.log('🎵 Audio loaded successfully:', url);
        },
        onloaderror: (id, error) => {
          console.error('❌ Audio load error:', error);
        },
        onplay: () => {
          this.isPlaying = true;
          console.log('▶️ Audio started playing');
        },
        onpause: () => {
          this.isPlaying = false;
          console.log('⏸️ Audio paused');
        },
        onstop: () => {
          this.isPlaying = false;
          console.log('⏹️ Audio stopped');
        },
        onend: () => {
          this.isPlaying = false;
          console.log('🔚 Audio ended');
        }
      });

      // Cache the audio
      this.audioCache.set(url, audio);
      
      return audio;
    } catch (error) {
      console.error('❌ Error loading audio:', error);
      throw error;
    }
  }

  // Play audio from URL or cached instance
  async playAudio(url, options = {}) {
    try {
      // Stop current audio if playing
      if (this.currentAudio && this.isPlaying) {
        this.stopAudio();
      }

      // Load or get cached audio
      const audio = await this.loadAudio(url, options);
      this.currentAudio = audio;

      // Set up completion callback if provided
      if (options.onEnd) {
        audio.once('end', options.onEnd);
      }

      // Play the audio
      audio.play();
      
      return audio;
    } catch (error) {
      console.error('❌ Error playing audio:', error);
      throw error;
    }
  }

  // Pause current audio
  pauseAudio() {
    if (this.currentAudio && this.isPlaying) {
      this.currentAudio.pause();
    }
  }

  // Resume current audio
  resumeAudio() {
    if (this.currentAudio && !this.isPlaying) {
      this.currentAudio.play();
    }
  }

  // Stop current audio
  stopAudio() {
    if (this.currentAudio) {
      this.currentAudio.stop();
      this.currentAudio = null;
    }
  }

  // Set volume
  setVolume(volume) {
    if (this.currentAudio) {
      this.currentAudio.volume(volume);
    }
  }

  // Get current playback status
  getStatus() {
    return {
      isPlaying: this.isPlaying,
      currentAudio: this.currentAudio,
      hasAudio: !!this.currentAudio
    };
  }

  // Clear cache
  clearCache() {
    this.audioCache.forEach(audio => {
      if (audio) {
        audio.unload();
      }
    });
    this.audioCache.clear();
    console.log('🗑️ Audio cache cleared');
  }

  // Preload audio for offline use
  async preloadAudio(url) {
    try {
      await this.loadAudio(url);
      console.log('📥 Audio preloaded for offline use:', url);
    } catch (error) {
      console.error('❌ Error preloading audio:', error);
    }
  }

  // Get cached audio URLs
  getCachedUrls() {
    return Array.from(this.audioCache.keys());
  }
}

// Create singleton instance
const audioManager = new AudioManager();

export default audioManager;
