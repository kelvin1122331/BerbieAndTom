/**
 * Semua jendela panel: Dapur, Gaya & Toko, Pengaturan, Laporan harian, Bantuan.
 * Panel hanya membaca state dan memanggil aksi lewat `api`.
 */

import { el, escapeHtml, setText } from './dom.js';
import { confirmDialog } from './modal.js';
import { FOODS, availableFoods, foodEffects, canConsume, foodKey } from '../data/foods.js';
import { THEMES, outfitsFor, accessoriesFor, outfitKey, accessoryKey, themeKey } from '../data/cosmetics.js';
import { STAT_LIST, STAT_IDS } from '../core/stats.js';
import { SPEEDS, speedByMul, formatTime, SLEEP_SECONDS } from '../core/time.js';
import { GENERAL_TIPS, STAT_TIPS } from '../data/tips.js';
import { missionsSummary } from '../core/missions.js';

const STAT_META = new Map(STAT_LIST.map((s) => [s.id, s]));

function effectsTags(effects) {
  return Object.entries(effects ?? {})
    .filter(([, value]) => Number(value) !== 0)
    .map(([key, value]) => {
      const meta = STAT_META.get(key);
      if (!meta) return '';
      const num = Math.round(Number(value));
      return `<span class="tag tag--${num > 0 ? 'up' : 'down'}">${meta.icon} ${num > 0 ? '+' : ''}${num}</span>`;
    })
    .join('');
}

function itemCard({ icon, name, desc, price = 0, owned = true, active = false, disabled = false, extraTags = '', actionLabel, hint = '', onClick }) {
  const tags = el('div', { class: 'item__effects', html: `${extraTags}${hint ? `<span class="tag">${escapeHtml(hint)}</span>` : ''}` });
  const foot = el('div', { class: 'item__foot' });
  const priceNode = el('span', { class: 'item__price' }, owned || !price ? 'Dimiliki' : `🪙 ${price}`);
  const button = el(
    'button',
    {
      class: `btn btn--small ${owned ? 'btn--ghost' : price ? 'btn--dark' : 'btn--primary'}`,
      type: 'button',
      disabled: disabled ? '' : null,
    },
    actionLabel ?? (owned ? 'Pakai' : `Beli 🪙 ${price}`)
  );
  foot.append(priceNode, tags, button);

  const card = el(
    'div',
    {
      class: `item${active ? ' is-equipped' : ''}${disabled ? ' is-disabled' : ''}`,
      style: icon.color ? `--item-tint:${icon.color}` : null,
    },
    el('span', { class: 'item__icon', 'aria-hidden': 'true' }, icon.emoji ?? icon.text ?? '•'),
    el('span', { class: 'item__name' }, name),
    el('span', { class: 'item__desc' }, desc ?? ''),
    active ? el('span', { class: 'item__preview' }, 'Dipakai') : null,
    foot
  );
  button.addEventListener('click', () => {
    if (!disabled) onClick?.();
  });
  return card;
}

function tabs(list, activeId, onPick) {
  const wrap = el('div', { class: 'tabbar', role: 'tablist' });
  for (const tab of list) {
    const btn = el('button', {
      class: 'tab',
      type: 'button',
      role: 'tab',
      'aria-selected': tab.id === activeId ? 'true' : 'false',
      dataset: { tab: tab.id },
    }, tab.label);
    btn.addEventListener('click', () => onPick(tab.id));
    wrap.append(btn);
  }
  return wrap;
}

function grid(children, emptyText = 'Belum ada item di sini.') {
  if (!children.length) return el('p', { class: 'empty' }, emptyText);
  return el('div', { class: 'shopgrid' }, children);
}

