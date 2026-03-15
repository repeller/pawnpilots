/* Shared site script — scroll reveal + parallax + regional pricing */
(function () {

  /* ── Preload regional pricing (runs on every page) ── */
  (function preloadPricing() {
    // Bust cache when prices change (bump version to force refresh)
    var priceVer = "2";
    if (sessionStorage.getItem("pp_prices_v") !== priceVer) {
      sessionStorage.removeItem("pp_prices");
      sessionStorage.setItem("pp_prices_v", priceVer);
    }
    if (sessionStorage.getItem("pp_prices")) return;

    var controller = new AbortController();
    var timeoutId = setTimeout(function () { controller.abort(); }, 2000);

    fetch("https://ip-api.com/json/", { signal: controller.signal })
      .then(function (res) {
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error("Network issues");
        return res.json();
      })
      .then(function (data) {
        var moPrice = "$99";
        var qtPrice = "$249";
        if (data.status === "success" && data.countryCode) {
          var country = data.countryCode;
          if (country === "US") { moPrice = "$99"; qtPrice = "$249"; }
          else if (country === "GB" || country === "UK") { moPrice = "£75"; qtPrice = "£189"; }
          else if (country === "AU") { moPrice = "A$109"; qtPrice = "A$279"; }
          else if (country === "NZ") { moPrice = "NZ$119"; qtPrice = "NZ$299"; }
        }
        sessionStorage.setItem("pp_prices", JSON.stringify({ mo: moPrice, qt: qtPrice }));
        applyPricingIfOnPage(moPrice, qtPrice);
      })
      .catch(function (err) {
        clearTimeout(timeoutId);
        console.error("Could not ping location API. Falling back to default USD pricing.", err);
        var moPrice = "$99";
        var qtPrice = "$249";
        sessionStorage.setItem("pp_prices", JSON.stringify({ mo: moPrice, qt: qtPrice }));
        applyPricingIfOnPage(moPrice, qtPrice);
      });
  })();

  /* Apply prices to the pricing page if we're on it */
  function applyPricingIfOnPage(moPrice, qtPrice) {
    var grid = document.getElementById("pricing-grid");
    var loader = document.getElementById("pricing-loader");
    var elMo = document.getElementById("price-mo");
    var elQt = document.getElementById("price-qt");
    if (!grid) return;
    if (elMo) elMo.innerText = moPrice;
    if (elQt) elQt.innerText = qtPrice;
    if (loader) loader.style.display = "none";
    grid.style.opacity = "1";
  }

  /* If on pricing page, apply cached prices immediately (no delay) */
  (function initPricingPage() {
    var grid = document.getElementById("pricing-grid");
    if (!grid) return;

    var cached = sessionStorage.getItem("pp_prices");
    if (cached) {
      var prices = JSON.parse(cached);
      applyPricingIfOnPage(prices.mo, prices.qt);
    } else {
      // No cache yet — show US defaults immediately (fetch will update if different)
      applyPricingIfOnPage("$99", "$249");
    }
  })();

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
})();
