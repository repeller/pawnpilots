/* Shared site script — scroll reveal + parallax */
(function () {
  /* ── Mobile menu ───────────────────── */
  const menuBtn = document.querySelector(".mobile-menu-btn");
  if (menuBtn) {
    menuBtn.addEventListener("click", function () {
      document.body.classList.toggle("nav-open");
    });
    // Close menu when a link is clicked
    document.querySelectorAll("nav a").forEach(function(link) {
      link.addEventListener("click", function() {
        document.body.classList.remove("nav-open");
      });
    });
  }

  /* ── Scroll reveal ─────────────────── */
  const revealEls = document.querySelectorAll("[data-reveal]");
  if (revealEls.length && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("revealed");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    /* no-motion or no elements: show everything */
    revealEls.forEach(function (el) { el.classList.add("revealed"); });
  }

  /* ── Parallax (desktop only) ───────── */
  if (!(window.innerWidth < 768 || matchMedia("(prefers-reduced-motion: reduce)").matches)) {
    const els = document.querySelectorAll("[data-parallax]");
    if (els.length) {
      var ticking = false;
      function update() {
        var scrollY = window.scrollY;
        var vh = window.innerHeight;
        els.forEach(function (el) {
          var rect = el.getBoundingClientRect();
          var center = rect.top + rect.height / 2;
          if (center < -200 || center > vh + 200) return;
          var offset = (scrollY - (el.offsetTop - vh * 0.5)) * parseFloat(el.dataset.parallax);
          el.style.transform = "translateY(" + offset + "px)";
        });
        ticking = false;
      }
      window.addEventListener("scroll", function () {
        if (!ticking) { ticking = true; requestAnimationFrame(update); }
      }, { passive: true });
      update();
    }
  }

  /* ── Hero float tilt on mouse ────────── */
  var floats = document.querySelectorAll(".hero-float");
  if (floats.length && window.innerWidth >= 768) {
    var heroVisual = document.querySelector(".hero-visual");
    if (heroVisual) {
      heroVisual.addEventListener("mousemove", function (e) {
        floats.forEach(function (el) {
          var rect = el.getBoundingClientRect();
          var cx = rect.left + rect.width / 2;
          var cy = rect.top + rect.height / 2;
          var dx = (e.clientX - cx) / 4;
          var dy = (e.clientY - cy) / 4;
          var maxTilt = 35;
          dx = Math.max(-maxTilt, Math.min(maxTilt, dx));
          dy = Math.max(-maxTilt, Math.min(maxTilt, dy));
          // Shadow shifts opposite to tilt direction
          var sx = Math.round(-dx * 0.4);
          var sy = Math.round(dy * 0.4 + 8);
          el.style.transform = "perspective(300px) rotateY(" + dx + "deg) rotateX(" + (-dy) + "deg)";
          el.style.boxShadow = sx + "px " + sy + "px 24px rgba(50, 28, 14, 0.2)";
        });
      });
      heroVisual.addEventListener("mouseleave", function () {
        floats.forEach(function (el) {
          el.style.transform = "";
          el.style.boxShadow = "";
        });
      });
    }
  }

  /* ── Dynamic Regional Pricing ───────── */
  const grid = document.getElementById("pricing-grid");
  const loader = document.getElementById("pricing-loader");
  if (grid && loader) {
    const elMo = document.getElementById("price-mo");
    const elQt = document.getElementById("price-qt");
    
    // Default prices (Fallback / RoW)
    let moPrice = "$89";
    let qtPrice = "$225";

    // Setup manual timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    // Fetch user location
    fetch("http://ip-api.com/json/", { signal: controller.signal })
      .then(res => {
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error("Network issues");
        return res.json();
      })
      .then(data => {
        if (data.status === "success" && data.countryCode) {
          const country = data.countryCode;
          if (country === "US") { moPrice = "$99"; qtPrice = "$249"; }
           else if (country === "GB" || country === "UK") { moPrice = "£79"; qtPrice = "£199"; }
           else if (country === "AU") { moPrice = "$120"; qtPrice = "$299"; }
           else if (country === "NZ") { moPrice = "$130"; qtPrice = "$325"; }
        }
        applyPrices();
      })
      .catch(err => {
        clearTimeout(timeoutId);
        console.error("Could not ping location API. Falling back to default USD pricing.", err);
        applyPrices();
      });

    function applyPrices() {
      if (elMo) elMo.innerText = moPrice;
      if (elQt) elQt.innerText = qtPrice;
      loader.style.display = "none";
      grid.style.opacity = "1";
    }
  }
})();
