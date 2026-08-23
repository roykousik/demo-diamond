const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

$$(".fx-up").forEach((el) =>
  el.addEventListener("animationend", () => el.classList.add("fx-done"), { once: true })
);

const header = $(".site-header");
const navToggle = $("#navToggle");
const primaryNav = $("#primary-nav");
const desktopMQ = window.matchMedia("(min-width: 64em)");

function setNav(open) {
  document.body.classList.toggle("nav-open", open);
  navToggle.setAttribute("aria-expanded", String(open));
  navToggle.setAttribute("aria-label", open ? "Close navigation menu" : "Toggle navigation menu");
  if (open) {
    const first = $("a, button", primaryNav);
    if (first) first.focus();
  }
}

navToggle.addEventListener("click", () => {
  setNav(!document.body.classList.contains("nav-open"));
});

$("#scrim").addEventListener("click", () => setNav(false));

document.addEventListener("keydown", (e) => {
  if (!document.body.classList.contains("nav-open")) return;
  if (e.key === "Escape") {
    setNav(false);
    navToggle.focus();
    return;
  }
  if (e.key !== "Tab") return;
  const focusables = $$("a[href], button:not([disabled])", header).filter(
    (el) => el.offsetParent !== null || el === navToggle
  );
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
});

$$(".nav-list a", primaryNav).forEach((link) =>
  link.addEventListener("click", () => setNav(false))
);

desktopMQ.addEventListener("change", (e) => {
  if (e.matches) setNav(false);
});

const menuButtons = $$(".menu-button");

function closeMenu(btn) {
  btn.setAttribute("aria-expanded", "false");
  $("#" + btn.getAttribute("aria-controls")).removeAttribute("data-open");
}

function closeAllMenus(except) {
  menuButtons.forEach((btn) => btn !== except && closeMenu(btn));
}

menuButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const isOpen = btn.getAttribute("aria-expanded") === "true";
    closeAllMenus(btn);
    btn.setAttribute("aria-expanded", String(!isOpen));
    $("#" + btn.getAttribute("aria-controls")).toggleAttribute("data-open", !isOpen);
  });
  btn.parentElement.addEventListener("focusout", (e) => {
    if (!btn.parentElement.contains(e.relatedTarget)) closeMenu(btn);
  });
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".nav-item")) closeAllMenus();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const openBtn = menuButtons.find((b) => b.getAttribute("aria-expanded") === "true");
    if (openBtn) {
      closeMenu(openBtn);
      openBtn.focus();
    }
  }
});

if ("IntersectionObserver" in window) {
  const spyLinks = new Map(
    $$(".nav-link[data-spy]").map((l) => [l.dataset.spy, l])
  );
  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const link = spyLinks.get(entry.target.id);
        if (!link) return;
        spyLinks.forEach((l) => l.removeAttribute("aria-current"));
        link.setAttribute("aria-current", "true");
      });
    },
    { rootMargin: "-40% 0px -55% 0px" }
  );
  ["top", "about", "services", "contact"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) spy.observe(el);
  });

  const revealIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealIO.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );
  $$(".reveal").forEach((el) => revealIO.observe(el));

  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  const countIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        countIO.unobserve(entry.target);
        const el = entry.target;
        const target = parseInt(el.dataset.count, 10);
        const suffix = el.dataset.suffix || "";
        if (reduceMotion || Number.isNaN(target)) {
          el.textContent = target + suffix;
          return;
        }
        const start = performance.now();
        const tick = (now) => {
          const p = Math.min((now - start) / 1100, 1);
          el.textContent = Math.round(easeOutCubic(p) * target) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    },
    { threshold: 0.6 }
  );
  $$("[data-count]").forEach((el) => countIO.observe(el));
} else {
  $$(".reveal").forEach((el) => el.classList.add("visible"));
}

const form = $("#consultForm");
if (form) {
  const status = $("#formStatus");
  const success = $("#formSuccess");
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRe = /^[\d\s()+.-]{7,}$/;

  const rules = {
    "f-name": (v) => v.trim().length > 0,
    "f-email": (v) => emailRe.test(v.trim()),
    "f-phone": (v) => v.trim() === "" || phoneRe.test(v.trim()),
    "f-message": (v) => v.trim().length > 0
  };

  let attempted = false;

  function validate(id) {
    const input = $("#" + id);
    const error = $("#" + id.replace("f-", "e-"));
    const ok = rules[id](input.value);
    input.setAttribute("aria-invalid", String(!ok));
    error.toggleAttribute("data-shown", !ok);
    return ok;
  }

  Object.keys(rules).forEach((id) => {
    const input = $("#" + id);
    input.addEventListener("blur", () => {
      if (attempted) validate(id);
    });
    input.addEventListener("input", () => {
      if (attempted && input.getAttribute("aria-invalid") === "true") validate(id);
    });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    attempted = true;
    status.innerHTML = "";
    const invalidIds = Object.keys(rules).filter((id) => !validate(id));
    if (invalidIds.length) {
      $("#" + invalidIds[0]).focus();
      status.innerHTML =
        '<p class="status-error">Please fix the highlighted fields and try again.</p>';
      return;
    }
    form.hidden = true;
    success.hidden = false;
    success.classList.add("visible");
    success.focus();
  });
}

$("#year").textContent = new Date().getFullYear();

if (finePointer && !reduceMotion) {
  $$(".tilt").forEach((el) => {
    let raf = 0;
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform = `perspective(900px) rotateX(${(-py * 5).toFixed(2)}deg) rotateY(${(px * 7).toFixed(2)}deg) translateY(-4px)`;
        el.style.setProperty("--mx", `${((px + 0.5) * 100).toFixed(1)}%`);
        el.style.setProperty("--my", `${((py + 0.5) * 100).toFixed(1)}%`);
      });
    });
    el.addEventListener("pointerleave", () => {
      cancelAnimationFrame(raf);
      el.style.transform = "";
    });
  });
}

const siteHeader = $(".site-header");
const progressBar = $(".scroll-progress");
const scrollTopBtn = $("#scrollTop");

let lastY = window.scrollY;
let ticking = false;

const updateScroll = () => {
  const y = window.scrollY;
  if (progressBar) {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.transform = `scaleX(${max > 0 ? (y / max).toFixed(4) : 0})`;
  }
  if (scrollTopBtn) {
    if (y > 600) scrollTopBtn.setAttribute("data-shown", "");
    else scrollTopBtn.removeAttribute("data-shown");
  }
  if (!reduceMotion && siteHeader && !document.body.classList.contains("nav-open")) {
    if (y > 160 && y > lastY + 4) siteHeader.classList.add("header-hidden");
    else if (y < lastY - 4 || y <= 160) siteHeader.classList.remove("header-hidden");
  }
  lastY = y;
  ticking = false;
};

window.addEventListener(
  "scroll",
  () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateScroll);
  },
  { passive: true }
);

if (siteHeader) {
  siteHeader.addEventListener("focusin", () =>
    siteHeader.classList.remove("header-hidden")
  );
}

if (scrollTopBtn) {
  scrollTopBtn.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: reduceMotion ? "auto" : "smooth"
    });
  });
}
