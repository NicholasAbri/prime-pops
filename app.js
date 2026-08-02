// PRIME POPS WhatsApp business number
const WHATSAPP_PHONE = "233530596326";

// Descriptions shown after a customer selects a flavor
const flavorDescriptions = {
  Milky: {
    icon: "🥛",
    title: "Milky",
    description:
      "Our signature flavor. Sweet, creamy popcorn made with rich milk flavor for a smooth and satisfying treat.",
  },
  "Cheddar Cheese": {
    icon: "🧀",
    title: "Cheddar Cheese",
    description:
      "A savory favorite with a rich, cheesy crunch that pairs perfectly with every bite.",
  },
};

// Product names, prices and available flavors
const menuPacks = {
  mini: {
    name: "Prime Mini",
    price: 10,
    flavors: ["Milky", "Cheddar Cheese"],
  },
  bossu: {
    name: "Prime Plus",
    price: 15,
    flavors: ["Milky", "Cheddar Cheese"],
  },
  bigman: {
    name: "Prime Deluxe",
    price: 25,
    flavors: ["Milky", "Cheddar Cheese"],
  },
};

// Independent per-pack order selection state
const packState = {
  mini: { flavor: "", quantity: 1, flavorError: false },
  bossu: { flavor: "", quantity: 1, flavorError: false },
  bigman: { flavor: "", quantity: 1, flavorError: false },
};

// Re-render Lucide icons after dynamic HTML updates
function refreshIcons() {
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }
}

// Open an external URL safely in a new browser tab
function openExternalUrl(url) {
  try {
    const win = window.open(url, "_blank", "noopener,noreferrer");
    if (win) {
      win.focus();
      return true;
    }
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
    return true;
  } catch (error) {
    return false;
  }
}

// Select a flavor for a specific pack
function selectFlavor(packId, flavor) {
  if (!packState[packId]) return;
  packState[packId].flavor = flavor;
  packState[packId].flavorError = false;
  renderPackCardControls(packId);
}

// Change quantity (+ or -) for a specific pack
function changePackQty(packId, delta) {
  if (!packState[packId]) return;
  const next = packState[packId].quantity + delta;
  if (next < 1 || next > 99) return;
  packState[packId].quantity = next;
  renderPackCardControls(packId);
}

