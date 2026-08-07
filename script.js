// ========== 動態視窗大小調整 ==========
function adjustHeroSize() {
  const heroContent = document.querySelector('.hero-main-content');
  const organizers = document.querySelector('.organizers');
  if (!heroContent || !organizers) return;

  const windowWidth = window.innerWidth;
  // 使用 visualViewport 高度較不受手機網址列影響
  const windowHeight = (window.visualViewport && window.visualViewport.height)
    ? Math.round(window.visualViewport.height)
    : window.innerHeight;

  // ===== 主視覺最大寬度計算（雙圖友善版） =====
  let optimalWidth;
  if (windowWidth > 768) {
    // 桌機：左右兩張加上間距，容器更寬（上限 1300px，佔螢幕寬 90%）
    optimalWidth = Math.min(1280, windowWidth * 0.94);
  } else {
    // 手機
    if (windowWidth >= 1920)      optimalWidth = Math.min(650, windowWidth * 0.35);
    else if (windowWidth >= 1440) optimalWidth = Math.min(600, windowWidth * 0.4);
    else if (windowWidth >= 1024) optimalWidth = Math.min(550, windowWidth * 0.45);
    else if (windowWidth >= 768)  optimalWidth = Math.min(500, windowWidth * 0.6);
    else                          optimalWidth = Math.min(windowWidth * 0.95, 600);
  }

  // 不超過視窗高度 80%（僅手機）
  const maxHeightBasedWidth = windowHeight * 0.8;
  if (optimalWidth > maxHeightBasedWidth && windowWidth <= 768) {
    optimalWidth = maxHeightBasedWidth;
  }
  heroContent.style.maxWidth = optimalWidth + 'px';

  // ===== 調整 organizers 的 margin-top（手機 / 平板 / PC）=====
  if (windowWidth <= 768) {
    organizers.style.marginTop = (windowHeight * 0.87) + 'px';
  } else if (windowWidth <= 1199) {
    organizers.style.marginTop = (windowHeight * 0.78) + 'px'; // 平板：留多一點空間
  } else {
    organizers.style.marginTop = (windowHeight * 0.72) + 'px'; // PC：更貼近
  }

  // ===== Hero 垂直置中 =====
  if (windowWidth <= 768) {
    const topPosition = windowHeight <= 667 ? 15 : 18;
    heroContent.style.top = topPosition + '%';
    heroContent.style.transform = `translate(-50%, -${topPosition}%)`;
    baseTopPercent = topPosition;
  } else {
    heroContent.style.top = '50%';
    heroContent.style.transform = 'translate(-50%, -50%)';
    baseTopPercent = 50;
  }
}

// 節流的 resize
let resizeTimer;
window.addEventListener('resize', function () {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(adjustHeroSize, 100);
});

// 若支援 visualViewport，監聽其變化（手機網址列/鍵盤影響）
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(adjustHeroSize, 50);
  });
}

let baseTopPercent = 32; // 跟著 adjustHeroSize() 同步

// ========== 滾動效果 ==========
const heroSection = document.querySelector('.hero');
const heroBg = document.querySelector('.hero-background');
const heroMain = document.querySelector('.hero-main-content');

let ticking = false;
function updateHeroEffect() {
  const scrolled = window.pageYOffset;
  const windowHeight = window.innerHeight;

  // 進度 0 ~ 1
  const progress = Math.min(scrolled / windowHeight, 1);

  // 背景圖：漸進放大 + 模糊
  heroBg.style.transform = `scale(${1 + progress * 0.15}) translateY(${progress * -40}px)`;
  heroBg.style.filter = `blur(${progress * 5}px)`;

  // 主視覺：跟著基準 top% 上移 + 微縮 + 微模糊 + 漸隱
  const moveUp = window.innerWidth <= 768 ? 24 : 32;
  heroMain.style.transform = `translate(-50%, -${baseTopPercent + progress * moveUp}%) scale(${1 - progress * 0.08})`;
  heroMain.style.filter = `blur(${progress * 3}px)`;
  heroMain.style.opacity = Math.max(0, 1 - progress * 1.1);

  // 黑色遮罩：漸進加深
  heroSection.style.setProperty('--overlay-opacity', Math.min(progress * 0.7, 0.7));

  ticking = false;
}

function requestTick() {
  if (!ticking) {
    window.requestAnimationFrame(updateHeroEffect);
    ticking = true;
  }
}
window.addEventListener('scroll', requestTick);

// 返回頂部
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // 回頂後重算方式更精準（不丟假的 resize）
  const recalcBanner = () => { adjustHeroSize(); updateHeroEffect(); };

  if ('onscrollend' in window) {
    window.addEventListener('scrollend', recalcBanner, { once: true });
  } else {
    // 非 scrollend：用 rAF 偵測停止在頂端
    let lastY = window.scrollY, idle = 0;
    const tick = () => {
      const y = window.scrollY;
      if (y === 0 && y === lastY) idle++; else idle = 0;
      lastY = y;
      if (idle >= 6) recalcBanner(); else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}

// 顯示/隱藏「返回頂部」
window.addEventListener('scroll', function () {
  const backToTopBtn = document.querySelector('.back-to-top');
  if (window.pageYOffset > 300) backToTopBtn.classList.add('visible');
  else backToTopBtn.classList.remove('visible');
});

// ========== 初始化 ==========
document.addEventListener('DOMContentLoaded', function () {
  // 初始化動態大小調整
  adjustHeroSize();

  // 平滑滾動到錨點
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // 元素進入視窗動畫
  const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -100px 0px' };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);

  document.querySelectorAll('.prize-card').forEach(item => {
    item.style.opacity = '0';
    item.style.transform = 'translateY(20px)';
    item.style.transition = 'all 0.6s ease';
    observer.observe(item);
  });

  /* ========== 內容保護 (選用，可移除) ========== */
  document.addEventListener('contextmenu', e => { e.preventDefault(); return false; });
  document.addEventListener('dragstart', e => { if (e.target.tagName === 'IMG') { e.preventDefault(); return false; } });
  document.addEventListener('selectstart', e => { if (e.target.tagName === 'IMG') { e.preventDefault(); return false; } });
  document.addEventListener('keydown', function (e) {
    if (e.keyCode === 123) { e.preventDefault(); return false; }                 // F12
    if (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 67)) {     // Ctrl+Shift+I/C
      e.preventDefault(); return false;
    }
    if (e.ctrlKey && (e.keyCode === 85 || e.keyCode === 83)) {                   // Ctrl+U/S
      e.preventDefault(); return false;
    }
  });
});
