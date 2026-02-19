// TimeEngine — tick scheduler with interval-based callback registry.
// Called once per frame from GameScene.update().

const tickers = [];

const TimeEngine = {
  init() {
    tickers.length = 0;
  },

  destroy() {
    tickers.length = 0;
  },

  /** Called every frame with delta in ms. Iterates tickers, fires when elapsed >= interval. */
  update(deltaMs) {
    for (let i = tickers.length - 1; i >= 0; i--) {
      const t = tickers[i];
      if (!t.enabled) continue;

      t.elapsed += deltaMs;

      if (t.elapsed >= t.interval) {
        t.callback(t.elapsed);
        if (t.once) {
          tickers.splice(i, 1);
        } else {
          t.elapsed -= t.interval;
        }
      }
    }
  },

  /** Add a recurring ticker. initialElapsed offsets the first tick (use negative to delay). */
  register(id, callback, intervalMs, enabled = true, initialElapsed = 0) {
    // Replace if already registered
    TimeEngine.unregister(id);
    tickers.push({ id, callback, interval: intervalMs, elapsed: initialElapsed, enabled, once: false });
  },

  /** Remove a ticker by id. */
  unregister(id) {
    const idx = tickers.findIndex(t => t.id === id);
    if (idx !== -1) tickers.splice(idx, 1);
  },

  /** Toggle a ticker on/off. */
  setEnabled(id, enabled) {
    const t = tickers.find(t => t.id === id);
    if (t) t.enabled = enabled;
  },

  /** One-shot timer — removed after firing. */
  scheduleOnce(id, callback, delayMs) {
    // Replace if already scheduled
    TimeEngine.unregister(id);
    tickers.push({ id, callback, interval: delayMs, elapsed: 0, enabled: true, once: true });
  },
};

export default TimeEngine;
