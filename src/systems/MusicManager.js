import { on, EVENTS } from '../events.js';
import Store from './Store.js';

const TRACK_URL = 'Sound/soundtrack/ambient progression.mp3';

let bgm = null;
let settingsUnsub = null;
let resumeBound = null;

function getVolumeFromStore() {
  return Store.getState()?.settings?.musicVolume ?? 0.5;
}

function removeResumeHandler() {
  if (!resumeBound) return;
  document.removeEventListener('pointerdown', resumeBound);
  document.removeEventListener('keydown', resumeBound);
  resumeBound = null;
}

function addResumeHandler() {
  if (resumeBound) return;
  resumeBound = () => {
    if (!bgm) {
      removeResumeHandler();
      return;
    }
    bgm.play()
      .then(() => removeResumeHandler())
      .catch(() => {});
  };
  document.addEventListener('pointerdown', resumeBound);
  document.addEventListener('keydown', resumeBound);
}

const MusicManager = {
  init() {
    if (settingsUnsub) return;
    settingsUnsub = on(EVENTS.STATE_CHANGED, ({ changedKeys } = {}) => {
      if (!Array.isArray(changedKeys) || !changedKeys.includes('settings')) return;
      this.syncVolumeFromStore();
    });
  },

  ensurePlaying() {
    if (!bgm) {
      bgm = new Audio(TRACK_URL);
      bgm.loop = true;
    }
    this.syncVolumeFromStore();
    bgm.play()
      .then(() => removeResumeHandler())
      .catch(() => addResumeHandler());
    return bgm;
  },

  syncVolumeFromStore() {
    this.setVolume(getVolumeFromStore());
  },

  setVolume(volume) {
    const clamped = Math.max(0, Math.min(1, Number(volume) || 0));
    if (bgm) bgm.volume = clamped;
  },

  destroy() {
    removeResumeHandler();
    if (settingsUnsub) {
      settingsUnsub();
      settingsUnsub = null;
    }
    if (bgm) {
      bgm.pause();
      bgm.src = '';
      bgm = null;
    }
  },
};

export default MusicManager;
