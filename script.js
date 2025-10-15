/* =======================
   script.js — FULL FILE
   ======================= */

/* ---------- DOM ---------- */
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

/* ----- Sticker modal & carousel ----- */
const stickerModal = document.getElementById('stickerModal');
const track        = document.getElementById('track');   // container slide
const dotsWrap     = document.getElementById('dots');
const prevBtn      = document.getElementById('prevBtn');
const nextBtn      = document.getElementById('nextBtn');
const closeSticker = document.getElementById('closeSticker');

/* =======================
   STATE
   ======================= */
let started = false;
let autoOpenTimer = null;
let showBouquetTimer = null;
let isHang = false; // true nếu tên chứa "Hằng" (không dấu)

/* =======================
   CONFIG / DATA
   ======================= */

/* 6 ảnh mặc định & 6 ảnh dành riêng cho "Hằng"
   => THAY bằng tên file của bạn (để chung thư mục với index.html) */
const STICKERS_DEFAULT = [
  "a1.png","a2.png","a3.png",
  "a4.png","a5.png","a6.png"
];
const STICKERS_HANG = [
  "h1.png","h2.png","h3.png",
  "h4.png","h5.png","h6.png"
];

/* Mưa chữ */
const BASE_PHRASES = [
  "Luôn xinh đẹp, mãi vui.",
  "Hạnh phúc nhé, bạn thân.",
  "Tỏa sáng nha, cô gái!",
  "Chúc mừng 20/10, bạn!",
  "Vui vẻ, yêu đời nha."
];
const RARE_PHRASE = "Ai like you"; // chỉ với Hằng (thưa)

/* =======================
   HELPERS
   ======================= */
