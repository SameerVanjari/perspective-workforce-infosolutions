/* ==========================================================================
   Perspectives Workforce — interactions
   ========================================================================== */
(function () {
  "use strict";

  /* ------------------------------------------------------------------------
     Config
     ------------------------------------------------------------------------ */
  // Google Apps Script Web App URL for contact-form submissions.
  // Injected by js/config.js (generated from .env — see scripts/generate-config.js).
  // Empty → falls back to opening the visitor's email client instead.
  var APP_CONFIG = (typeof window !== "undefined" && window.APP_CONFIG) || {};
  var APPS_SCRIPT_URL = APP_CONFIG.APPS_SCRIPT_URL || "";

  var header = document.getElementById("siteHeader");
  var menuToggle = document.getElementById("menuToggle");
  var mobileMenu = document.getElementById("mobileMenu");
  var backToTop = document.getElementById("backToTop");

  /* ------------------------------------------------------------------------
     Sticky header state
     ------------------------------------------------------------------------ */
  function onScroll() {
    var scrolled = window.scrollY > 24;
    header.classList.toggle("is-scrolled", scrolled);
    backToTop.classList.toggle("is-visible", window.scrollY > 600);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ------------------------------------------------------------------------
     Mobile menu
     ------------------------------------------------------------------------ */
  function setMenu(open) {
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menuToggle.innerHTML =
      '<span class="material-symbols-outlined">' +
      (open ? "close" : "menu") +
      "</span>";
    mobileMenu.classList.toggle("is-open", open);
    mobileMenu.setAttribute("aria-hidden", String(!open));
    document.body.classList.toggle("menu-open", open);
  }

  menuToggle.addEventListener("click", function () {
    setMenu(!mobileMenu.classList.contains("is-open"));
  });

  mobileMenu.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      setMenu(false);
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      setMenu(false);
    }
  });

  /* ------------------------------------------------------------------------
     Reveal on scroll
     ------------------------------------------------------------------------ */
  var revealEls = document.querySelectorAll(".reveal");

  // Subtle stagger for siblings inside grids.
  revealEls.forEach(function (el, i) {
    var siblings = el.parentElement
      ? el.parentElement.querySelectorAll(".reveal")
      : [];
    if (siblings.length > 1) {
      var idx = Array.prototype.indexOf.call(siblings, el);
      el.style.transitionDelay = idx * 80 + "ms";
    }
  });

  if ("IntersectionObserver" in window) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* ------------------------------------------------------------------------
     Testimonial carousel
     ------------------------------------------------------------------------ */
  var track = document.getElementById("testimonialTrack");
  var dots = document.querySelectorAll(".dot");
  var current = 0;
  var total = dots.length;
  var timer = null;

  function goTo(index) {
    current = (index + total) % total;
    track.style.transform = "translateX(-" + current * 100 + "%)";
    dots.forEach(function (d, i) {
      d.classList.toggle("is-active", i === current);
    });
  }

  dots.forEach(function (dot) {
    dot.addEventListener("click", function () {
      goTo(parseInt(dot.getAttribute("data-index"), 10));
      restartAutoplay();
    });
  });

  function restartAutoplay() {
    clearInterval(timer);
    timer = setInterval(function () {
      goTo(current + 1);
    }, 6000);
  }

  var testimonialsSection = document.querySelector(".testimonials");
  if (track && total > 1) {
    restartAutoplay();
    testimonialsSection.addEventListener("mouseenter", function () {
      clearInterval(timer);
    });
    testimonialsSection.addEventListener("mouseleave", restartAutoplay);
  }

  /* ------------------------------------------------------------------------
     Active nav link (scrollspy)
     ------------------------------------------------------------------------ */
  var navLinks = document.querySelectorAll(".nav__link");
  var sections = [];
  navLinks.forEach(function (link) {
    var id = link.getAttribute("href");
    if (id && id.startsWith("#") && id.length > 1) {
      var sec = document.querySelector(id);
      if (sec) sections.push({ link: link, section: sec });
    }
  });

  if ("IntersectionObserver" in window && sections.length) {
    var spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            navLinks.forEach(function (l) {
              l.classList.remove("is-active");
            });
            var active = sections.find(function (s) {
              return s.section === entry.target;
            });
            if (active) active.link.classList.add("is-active");
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach(function (s) {
      spy.observe(s.section);
    });
  }

  /* ------------------------------------------------------------------------
     Contact form — validation & Google Sheets submission
     ------------------------------------------------------------------------ */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var URL_RE = /(https?:\/\/|www\.|\.(com|net|org|info|biz|in|co|io|xyz)\b)/i;
  var KEY_MASH = /(qwerty|asdfgh|zxcvbn|poiuyt|lkjhgf|mnbvcx|123456|abcdef|q1w2e3|1qaz|2wsx)/i;

  function looksGibberish(value) {
    var t = (value || "").replace(/[^a-z]/gi, "").toLowerCase();
    if (t.length < 4) return false;
    if (/(.)\1{3,}/.test(t)) return true; // "aaaa"
    if (KEY_MASH.test(t)) return true; // keyboard mash
    if (/[^aeiou]{6,}/.test(t)) return true; // 6 consonants in a row
    if (t.length >= 8 && new Set(t).size <= 3) return true; // too few distinct letters
    return false;
  }

  function onlyDigits(value) {
    return (value || "").replace(/\D/g, "");
  }

  function status(form, msg, kind) {
    var el = form.querySelector(".form__status");
    if (!el) return;
    el.textContent = msg || "";
    el.className = "form__status" + (kind ? " is-" + kind : "");
  }

  function markInvalid(input, invalid) {
    if (input) input.classList.toggle("is-invalid", !!invalid);
  }

  function validate(form) {
    var errors = [];
    var f = form.elements;

    // Honeypot (hidden field — bots fill it)
    if (f.website && f.website.value.trim() !== "") {
      return { ok: false, silent: true };
    }

    // Name
    var name = (f.name && f.name.value || "").trim();
    if (name.length < 2) {
      errors.push({ field: f.name, msg: "Please enter your name." });
    } else if (!/^[A-Za-z][A-Za-z .'-]{0,80}$/.test(name) || looksGibberish(name)) {
      errors.push({ field: f.name, msg: "That name doesn't look right — please check it." });
    }

    // Email
    var email = (f.email && f.email.value || "").trim();
    if (!EMAIL_RE.test(email)) {
      errors.push({ field: f.email, msg: "Please enter a valid email address." });
    }

    // Phone (optional but must look real)
    var phone = f.phone && f.phone.value.trim();
    if (phone) {
      var digits = onlyDigits(phone);
      if (digits.length < 7 || digits.length > 15 || /^(.)\1{6,}$/.test(digits)) {
        errors.push({ field: f.phone, msg: "Please enter a valid phone number." });
      }
    }

    // Quote form: message
    if (f.message) {
      var msg = f.message.value.trim();
      if (msg.length < 20) {
        errors.push({ field: f.message, msg: "Please add a little more detail (at least 20 characters)." });
      } else if (URL_RE.test(msg) || looksGibberish(msg)) {
        errors.push({ field: f.message, msg: "Please remove links and check your message." });
      }
    }

    // Too-fast submissions are usually bots
    var t0 = form._t0 || 0;
    if (Date.now() - t0 < 2000) {
      errors.push({ field: null, msg: "Please take a moment to review before submitting." });
    }

    return { ok: errors.length === 0, errors: errors };
  }

  function collect(form) {
    var data = {};
    form.querySelectorAll("[name]").forEach(function (el) {
      if (!el.name) return;
      if (el.type === "file") {
        data[el.name] = el.files && el.files[0] ? el.files[0].name : "";
      } else {
        data[el.name] = el.value.trim();
      }
    });
    data._form = form.id;
    data._submittedAt = new Date().toISOString();
    return data;
  }

  function submit(form) {
    var data = collect(form);
    var btn = form.querySelector('button[type="submit"]');

    if (APPS_SCRIPT_URL) {
      btn.disabled = true;
      btn.textContent = "Sending…";
      fetch(APPS_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(data)
      })
        .then(function () {
          status(form, "Thank you — your enquiry has been sent. We'll be in touch within 24 hours.", "success");
          form.reset();
        })
        .catch(function () {
          status(form, "Something went wrong. Please email us at hiring@perspectivesworkforceinfosolution.com", "error");
        })
        .finally(function () {
          btn.disabled = false;
          btn.textContent = "Send Enquiry";
        });
    } else {
      // No endpoint configured — open the visitor's email client instead.
      var lines = Object.keys(data)
        .filter(function (k) { return k.charAt(0) !== "_"; })
        .map(function (k) { return k + ": " + data[k]; })
        .join("\n");
      var href =
        "mailto:hiring@perspectivesworkforceinfosolution.com" +
        "?subject=" + encodeURIComponent("Website enquiry") +
        "&body=" + encodeURIComponent(lines);
      window.location.href = href;
      status(form, "Opening your email app…", "success");
      form.reset();
    }
  }

  ["quoteForm"].forEach(function (id) {
    var form = document.getElementById(id);
    if (!form) return;

    // Start the anti-bot timer on first interaction.
    form.addEventListener("focusin", function () {
      if (!form._t0) form._t0 = Date.now();
    });

    // Clear invalid state as the user types.
    form.addEventListener("input", function (e) {
      if (!form._t0) form._t0 = Date.now();
      if (e.target && e.target.classList) e.target.classList.remove("is-invalid");
      status(form, "", null);
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var res = validate(form);
      if (res.silent) {
        // Honeypot triggered — pretend success, don't store anything.
        status(form, "Thank you — your enquiry has been sent.", "success");
        form.reset();
        return;
      }
      if (!res.ok) {
        form.querySelectorAll(".is-invalid").forEach(function (el) {
          el.classList.remove("is-invalid");
        });
        res.errors.forEach(function (err) {
          if (err.field) err.field.classList.add("is-invalid");
        });
        var first = res.errors[0];
        status(form, first.msg, "error");
        if (first.field) first.field.focus();
        return;
      }
      submit(form);
    });
  });
})();
