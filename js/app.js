// Weather widget: uses browser Geolocation + Open-Meteo current_weather (no API key)
(function () {
  const elTemp = document.getElementById('weather-temp');
  const elDesc = document.getElementById('weather-desc');
  const elEmoji = document.getElementById('weather-emoji');
  const elMeta = document.getElementById('weather-meta');

  function codeToEmoji(code) {
    // Map Open-Meteo weathercode to emoji and description
    if (code === 0) return ['☀️', 'Clear'];
    if (code === 1 || code === 2 || code === 3) return ['⛅️', 'Partly cloudy'];
    if (code === 45 || code === 48) return ['🌫️', 'Foggy'];
    if ([51,53,55,56,57,61,63,65,66,67,80,81,82].includes(code)) return ['🌧️', 'Rainy'];
    if ([71,73,75,77,85,86].includes(code)) return ['❄️', 'Snow'];
    if ([95,96,99].includes(code)) return ['⛈️', 'Storm'];
    return ['🌤️', 'Unknown'];
  }

  function setError(msg) {
    elTemp.textContent = '—°F';
    elDesc.textContent = msg;
    elEmoji.textContent = '⚠️';
    elMeta.textContent = '';
  }

  async function fetchWeather(lat, lon) {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&temperature_unit=fahrenheit&windspeed_unit=mph`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Weather fetch failed');
      const data = await res.json();
      if (!data.current_weather) throw new Error('No current weather');
      const cw = data.current_weather;
      const temp = Math.round(cw.temperature);
      const code = cw.weathercode;
      const [emoji, label] = codeToEmoji(code);
      elTemp.textContent = `${temp}°F`;
      elDesc.textContent = label + ' • Wind ' + Math.round(cw.windspeed) + ' mph';
      elEmoji.textContent = emoji;
      elMeta.textContent = `Lat ${lat.toFixed(2)}, Lon ${lon.toFixed(2)}`;

      // optional: try reverse geocode for nicer location label (best-effort)
      try {
        const geo = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
        if (geo.ok) {
          const j = await geo.json();
          if (j.address) {
            const name = j.address.city || j.address.town || j.address.village || j.address.county || j.address.state || j.address.country;
            if (name) elMeta.textContent = name;
          }
        }
      } catch (e) {
        // ignore reverse geocode errors
      }
    } catch (err) {
      setError('Unable to load weather');
      console.error(err);
    }
  }

  function init() {
    if (!navigator.geolocation) {
      setError('Geolocation not available');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        fetchWeather(lat, lon);
      },
      (err) => {
        console.warn('Geolocation error', err);
        setError('Enable location to see your weather.');
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }

  // Initialize after small delay so page paint isn't blocked
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else init();
})();

// Navigation smooth-scroll, active link highlighting, and simple parallax
(function () {
  function scrollToHash(hash) {
    const el = document.querySelector(hash);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // handle nav clicks
  document.addEventListener('DOMContentLoaded', function () {
    const links = document.querySelectorAll('.nav-links a');
    links.forEach(a => {
      a.addEventListener('click', function (e) {
        const href = a.getAttribute('href');
        if (href && href.startsWith('#')) {
          e.preventDefault();
          scrollToHash(href);
          // update active immediately
          links.forEach(x => x.classList.remove('active'));
          a.classList.add('active');
        }
      });
    });

    // active link on scroll
    const sections = Array.from(document.querySelectorAll('main [id]')).filter(s => ['home','about','work','contact'].includes(s.id));
    const navMap = {};
    links.forEach(a => navMap[a.getAttribute('href')] = a);

    const io = new IntersectionObserver((entries) => {
      entries.forEach(ent => {
        if (ent.isIntersecting) {
          const id = '#' + ent.target.id;
          Object.values(navMap).forEach(n => n.classList.remove('active'));
          if (navMap[id]) navMap[id].classList.add('active');
        }
      });
    }, { threshold: 0.4 });
    sections.forEach(s => io.observe(s));

    // simple parallax for elements with data-parallax
    const parallaxEls = document.querySelectorAll('[data-parallax]');
    if (parallaxEls.length) {
      let ticking = false;
      function onScroll() {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            const sc = window.scrollY;
            parallaxEls.forEach(el => {
              const speed = parseFloat(el.getAttribute('data-parallax')) || 0.2;
              el.style.transform = `translateY(${Math.round(sc * speed)}px)`;
            });
            ticking = false;
          });
          ticking = true;
        }
      }
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }
  });
})();