const normalizeVN = (s) =>
  (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/* Đổi icon tiêu đề theo tên & reset hiệu ứng khi đổi tên */
function applyNameState(rawName) {
  const nm = normalizeVN((rawName || '').trim());
  isHang = nm.includes('hang'); // "Hằng" -> "hang"

  titleIcon.src = isHang ? 'icon.png' : 'a2.png';
  titleIcon.alt = isHang ? 'Hằng' : 'icon';

  // reset hiệu ứng phóng to nếu trước đó đã add
  titleIcon.classList.remove('icon-grow-2x');
  titleEl.classList.remove('title-shift');

  // nếu modal sticker đang mở thì rebuild theo bộ mới
  if (stickerModal.classList.contains('open')) {
    closeStickerModal();
    openSticker();
  }
}

/* Mưa chữ & tim (support fullscreen sky) */
function spawnSky(isHangMode, countTexts = 28, countHearts = 14) {
  const isFull = sky.classList.contains('fullscreen');
  const W = isFull ? window.innerWidth  : (sky.clientWidth  || 560);
  const H = isFull ? window.innerHeight : (sky.clientHeight || 560);
  sky.style.setProperty('--h', H + 'px');

  // Hằng: 3 câu thường + 1 rare; người khác: chỉ thường
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

/* Mở thư */
function openLetter() {
  letterModal.classList.add('open');
  heartCta.classList.remove('show');
  if (autoOpenTimer) { clearTimeout(autoOpenTimer); autoOpenTimer = null; }
  if (showBouquetTimer) { clearTimeout(showBouquetTimer); showBouquetTimer = null; }
}

/* =======================
   STICKER CAROUSEL
   ======================= */
let current = 0;
let autoTimer = null;
let slides = []; // sẽ lấy lại mỗi lần build

function buildSlidesBySet(imgList){
  track.innerHTML = imgList.map(src =>
    `<div class="slide"><img src="${src}" alt="sticker"></div>`
  ).join("");
  slides = Array.from(track.children);
}

function buildDots(){
  dotsWrap.innerHTML = '';
  slides.forEach((_, i) => {
    const d = document.createElement('button');
    if(i === current) d.classList.add('active');
    d.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(d);
  });
}

function goTo(idx){
  current = (idx + slides.length) % slides.length;
  track.style.transform = `translateX(-${current*100}%)`;
  [...dotsWrap.children].forEach((dot, i) => {
    dot.classList.toggle('active', i === current);
  });
}

function next(){ goTo(current + 1); }
function prev(){ goTo(current - 1); }

function startAuto(){
  stopAuto();
  autoTimer = setInterval(next, 2500);
}
function stopAuto(){
  if(autoTimer){ clearInterval(autoTimer); autoTimer = null; }
}

function openSticker(){
  const set = isHang ? STICKERS_HANG : STICKERS_DEFAULT;
  buildSlidesBySet(set);

  current = 0;
  buildDots();
  goTo(0);

  stickerModal.classList.add('open');
  startAuto();
}
function closeStickerModal(){
  stopAuto();
  stickerModal.classList.remove('open');
}

/* =======================
   EVENTS
   ======================= */

/* Nhấn "Xong" trong modal nhập tên */
nameOk.addEventListener('click', () => {
  applyNameState(nameInput.value);
  nameModal.classList.remove('open');
  nameModal.style.display = 'none';
});

/* Bắt đầu khi bấm ảnh intro */
gift.addEventListener('click', async () => {
  if (started) return;
  started = true;

  try { await bgm.play(); } catch (_) {}

  gift.classList.add('hidden');
  tapHint.classList.add('hidden');
  stage.classList.remove('hidden');

  // Phủ toàn màn hình mưa chữ trước khi hoa xuất hiện
  sky.classList.add('fullscreen');

  // 1) Mưa chữ
  spawnSky(isHang);

  // 2) 5s sau đưa hoa lên + mờ nền mưa
  showBouquetTimer = setTimeout(() => {
    sky.classList.add('dim');
    bouquetWrap.classList.add('rise');

    // Icon tiêu đề phóng to & chừa khoảng trống
    titleIcon.classList.add('icon-grow-2x');
    titleEl.classList.add('title-shift');

    bouquetWrap.addEventListener('animationend', () => {
      congrats.classList.add('show');
      heartCta.classList.add('show');
      // 3) Tự mở thư sau 10s nếu chưa bấm
      autoOpenTimer = setTimeout(openLetter, 10000);
    }, { once: true });
  }, 5000);
});

/* Nút trái tim mở thư */
heartCta.addEventListener('click', openLetter);

/* Đóng thư → mở sticker */
closeLetter.addEventListener('click', () => {
  letterModal.classList.remove('open');
  openSticker();
});
letterModal.addEventListener('click', (e) => {
  if (e.target === letterModal){
    letterModal.classList.remove('open');
    openSticker();
  }
});

/* ESC: đóng/mở phù hợp */
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape'){
    if (letterModal.classList.contains('open')) {
      letterModal.classList.remove('open'); openSticker();
    } else if (stickerModal.classList.contains('open')) {
      closeStickerModal();
    }
  }
});

/* Double-click tiêu đề để mở lại modal đổi tên (tuỳ chọn) */
titleEl.addEventListener('dblclick', () => {
  nameModal.classList.add('open');
  setTimeout(() => nameInput.focus(), 50);
});

/* Carousel: arrows */
nextBtn.addEventListener('click', () => { next(); startAuto(); });
prevBtn.addEventListener('click', () => { prev(); startAuto(); });

/* Đóng sticker */
closeSticker.addEventListener('click', closeStickerModal);
stickerModal.addEventListener('click', e => {
  if(e.target === stickerModal) closeStickerModal();
});

/* Swipe (touch) */
let startX = 0, dx = 0, dragging = false;
track.addEventListener('touchstart', e => {
  if(!stickerModal.classList.contains('open')) return;
  dragging = true; stopAuto();
  startX = e.touches[0].clientX; dx = 0;
}, {passive:true});

track.addEventListener('touchmove', e => {
  if(!dragging) return;
  dx = e.touches[0].clientX - startX;
  const percent = dx / track.clientWidth * 100;
  track.style.transition = 'none';
  track.style.transform = `translateX(calc(-${current*100}% + ${percent}%))`;
}, {passive:true});

track.addEventListener('touchend', () => {
  if(!dragging) return;
  dragging = false;
  track.style.transition = '';
  if (Math.abs(dx) > track.clientWidth * 0.2){
    (dx < 0) ? next() : prev();
  } else {
    goTo(current);
  }
  startAuto();
});
