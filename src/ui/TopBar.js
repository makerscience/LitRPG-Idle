// TopBar — Gold, Mana, Fragments display + Level label + XP bar.
// Plain class receiving a Phaser scene ref. Owns its Phaser objects and event subs.

import Store from '../systems/Store.js';
import { on, EVENTS } from '../events.js';
import { format } from '../systems/BigNum.js';
import { LAYOUT, COLORS } from '../config.js';

export default class TopBar {
  constructor(scene) {
    this.scene = scene;
    this._unsubs = [];

    const { x, y, w, h } = LAYOUT.topBar;
    const state = Store.getState();

    // Background strip
    this.bg = scene.add.rectangle(x + w / 2, y + h / 2, w, h, COLORS.topBarBg);

    // Currency labels — left side
    const textStyle = { fontFamily: 'monospace', fontSize: '14px', color: '#ffffff' };
    const labelY = y + h / 2;

    this.goldText = scene.add.text(20, labelY, '', textStyle).setOrigin(0, 0.5);
    this.manaText = scene.add.text(200, labelY, '', textStyle).setOrigin(0, 0.5);
    this.fragText = scene.add.text(380, labelY, '', textStyle).setOrigin(0, 0.5);

    // Level + XP bar — right side
    this.levelText = scene.add.text(w - 280, labelY, '', textStyle).setOrigin(0, 0.5);

    // XP bar
    const xpBarX = w - 180;
    const xpBarW = 160;
    const xpBarH = 12;
    this.xpBarBg = scene.add.rectangle(xpBarX, labelY, xpBarW, xpBarH, COLORS.xpBar.bg).setOrigin(0, 0.5);
    this.xpBarFill = scene.add.rectangle(xpBarX, labelY, xpBarW, xpBarH, COLORS.xpBar.fill).setOrigin(0, 0.5);
    this.xpBarFill.setDisplaySize(0, xpBarH);
    this.xpBarMaxW = xpBarW;

    // Separator line below top bar
    this.separator = scene.add.rectangle(x + w / 2, y + h, w, 1, COLORS.separator);

    // Initial render
    this._refreshGold(state);
    this._refreshMana(state);
    this._refreshFragments(state);
    this._refreshLevel(state);
    this._refreshXp(state);

    // Subscribe to events
    this._unsubs.push(on(EVENTS.ECON_GOLD_GAINED, () => this._refreshGold(Store.getState(), true)));
    this._unsubs.push(on(EVENTS.ECON_MANA_CHANGED, () => this._refreshMana(Store.getState())));
    this._unsubs.push(on(EVENTS.ECON_FRAGMENTS_GAINED, () => this._refreshFragments(Store.getState(), true)));
    this._unsubs.push(on(EVENTS.PROG_XP_GAINED, () => this._refreshXp(Store.getState())));
    this._unsubs.push(on(EVENTS.PROG_LEVEL_UP, () => {
      const s = Store.getState();
      this._refreshLevel(s);
      this._refreshXp(s);
    }));
    // Refresh on currency spend (no pop — only pops on gain)
    this._unsubs.push(on(EVENTS.STATE_CHANGED, (data) => {
      if (data.changedKeys.includes('gold')) this._refreshGold(Store.getState());
      if (data.changedKeys.includes('glitchFragments')) this._refreshFragments(Store.getState());
    }));

    this._unsubs.push(on(EVENTS.SAVE_LOADED, () => {
      const s = Store.getState();
      this._refreshGold(s);
      this._refreshMana(s);
      this._refreshFragments(s);
      this._refreshLevel(s);
      this._refreshXp(s);
    }));
  }

  _refreshGold(state, pop = false) {
    this.goldText.setText(`GOLD ${format(state.gold)}`);
    if (pop) this._popTween(this.goldText);
  }

  _refreshMana(state) {
    this.manaText.setText(`MANA ${format(state.mana)}`);
  }

  _refreshFragments(state, pop = false) {
    this.fragText.setText(`FRAGMENTS ${format(state.glitchFragments)}`);
    if (pop) this._popTween(this.fragText);
  }

  _refreshLevel(state) {
    this.levelText.setText(`Lv.${state.playerStats.level}`);
  }

  _refreshXp(state) {
    const { xp, xpToNext } = state.playerStats;
    const ratio = xpToNext.gt(0) ? xp.div(xpToNext).toNumber() : 0;
    const fillW = Math.max(0, Math.min(1, ratio)) * this.xpBarMaxW;
    this.xpBarFill.setDisplaySize(fillW, 12);
  }

  _popTween(target) {
    this.scene.tweens.add({
      targets: target,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 100,
      yoyo: true,
      ease: 'Quad.easeOut',
    });
  }

  destroy() {
    for (const unsub of this._unsubs) unsub();
    this._unsubs = [];
  }
}