export function createPanels({ api, modal, toast, audio }) {
  const state = () => api.getState();

  function owned(key) {
    return state().unlocked.items.includes(key);
  }

  /* ---------------- DAPUR ---------------- */
  function openKitchen(tabId = 'makan') {
    if (api.isBusy()) {
      toast.show('Tidak bisa membuka dapur sekarang.', { icon: '⏳', tone: 'bad' });
      return;
    }
    let current = tabId;
    const content = el('div');
    let entry = null;

    const draw = () => {
      content.innerHTML = '';
      const char = api.character();
      const list = availableFoods(char.id, state().unlocked.items);
      const shopList = FOODS.filter((f) => !f.pantry);

      content.append(
        tabs(
          [
            { id: 'makan', label: '🍱 Makanan' },
            { id: 'minum', label: '🥤 Minuman' },
            { id: 'obat', label: '🌿 Sehat & Obat' },
            { id: 'toko', label: '🛍️ Toko Makanan' },
          ],
          current,
          (id) => {
            current = id;
            draw();
          }
        )
      );

      if (current === 'toko') {
        const cards = shopList.map((food) => {
          const isOwned = owned(foodKey(food.id));
          const affordable = state().coins >= food.price;
          return itemCard({
            icon: { emoji: food.emoji, color: food.color },
            name: food.name,
            desc: food.desc,
            price: food.price,
            owned: isOwned,
            disabled: !isOwned && !affordable,
            actionLabel: isOwned ? 'Sudah dibuka' : `Beli 🪙 ${food.price}`,
            extraTags: effectsTags(foodEffects(food, char).effects),
            hint: isOwned ? 'Tersedia di dapur' : affordable ? '' : `Kurang ${food.price - state().coins} koin`,
            onClick: () => {
              if (isOwned) {
                modal.close(entry.id);
                api.feed(food.id);
                return;
              }
              api.buy(foodKey(food.id), food.price, `Menu ${food.name}`);
              draw();
            },
          });
        });
        content.append(el('p', { class: 'section-title' }, 'Buka menu sekali, dipakai selamanya'), grid(cards));
        return;
      }

      const filtered = list.filter((food) => {
        if (current === 'obat') return food.kind === 'obat';
        if (current === 'minum') return food.kind === 'minum';
        return food.kind === 'makan';
      });

      const cards = filtered.map((food) => {
        const { effects, tag } = foodEffects(food, char);
        const check = canConsume(food, state().stats);
        const fromShop = !food.pantry;
        return itemCard({
          icon: { emoji: food.emoji, color: food.color },
          name: food.name,
          desc: food.desc,
          owned: true,
          disabled: !check.ok,
          actionLabel: 'Beri',
          extraTags: `${effectsTags(effects)}${
            tag === `favorit-${char.id}` ? '<span class="tag tag--fav">★ Favorit</span>' : ''
          }${tag === `hindari-${char.id}` ? '<span class="tag tag--no">Kurang suka</span>' : ''}`,
          hint: check.ok ? (fromShop ? 'Item toko' : '') : check.reason,
          onClick: () => {
            modal.close(entry.id);
            api.feed(food.id);
          },
        });
      });

      if (!cards.length) {
        content.append(
          el('p', { class: 'empty' }, 'Belum ada di kategori ini. Buka Toko Makanan untuk menambah menu.')
        );
      } else {
        content.append(grid(cards));
      }
      content.append(
        el(
          'p',
          { class: 'section-title' },
          `Catatan ${char.name}: ${char.appetiteNote}`
        )
      );
    };

    draw();
    entry = modal.open({
      title: `Dapur ${state().name}`,
      subtitle: `Koin kamu: ${state().coins} 🪙 · Pilih menu untuk ${state().name}`,
      content,
      onClose: () => audio.play('soft'),
    });
  }

  /* ---------------- GAYA & TOKO ---------------- */
  function openWardrobe(tabId = 'busana') {
    let current = tabId;
    const content = el('div');
    let entry = null;

    const draw = () => {
      content.innerHTML = '';
      const st = state();
      const char = api.character();
      content.append(
        tabs(
          [
            { id: 'busana', label: '👗 Busana' },
            { id: 'aksesori', label: '🎒 Aksesori' },
            { id: 'kamar', label: '🛏️ Kamar' },
            { id: 'toko', label: '🛍️ Toko' },
          ],
          current,
          (id) => {
            current = id;
            draw();
          }
        )
      );

      const outfitCards = outfitsFor(char.id).map((fit) => {
        const isOwned = fit.price === 0 || owned(outfitKey(fit.id));
        const equipped = st.dressing.outfit === fit.id;
        return itemCard({
          icon: { text: '👗', color: fit.swatch },
          name: fit.name,
          desc: fit.desc,
          price: fit.price,
          owned: isOwned,
          active: equipped,
          disabled: !isOwned,
          actionLabel: isOwned ? (equipped ? 'Dipakai' : 'Pakai') : `Beli 🪙 ${fit.price}`,
          hint: isOwned ? '' : 'Butuh koin',
          onClick: () => {
            if (!isOwned) {
              api.buy(outfitKey(fit.id), fit.price, fit.name, () => api.equip('outfit', fit.id));
            } else if (!equipped) {
              api.equip('outfit', fit.id);
            }
            draw();
          },
        });
      });

      const accCards = accessoriesFor(char.id).map((acc) => {
        const isOwned = owned(accessoryKey(acc.id));
        const equipped = st.dressing.accessory === acc.id;
        return itemCard({
          icon: { text: '🎀', color: acc.swatch },
          name: acc.name,
          desc: acc.desc,
          price: acc.price,
          owned: isOwned,
          active: equipped,
          disabled: false,
          actionLabel: isOwned ? (equipped ? 'Lepas' : 'Pakai') : `Beli 🪙 ${acc.price}`,
          hint: isOwned ? '' : 'Butuh koin',
          onClick: () => {
            if (!isOwned) {
              api.buy(accessoryKey(acc.id), acc.price, acc.name, () => api.equip('accessory', acc.id));
            } else {
              api.equip('accessory', equipped ? null : acc.id);
            }
            draw();
          },
        });
      });

      const themeCards = THEMES.map((theme) => {
        const isOwned = theme.price === 0 || owned(themeKey(theme.id));
        const active = st.dressing.theme === theme.id;
        return itemCard({
          icon: { text: '🛏️', color: theme.swatch },
          name: theme.name,
          desc: theme.desc,
          price: theme.price,
          owned: isOwned,
          active,
          disabled: !isOwned,
          actionLabel: isOwned ? (active ? 'Dipakai' : 'Pakai') : `Beli 🪙 ${theme.price}`,
          onClick: () => {
            if (!isOwned) {
              api.buy(themeKey(theme.id), theme.price, theme.name, () => api.applyTheme(theme.id));
            } else if (!active) {
              api.applyTheme(theme.id);
            }
            draw();
          },
        });
      });

      if (current === 'busana') content.append(grid(outfitCards));
      else if (current === 'aksesori') content.append(grid(accCards));
      else if (current === 'kamar') content.append(grid(themeCards));
      else {
        const catalog = [
          ...outfitsFor(char.id).map((item) => ({ ...item, kind: 'outfit', key: outfitKey(item.id) })),
          ...accessoriesFor(char.id).map((item) => ({ ...item, kind: 'accessory', key: accessoryKey(item.id) })),
          ...THEMES.filter((t) => t.price > 0).map((item) => ({ ...item, kind: 'theme', key: themeKey(item.id) })),
        ];
        const shopThings = catalog.filter((item) => item.price > 0 && !owned(item.key)).map((item) => ({ item, key: item.key }));
        const cards = shopThings.map(({ item, key }) =>
          itemCard({
            icon: { text: item.kind === 'accessory' ? '🎀' : item.kind === 'theme' ? '🛏️' : '👗', color: item.swatch },
            name: item.name,
            desc: item.desc,
            price: item.price,
            owned: false,
            disabled: state().coins < item.price,
            hint: state().coins < item.price ? `Kurang ${item.price - state().coins} koin` : '',
            onClick: () => {
              api.buy(key, item.price, item.name, () =>
                item.kind === 'theme' ? api.applyTheme(item.id) : api.equip(item.kind, item.id)
              );
              draw();
            },
          })
        );
        content.append(
          el('p', { class: 'section-title' }, 'Barang yang belum kamu punya'),
          grid(cards, 'Semua barang sudah kamu miliki. Keren!')
        );
      }

      content.append(
        el(
          'p',
          { class: 'item__desc', style: 'margin-top:14px' },
          'Setiap ganti gaya memberi +3 Kebahagiaan. Koin didapat dari misi harian, mini-game, dan skor perawatan saat pagi.'
        )
      );
    };

    draw();
    entry = modal.open({
      title: `Lemari ${state().name}`,
      subtitle: `Koin kamu: ${state().coins} 🪙`,
      content,
    });
  }

  /* ---------------- LAPORAN ---------------- */
  function openReport() {
    const st = state();
    const summary = missionsSummary(st.missions);
    const avg = Math.round(STAT_IDS.reduce((sum, id) => sum + (st.stats[id] ?? 0), 0) / STAT_IDS.length);
    const tips = Object.entries(STAT_TIPS)
      .map(([id, text]) => `<li><b>${escapeHtml(STAT_META.get(id).label)}:</b> ${escapeHtml(text)}</li>`)
      .join('');
    const report = st.dailyReport;
    const content = el('div', {
      class: 'report',
      html: `
        <div class="report__hero">
          <p class="report__score">${avg}</p>
          <p class="report__stars">${'★'.repeat(Math.max(1, Math.round(avg / 20)))}${'☆'.repeat(5 - Math.max(1, Math.round(avg / 20)))}</p>
          <p>Rata-rata seluruh kebutuhan ${escapeHtml(st.name)} saat ini</p>
        </div>
        <dl class="report__grid">
          <div class="report__cell"><dt>Hari</dt><dd>${st.day}</dd></div>
          <div class="report__cell"><dt>Level</dt><dd>${st.level}</dd></div>
          <div class="report__cell"><dt>Koin</dt><dd>${st.coins}</dd></div>
          <div class="report__cell"><dt>Runtutan baik</dt><dd>${st.streak} hari</dd></div>
          <div class="report__cell"><dt>Total hari</dt><dd>${st.counts.totalDays}</dd></div>
          <div class="report__cell"><dt>Aksi</dt><dd>${st.counts.makan + st.counts.minum + st.counts.mandi + st.counts.main + st.counts.gaya}</dd></div>
        </dl>
        <div>
          <p class="section-title">Misi hari ini — ${summary.done}/${summary.total}</p>
          <ul class="missionlist">
            ${st.missions
              .map(
                (m) => `<li class="mission${m.done ? ' is-done' : ''}">
                  <span class="mission__icon">${m.done ? '✅' : m.icon}</span>
                  <span><span class="mission__label">${escapeHtml(m.label)}</span></span>
                  <span class="mission__count">${Math.floor(m.progress)}/${m.target}</span>
                </li>`
              )
              .join('')}
          </ul>
        </div>
        ${
          report
            ? `<div>
                <p class="section-title">Hasil tidur terakhir (hari ${report.day})</p>
                <dl class="report__grid">
                  <div class="report__cell"><dt>Skor</dt><dd>${report.score}</dd></div>
                  <div class="report__cell"><dt>Bintang</dt><dd>${'★'.repeat(report.stars)}</dd></div>
                  <div class="report__cell"><dt>Bonus</dt><dd>${report.coins} koin</dd></div>
                </dl>
              </div>`
            : '<p class="empty">Belum ada laporan. Selesaikan satu hari sampai tidur untuk melihatnya.</p>'
        }
        <div>
          <p class="section-title">Tips</p>
          <ul class="howto" style="text-align:left">${tips}</ul>
        </div>`,
    });
    modal.open({ title: 'Laporan Perawatan', subtitle: 'Ringkasan kondisi dan progres hari ini', content });
  }

  /* ---------------- PENGATURAN ---------------- */
  function openSettings() {
    const st = state();
    const content = el('div');

    const speedRow = el(
      'div',
      { class: 'setting-row' },
      el(
        'div',
        { class: 'setting-row__text' },
        el('span', { class: 'setting-row__title' }, 'Kecepatan waktu'),
        el('span', { class: 'setting-row__desc' }, 'Satu hari aktif: 05:00 → 18:00, lalu tidur 30 detik.')
      )
    );
    const seg = el('div', { class: 'segmented', role: 'group', 'aria-label': 'Kecepatan waktu' });
    for (const speed of SPEEDS) {
      const btn = el('button', { class: 'segmented__btn', type: 'button', 'aria-pressed': (st.clock.speedId ?? speedByMul(st.clock.speed).id) === speed.id ? 'true' : 'false' }, speed.label);
      btn.addEventListener('click', () => {
        api.setSpeed(speed.id);
        for (const node of seg.querySelectorAll('.segmented__btn')) {
          node.setAttribute('aria-pressed', node === btn ? 'true' : 'false');
        }
        toast.show(`Kecepatan waktu: ${speed.label} (${speed.hint})`, { icon: '⏱' });
      });
      seg.append(btn);
    }
    speedRow.append(seg);

    const soundRow = toggleRow('Suara', 'Efek klik, siraman air, dan lonceng pagi.', st.settings.sound, (onState) => api.setSound(onState));
    const motionRow = toggleRow('Animasi penuh', 'Matikan jika ingin lebih tenang / hemat baterai.', st.settings.motion !== 'reduced', (onState) =>
      api.setMotion(onState ? 'full' : 'reduced')
    );
    const realRow = toggleRow('Tampilkan jam asli', 'Perlihatkan jam perangkat di samping jam kamar.', st.settings.showRealClock, (onState) =>
      api.setSetting('showRealClock', onState)
    );

    const nameRow = el('div', { class: 'setting-row' });
    const nameField = el('label', { class: 'field', style: 'min-width:220px' }, el('span', { class: 'field__label' }, 'Nama karakter'));
    const input = el('input', { type: 'text', id: 'rename-input', maxlength: '14', value: st.name });
    const saveBtn = el('button', { class: 'btn btn--small btn--primary', type: 'button' }, 'Ganti nama');
    nameField.append(input);
    const doRename = () => {
      const ok = api.rename(input.value);
      toast.show(ok ? `Nama diganti menjadi ${api.getState().name}.` : 'Nama minimal 1 huruf.', {
        icon: ok ? '🏷️' : '⚠️',
        tone: ok ? 'good' : 'bad',
      });
    };
    saveBtn.addEventListener('click', doRename);
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        doRename();
      }
    });
    nameRow.append(
      el(
        'div',
        { class: 'setting-row__text' },
        el('span', { class: 'setting-row__title' }, 'Nama panggilan'),
        el('span', { class: 'setting-row__desc' }, 'Maksimal 14 karakter.')
      ),
      nameField,
      saveBtn
    );

    const danger = el(
      'div',
      { class: 'setting-row' },
      el(
        'div',
        { class: 'setting-row__text' },
        el('span', { class: 'setting-row__title' }, 'Data permainan'),
        el('span', { class: 'setting-row__desc' }, `Jam kamar ${formatTime(st.clock.minutes)} · Hari ${st.day} · Progres otomatis tersimpan di browser.`)
      ),
      el(
        'div',
        { style: 'display:flex;gap:8px;flex-wrap:wrap' },
        (() => {
          const btn = el('button', { class: 'btn btn--small btn--ghost', type: 'button' }, 'Ganti karakter');
          btn.addEventListener('click', () => {
            modal.closeAll();
            api.switchCharacter();
          });
          return btn;
        })(),
        (() => {
          const btn = el('button', { class: 'btn btn--small btn--dark', type: 'button' }, 'Mulai hari baru');
          btn.addEventListener('click', () =>
            confirmDialog(modal, {
              title: 'Mulai hari baru?',
              text: 'Status, koin, dan level tetap disimpan. Misi harian direset dan jam kembali ke 05:00.',
              confirmLabel: 'Ya, reset hari',
              onConfirm: () => api.resetDay(),
            })
          );
          return btn;
        })(),
        (() => {
          const btn = el('button', { class: 'btn btn--small btn--dark', type: 'button' }, 'Hapus semua data');
          btn.addEventListener('click', () =>
            confirmDialog(modal, {
              title: 'Hapus semua progres?',
              text: `${st.name}, level ${st.level}, ${st.coins} koin, dan semua barang akan hilang. Tidak bisa dibatalkan.`,
              confirmLabel: 'Hapus',
              danger: true,
              onConfirm: () => api.wipe(),
            })
          );
          return btn;
        })()
      )
    );

    content.append(
      el('p', { class: 'section-title' }, 'Waktu'),
      speedRow,
      el('p', { class: 'section-title' }, 'Tampilan & suara'),
      soundRow,
      motionRow,
      realRow,
      el('p', { class: 'section-title' }, 'Karakter'),
      nameRow,
      danger,
      el(
        'p',
        { class: 'item__desc', style: 'margin-top:12px' },
        `Ketika jam menyentuh 18:00, ${st.name} wajib tidur ${SLEEP_SECONDS} detik lalu otomatis kembali ke 05:00.`
      )
    );

    modal.open({ title: 'Pengaturan', subtitle: 'Atur waktu, suara, dan data permainan', content });
  }

  function toggleRow(title, desc, value, onChange) {
    const input = el('input', { type: 'checkbox' });
    input.checked = Boolean(value);
    const label = el('label', { class: 'switch' }, input, el('span', {}, 'Nyala'));
    input.addEventListener('change', () => {
      setText(label.lastElementChild, input.checked ? 'Nyala' : 'Mati');
      onChange(input.checked);
    });
    const row = el(
      'div',
      { class: 'setting-row' },
      el('div', { class: 'setting-row__text' }, el('span', { class: 'setting-row__title' }, title), el('span', { class: 'setting-row__desc' }, desc)),
      label
    );
    return row;
  }

  /* ---------------- BANTUAN ---------------- */
  function openHelp() {
    const tips = GENERAL_TIPS.map((tip) => `<li>💡 ${escapeHtml(tip)}</li>`).join('');
    const content = el('div', {
      html: `
        <p class="section-title">Alur satu hari</p>
        <ul class="howto">
          <li><span class="howto__n">1</span> Pukul 05:00 hari dimulai. Rawat ${escapeHtml(state().name)} sampai pukul 18:00.</li>
          <li><span class="howto__n">2</span> Status Kenyang, Bersih, Bahagia, Energi, dan Sehat terus menurun.</li>
          <li><span class="howto__n">3</span> Pukul 18:00 malam tiba: tidur ${SLEEP_SECONDS} detik, lalu otomatis pagi lagi.</li>
          <li><span class="howto__n">4</span> Setiap pagi kamu dapat koin sesuai skor perawatan dan misi harian.</li>
        </ul>
        <p class="section-title">Tombol &amp; pintasan</p>
        <ul class="howto">
          <li><b>1</b> Dapur — beri makan &amp; minum</li>
          <li><b>2</b> Mandi — sabun, sikat noda, bilas</li>
          <li><b>3</b> Bermain — mini-game 20 detik</li>
          <li><b>4</b> Lemari &amp; Toko — busana, aksesori, tema kamar</li>
          <li><b>5</b> Tidur — aktif otomatis saat jam 18:00</li>
          <li><b>Esc</b> menutup jendela · <b>spasi</b> menjeda waktu kamar · <b>H</b> bantuan ini</li>
        </ul>
        <p class="section-title">Trik kecil</p>
        <ul class="howto">
          <li>Klik tubuhnya untuk membelai — tambah sedikit Bahagia (ada jeda 12 detik).</li>
          <li>Menu favorit memberi bonus, menu yang tidak disukai memberi penalti.</li>
          <li>Menang 5 poin di mini-game sudah cukup untuk menuntaskan misi bermain.</li>
        </ul>
        <p class="section-title">Tips tambahan</p>
        <ul class="howto">${tips}</ul>`,
    });
    modal.open({ title: 'Cara bermain', subtitle: 'Panduan singkat merawat karakter', content });
  }

  return { openKitchen, openWardrobe, openReport, openSettings, openHelp };
}