// Render the interactive controls inside each product card
function renderPackCardControls(packId) {
  const holder = document.getElementById(`controls-${packId}`);
  if (!holder) return;

  const pack = menuPacks[packId];
  const state = packState[packId];
  const total = pack.price * state.quantity;
  const showError = state.flavorError && !state.flavor;

  holder.innerHTML = `
    <div class="flavor-selection-block mb-5 flex flex-col gap-2.5">
      <div class="text-xs font-black tracking-wider uppercase text-brand-cocoa/70 dark:text-orange-100/70 text-left">
        Choose your flavor
      </div>
      <div class="grid grid-cols-2 gap-3 ${showError ? "flavor-shake" : ""}">
        ${pack.flavors
          .map(
            (flavor) => `
          <button type="button"
            onclick="selectFlavor('${packId}', '${flavor}')"
            class="flavor-option-btn border border-brand-cocoa/10 dark:border-white/10 py-3.5 px-4 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer ${
              state.flavor === flavor
                ? "bg-brand-orange text-white dark:bg-brand-orange dark:text-white border-brand-orange shadow-md shadow-orange-500/20"
                : "bg-white/80 dark:bg-white/5 text-brand-cocoa dark:text-white hover:border-brand-orange/40 hover:bg-orange-50/50 dark:hover:bg-white/10"
            }">
            ${flavor}
          </button>
        `,
          )
          .join("")}
      </div>
      ${
        state.flavor && flavorDescriptions[state.flavor]
          ? `
        <div class="min-h-[84px] px-4 py-3 rounded-xl bg-orange-50/80 dark:bg-brand-orange/10 border border-orange-200/60 dark:border-orange-400/20 flex items-center justify-center text-center" role="status" aria-live="polite">
          <div class="text-xs w-full flex flex-col items-center justify-center">
            <p class="font-extrabold text-brand-cocoa dark:text-orange-100 leading-snug">${flavorDescriptions[state.flavor].title}</p>
            <p class="text-brand-gray dark:text-orange-100/70 mt-0.5 leading-relaxed font-medium">${flavorDescriptions[state.flavor].description} ${flavorDescriptions[state.flavor].icon}</p>
          </div>
        </div>
      `
          : ""
      }
      <p class="flavor-error mt-2.5 text-center text-xs font-bold text-red-500 ${showError ? "show" : ""}">Please select your preferred flavor first.</p>
    </div>

    <div class="bg-white/70 dark:bg-white/5 border border-brand-cocoa/5 dark:border-white/10 rounded-2xl px-4 py-3.5 mb-5 flex items-center justify-between gap-3 min-h-[58px]">
      <div class="text-left flex-1">
        <span class="text-[10px] font-black tracking-widest uppercase text-brand-gray dark:text-orange-100/60 block mb-1">Quantity</span>
        <span class="text-lg font-black text-brand-cocoa dark:text-white leading-none">${state.quantity}</span>
      </div>
      <div class="flex items-center gap-3">
        <button type="button"
          aria-label="Decrease quantity"
          onclick="changePackQty('${packId}', -1)"
          class="w-11 h-11 rounded-xl bg-white dark:bg-white/10 border border-brand-cocoa/10 dark:border-white/10 font-black text-xl text-brand-cocoa dark:text-white hover:border-brand-orange hover:bg-orange-50 dark:hover:bg-white/20 transition flex items-center justify-center cursor-pointer">
          −
        </button>
        <button type="button"
          aria-label="Increase quantity"
          onclick="changePackQty('${packId}', 1)"
          class="w-11 h-11 rounded-xl bg-white dark:bg-white/10 border border-brand-cocoa/10 dark:border-white/10 font-black text-xl text-brand-cocoa dark:text-white hover:border-brand-orange hover:bg-orange-50 dark:hover:bg-white/20 transition flex items-center justify-center cursor-pointer">
          +
        </button>
      </div>
    </div>

    <button type="button"
      onclick="orderOnWhatsApp('${packId}')"
      class="premium-button startup-primary-button w-full min-h-[52px] py-4 px-5 bg-brand-orange hover:bg-brand-orangeHover text-white text-xs sm:text-sm font-black tracking-wider uppercase rounded-2xl flex items-center justify-center gap-2.5 shadow-lg shadow-orange-500/25 transition-all duration-300 cursor-pointer">
      <i class="w-4 h-4 shrink-0" data-lucide="message-square"></i>
      <span>Order on WhatsApp • GH₵${total}</span>
    </button>
  `;
  refreshIcons();
}

// Render all product card controls
function renderAllPackControls() {
  Object.keys(menuPacks).forEach((packId) => {
    renderPackCardControls(packId);
  });
}

// Direct 1-tap WhatsApp order launch for a pack
function orderOnWhatsApp(packId) {
  if (!menuPacks[packId] || !packState[packId]) return;

  const pack = menuPacks[packId];
  const state = packState[packId];

  if (!state.flavor) {
    state.flavorError = true;
    renderPackCardControls(packId);
    document.getElementById(`pack-${packId}`)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    return;
  }

  const total = pack.price * state.quantity;
  const messageText = ` *PRIME POPS ORDER*

Hello! Here is your order summary:

*PRODUCT:* ${pack.name}
*FLAVOR:* ${state.flavor}
*QUANTITY:* ${state.quantity}
*TOTAL:* GH₵${total}


------------------------------------

*PLEASE FILL IN YOUR DETAILS BELOW BEFORE SENDING:*

*NAME:* 
*DELIVERY LOCATION:* 
*PREFERRED DATE:* 
*PREFERRED TIME:* 
*SPECIAL INSTRUCTIONS (Optional):*

Thank you!`;

  const whatsappText = messageText.normalize("NFC");
  const opened = openExternalUrl(
    `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(whatsappText)}`,
  );

  if (!opened) {
    showOrderErrorToast();
  }
}

// Generate and launch the bulk-order WhatsApp enquiry
function launchBulkWhatsApp() {
  const messageText = `*PRIME POPS BULK ORDER.*

Hello! I'd like to make a bulk order.


*PLEASE FILL IN YOUR DETAILS BELOW BEFORE SENDING:*

*NAME:* 
*EVENT TYPE:* 
*ESTIMATED QUANTITY:* 
*PREFERRED DATE:* 
*PREFERRED TIME:* 
*DELIVERY LOCATION:* 
*PREFERRED FLAVOR(S):* 
*SPECIAL INSTRUCTIONS (Optional):*

Thank you!`;

  const whatsappText = messageText.normalize("NFC");
  const opened = openExternalUrl(
    `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(whatsappText)}`,
  );

  if (!opened) {
    showOrderErrorToast();
  }
}

