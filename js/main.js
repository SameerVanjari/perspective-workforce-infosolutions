/* ==========================================================================
   Perspectives Workforce — interactions
   ========================================================================== */
(function () {
  "use strict";

  /* ------------------------------------------------------------------------
     Config
     ------------------------------------------------------------------------ */
  // Set to an embed URL (e.g. "https://www.youtube.com/embed/VIDEO_ID")
  // when the real company video is available.
  var VIDEO_SRC = "";

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
      closeVideo();
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
     Video modal
     ------------------------------------------------------------------------ */
  var playBtn = document.getElementById("playBtn");
  var videoModal = document.getElementById("videoModal");
  var videoFrame = videoModal.querySelector("iframe");

  var placeholderHtml =
    "<style>" +
    "body{margin:0;height:100vh;display:flex;align-items:center;justify-content:center;" +
    "background:radial-gradient(120% 120% at 50% 0%, #182741 0%, #0f172a 60%);" +
    "font-family:'Plus Jakarta Sans',sans-serif;color:#fff;text-align:center;}" +
    ".b{padding:2rem;} .l{font-size:1.6rem;font-weight:800;margin-bottom:.6rem;}" +
    ".s{font-size:1rem;opacity:.7;max-width:26rem;margin:0 auto;}" +
    "</style>" +
    '<div class="b"><div class="l">Perspectives Workforce</div>' +
    '<div class="s">Our company film is coming soon. Reach out to see how we build stronger teams together.</div></div>';

  function openVideo() {
    if (VIDEO_SRC) {
      videoFrame.src = VIDEO_SRC;
    } else {
      videoFrame.srcdoc = placeholderHtml;
    }
    videoModal.hidden = false;
    document.body.classList.add("no-scroll");
  }

  function closeVideo() {
    videoModal.hidden = true;
    videoFrame.src = "";
    videoFrame.srcdoc = "";
    document.body.classList.remove("no-scroll");
  }

  if (playBtn) {
    playBtn.addEventListener("click", openVideo);
  }

  videoModal.querySelectorAll("[data-close]").forEach(function (el) {
    el.addEventListener("click", closeVideo);
  });

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
})();
