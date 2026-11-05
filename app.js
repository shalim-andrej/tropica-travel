/* ============================================================
   TROPICA — общий скрипт для всех страниц
   ============================================================ */
(function () {
  "use strict";
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- Шапка при скролле --- */
  const header = $(".header");
  const onScroll = () => header && header.classList.toggle("scrolled", window.scrollY > 40);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* --- Мобильное меню --- */
  const burger = $(".burger"), nav = $(".nav");
  if (burger && nav) {
    burger.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      burger.setAttribute("aria-expanded", open);
      document.body.style.overflow = open ? "hidden" : "";
    });
    $$("a", nav).forEach(a => a.addEventListener("click", () => {
      nav.classList.remove("open");
      document.body.style.overflow = "";
    }));
  }

  /* --- Hero-видео: плейлист из 4 роликов по кругу (1 → 2 → 3 → 4 → 1) ---
     Постер-first, без звука, уважает reduced-motion.
     Файлы: assets/video/hero-1.mp4 … hero-4.mp4 --- */
  const HERO_CLIPS = [
    "assets/video/hero-1.mp4",
    "assets/video/hero-2.mp4",
    "assets/video/hero-3.mp4",
    "assets/video/hero-4.mp4",
  ];
  const video = $(".hero__media video");
  if (video) {
    if (reducedMotion) {
      video.remove(); // остаётся статичный постер-картинка под видео
    } else {
      video.muted = true;
      let current = 0;
      let failedInRow = 0;

      const load = (index) => {
        current = index;
        video.src = HERO_CLIPS[current];
        video.load();
        video.play().catch(() => {}); // muted-автоплей разрешён браузерами
      };

      // Ролик закончился — переходим к следующему по кругу
      video.addEventListener("ended", () => load((current + 1) % HERO_CLIPS.length));

      // Ролик не загрузился — пропускаем его; если все подряд сломаны, убираем видео (останется постер)
      video.addEventListener("error", () => {
        failedInRow++;
        if (failedInRow >= HERO_CLIPS.length) { video.remove(); return; }
        load((current + 1) % HERO_CLIPS.length);
      });
      video.addEventListener("playing", () => { failedInRow = 0; });

      load(0);
    }
  }

  /* --- Появление блоков при скролле --- */
  const revealEls = $$(".reveal");
  if ("IntersectionObserver" in window && !reducedMotion) {
    const io = new IntersectionObserver(entries => {
      entries.forEach((e, i) => {
        if (e.isIntersecting) {
          e.target.style.transitionDelay = (i % 3) * 90 + "ms";
          e.target.classList.add("visible");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add("visible"));
  }

  /* --- Фильтры направлений (тип отдыха + сезон) --- */
  const filterRoot = $(".filters");
  if (filterRoot) {
    const state = { type: "all", season: "all" };
    const cards = $$("[data-type]");
    const empty = $(".filters__empty");
    const apply = () => {
      let visible = 0;
      cards.forEach(card => {
        const types = (card.dataset.type || "").split(" ");
        const seasons = (card.dataset.season || "").split(" ");
        const okType = state.type === "all" || types.includes(state.type);
        const okSeason = state.season === "all" || seasons.includes(state.season);
        const show = okType && okSeason;
        card.style.display = show ? "" : "none";
        if (show) visible++;
      });
      if (empty) empty.classList.toggle("show", visible === 0);
    };
    $$(".filters__row").forEach(row => {
      const group = row.dataset.group;
      $$(".chip", row).forEach(chip => {
        chip.addEventListener("click", () => {
          $$(".chip", row).forEach(c => c.classList.remove("active"));
          chip.classList.add("active");
          state[group] = chip.dataset.value;
          apply();
        });
      });
    });
  }

  /* --- FAQ-аккордеон --- */
  $$(".faq__item").forEach(item => {
    const btn = $(".faq__q", item), body = $(".faq__a", item);
    btn.addEventListener("click", () => {
      const open = item.classList.toggle("open");
      body.style.maxHeight = open ? body.scrollHeight + "px" : "0px";
      btn.setAttribute("aria-expanded", open);
    });
  });

  /* --- Лайтбокс галереи --- */
  const lightbox = $(".lightbox");
  if (lightbox) {
    const lbImg = $("img", lightbox), lbCap = $("figcaption", lightbox);
    $$(".gallery figure").forEach(fig => {
      fig.addEventListener("click", () => {
        const img = $("img", fig);
        lbImg.src = img.src;
        lbImg.alt = img.alt;
        lbCap.textContent = img.alt;
        lightbox.classList.add("open");
        document.body.style.overflow = "hidden";
      });
    });
    const close = () => {
      lightbox.classList.remove("open");
      document.body.style.overflow = "";
    };
    $(".lightbox__close", lightbox).addEventListener("click", close);
    lightbox.addEventListener("click", e => { if (e.target === lightbox) close(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
  }

  /* --- Демо-формы: валидация без отправки данных --- */
  $$("form[data-demo]").forEach(form => {
    form.addEventListener("submit", e => {
      e.preventDefault();
      let valid = true;
      $$("[required]", form).forEach(input => {
        const field = input.closest(".field");
        let ok = input.value.trim().length > 1;
        if (input.type === "tel") ok = input.value.replace(/\D/g, "").length >= 10;
        if (field) field.classList.toggle("error", !ok);
        if (!ok) valid = false;
      });
      if (!valid) return;
      const success = $(".form__success", form);
      if (success) success.classList.add("show");
      form.reset();
    });
    $$("input", form).forEach(input =>
      input.addEventListener("input", () => {
        const f = input.closest(".field");
        if (f) f.classList.remove("error");
      })
    );
  });

  /* --- Текущий год в подвале --- */
  const yearEl = $(".js-year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
