/* =======================
   script.js — FULL FILE
   (mưa chữ fullscreen trước khi có hoa)
   ======================= */

// ---------- DOM ----------
const gift        = document.getElementById('gift');
const stage       = document.getElementById('stage');
const congrats    = document.getElementById('congrats');
const bouquetWrap = document.getElementById('bouquetWrap');
const heartCta    = document.getElementById('heartCta');
const sky         = document.getElementById('sky');

const letterModal = document.getElementById('letterModal');
const closeLetter = document.getElementById('closeLetter');
const tapHint     = document.getElementById('tap-hint');
const bgm         = document.getElementById('bgm');

const nameModal   = document.getElementById('nameModal');
const nameInput   = document.getElementById('nameInput');
const nameOk      = document.getElementById('nameOk');

const titleEl     = document.getElementById('title');
const titleIcon   = document.getElementById('titleIcon');

// ---------- STATE ----------
let started = false;
let autoOpenTimer = null;
let showBouquetTimer = null;
let isHang = false; // true nếu tên chứa "Hằng" (không dấu)

// ---------- HELPERS ----------
const normalizeVN = (s) =>
  (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const BASE_PHRASES = [
  "Luôn xinh đẹp, mãi vui.",
  "Hạnh phúc nhé, bạn thân.",
  "Tỏa sáng nha, cô gái!",
  "Chúc mừng 20/10, bạn!",
  "Vui vẻ, yêu đời nha."
];
const RARE_PHRASE = "Ai like you"; // chỉ với Hằng (tần suất thưa)

/** Đổi icon tiêu đề theo tên & reset hiệu ứng khi đổi tên */
function applyNameState(rawName) {
  const nm = normalizeVN((rawName || '').trim());
  isHang = nm.includes('hang'); // "Hằng" -> "hang"

  titleIcon.src = isHang ? 'icon.png' : 'icon1.png';
  titleIcon.alt = isHang ? 'Hằng' : 'icon';

  titleIcon.classList.remove('icon-grow-2x');
  titleEl.classList.remove('title-shift');
}

/** Sinh mưa chữ/tim. Khi sky có class .fullscreen: dùng kích thước viewport */
function spawnSky(isHangMode, countTexts = 28, countHearts = 14) {
  const isFull = sky.classList.contains('fullscreen');
  const W = isFull ? window.innerWidth  : (sky.clientWidth  || 560);
  const H = isFull ? window.innerHeight : (sky.clientHeight || 560);
  sky.style.setProperty('--h', H + 'px');

  // Hằng: 3 thường + 1 rare; người khác: chỉ thường
  const queue = [];
  let idx = 0;
  while (queue.length < countTexts) {
    for (let k = 0; k < 3 && queue.length < countTexts; k++) {
      queue.push(BASE_PHRASES[idx % BASE_PHRASES.length]); idx++;
    }
    if (isHangMode && queue.length < countTexts) queue.push(RARE_PHRASE);
  }

  function makeDrop(text, isHeart = false) {
    const el = document.createElement('div');
    el.className = 'drop' + (isHeart ? ' heart' : '');
    el.textContent = isHeart ? '❤' : text;

    const x = Math.floor(Math.random() * W) + 'px';
    const z = (Math.random() * 200 - 100) + 'px';
    const rot = (Math.random() * 30 - 15) + 'deg';
    const dur = (isHeart ? (3 + Math.random() * 3) : (4 + Math.random() * 3)).toFixed(2) + 's';
    const delay = (-Math.random() * 6).toFixed(2) + 's';

    el.style.setProperty('--x', x);
    el.style.setProperty('--z', z);
    el.style.setProperty('--rz', rot);
    el.style.setProperty('--dur', dur);
    el.style.setProperty('--delay', delay);
    el.style.fontSize = isHeart ? '18px' : (12 + Math.random() * 6) + 'px';
    sky.appendChild(el);
  }

  queue.forEach(t => makeDrop(t, false));
  for (let i = 0; i < countHearts; i++) makeDrop('❤', true);
}

function openLetter() {
  letterModal.classList.add('open');
  heartCta.classList.remove('show');
  if (autoOpenTimer) { clearTimeout(autoOpenTimer); autoOpenTimer = null; }
  if (showBouquetTimer) { clearTimeout(showBouquetTimer); showBouquetTimer = null; }
}

// ---------- EVENTS ----------

// Nhấn "Xong" trong modal nhập tên
nameOk.addEventListener('click', () => {
  applyNameState(nameInput.value);
  nameModal.classList.remove('open');
  nameModal.style.display = 'none';
});

// Bắt đầu khi bấm ảnh intro
gift.addEventListener('click', async () => {
  if (started) return;
  started = true;

  try { await bgm.play(); } catch (_) {}

  gift.classList.add('hidden');
  tapHint.classList.add('hidden');
  stage.classList.remove('hidden');

  // Phủ toàn màn hình trước khi hoa xuất hiện
  sky.classList.add('fullscreen');

  // 1) Mưa chữ (Ai like you chỉ cho Hằng)
  spawnSky(isHang);

  // 2) 5s sau đưa hoa lên + làm mờ nền mưa (giữ fullscreen, chỉ dim)
  showBouquetTimer = setTimeout(() => {
    sky.classList.add('dim');
    bouquetWrap.classList.add('rise');

    // Icon tiêu đề phóng to & chừa khoảng trống (nếu chỉ muốn cho Hằng: if (isHang) { ... })
    titleIcon.classList.add('icon-grow-2x');
    titleEl.classList.add('title-shift');

    bouquetWrap.addEventListener('animationend', () => {
      congrats.classList.add('show');
      heartCta.classList.add('show');
      autoOpenTimer = setTimeout(openLetter, 10000);
    }, { once: true });
  }, 5000);
});

// Nút trái tim mở thư
heartCta.addEventListener('click', openLetter);

// Đóng thư
closeLetter.addEventListener('click', () => letterModal.classList.remove('open'));
letterModal.addEventListener('click', (e) => {
  if (e.target === letterModal) letterModal.classList.remove('open');
});
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') letterModal.classList.remove('open');
});

// Tuỳ chọn: double-click tiêu đề để mở lại modal đổi tên
titleEl.addEventListener('dblclick', () => {
  nameModal.classList.add('open');
  setTimeout(() => nameInput.focus(), 50);
});