// Show a temporary error message if WhatsApp cannot be opened
function showOrderErrorToast() {
  const toast = document.getElementById("order-error-toast");
  if (!toast) return;
  toast.classList.remove("opacity-0", "pointer-events-none", "-translate-y-4");
  refreshIcons();
  window.setTimeout(
    () =>
      toast.classList.add("opacity-0", "pointer-events-none", "-translate-y-4"),
    6000,
  );
}

// Theme handling
function safeLocalStorageGet(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeLocalStorageSet(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {}
}

function setTheme(isDark) {
  document.documentElement.classList.toggle("dark", isDark);
  safeLocalStorageSet("primepops-theme", isDark ? "dark" : "light");
  document.querySelectorAll(".theme-icon").forEach((icon) => {
    icon.classList.remove("theme-icon-spin");
    void icon.offsetWidth;
    icon.classList.add("theme-icon-spin");
    icon.setAttribute("data-lucide", isDark ? "sun" : "moon");
  });
  refreshIcons();
}

function toggleTheme() {
  setTheme(!document.documentElement.classList.contains("dark"));
}

// DOM Initialization
document.addEventListener("DOMContentLoaded", () => {
  // Restore saved theme
  const savedTheme = safeLocalStorageGet("primepops-theme");
  if (savedTheme === "dark") document.documentElement.classList.add("dark");

  // Initial rendering of pack controls
  renderAllPackControls();
  refreshIcons();

  // Theme toggle handlers
  document
    .getElementById("theme-toggle")
    ?.addEventListener("click", toggleTheme);
  document
    .getElementById("theme-toggle-desktop")
    ?.addEventListener("click", toggleTheme);

  // Mobile navigation handler
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");
  if (mobileMenuBtn && mobileMenu) {
    const setMobileMenu = (open) => {
      mobileMenu.classList.toggle("open", open);
      mobileMenuBtn.classList.toggle("open", open);
      mobileMenuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      mobileMenu.setAttribute("aria-hidden", open ? "false" : "true");
    };
    mobileMenuBtn.addEventListener("click", () =>
      setMobileMenu(!mobileMenu.classList.contains("open")),
    );
    document
      .querySelectorAll(".mobile-link")
      .forEach((link) =>
        link.addEventListener("click", () => setMobileMenu(false)),
      );
  }

  // Scroll header and active link spy
  const navbar = document.getElementById("navbar");
  const progress = document.getElementById("scroll-progress");
  const navLinks = document.querySelectorAll(".nav-link");
  const sections = document.querySelectorAll("section, footer");
  let ticking = false;

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (navbar) {
          navbar.classList.toggle("glass-nav", y > 40);
          navbar.classList.toggle("shadow-md", y > 40);
          navbar.classList.toggle("bg-transparent", y <= 40);
        }
        if (progress) {
          const max =
            document.documentElement.scrollHeight - window.innerHeight;
          progress.style.width = max > 0 ? `${(y / max) * 100}%` : "0%";
        }
        let current = "home";
        sections.forEach((s) => {
          if (y >= s.offsetTop - 170) current = s.id;
        });
        if (
          window.innerHeight + y >=
          document.documentElement.scrollHeight - 50
        ) {
          current = "footer";
        }
        navLinks.forEach((link) => {
          link.classList.toggle(
            "active",
            link.getAttribute("href") === `#${current}`,
          );
        });
        ticking = false;
      });
      ticking = true;
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Scroll reveal animations
  const revealElements = document.querySelectorAll(
    ".reveal,.reveal-left,.reveal-right",
  );
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("show");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -55px 0px" },
  );
  revealElements.forEach((el) => revealObserver.observe(el));

  const animatedSections = document.querySelectorAll("main > section, footer");
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("section-visible");
          sectionObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.06, rootMargin: "0px 0px -45px 0px" },
  );

  animatedSections.forEach((section, index) => {
    section.classList.add("section-scroll-reveal");
    if (index === 0) {
      requestAnimationFrame(() => section.classList.add("section-visible"));
    } else {
      sectionObserver.observe(section);
    }
  });
});
