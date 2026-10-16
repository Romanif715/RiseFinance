// ============================================================
// RiseFinance — головний скрипт для GitHub Pages + Supabase
// ============================================================

import {
  loadNews as fetchNews,
  submitConsultation,
  subscribe,
} from './supabase.js';

(() => {
  // ===== Хелпери =====
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];

  const escapeHtml = (value) =>
    String(value ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[c]));

  const toast = (message, error = false) => {
    const el = $('#toastNotification');
    if (!el) return;
    el.innerHTML = `<span>${escapeHtml(message)}</span>`;
    el.style.borderColor = error ? '#fb7185' : '#9b79f566';
    el.classList.remove('hidden');
    el.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => {
      el.classList.remove('show');
      el.classList.add('hidden');
    }, 3600);
  };

  // ===== Навігація між секціями =====
  function showSection(name, updateHash = true) {
    const valid = ['home', 'solutions', 'resources', 'company'].includes(name)
      ? name
      : 'home';

    $$('.page-section').forEach((section) => {
      const active = section.id === `${valid}-section`;
      section.classList.toggle('active-section', active);
      section.style.display = active ? '' : 'none';
    });

    $$('.nav-link, .mobile-nav-link').forEach((link) => {
      link.classList.toggle('active', link.dataset.section === valid);
    });

    $('#mobileNav')?.classList.remove('open');
    $('#mobileNavOverlay')?.classList.remove('open');

    if (updateHash && location.hash !== `#${valid}`) {
      history.replaceState(null, '', `#${valid}`);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  $$('.nav-link, .mobile-nav-link').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target =
        link.dataset.section || link.getAttribute('href')?.slice(1);
      showSection(target);
    });
  });

  // ===== Мобільне меню =====
  const mobile = $('#mobileNav');
  const overlay = $('#mobileNavOverlay');

  $('#mobileMenuBtn')?.addEventListener('click', () => {
    mobile?.classList.add('open');
    overlay?.classList.add('open');
  });

  const closeMobileNav = () => {
    mobile?.classList.remove('open');
    overlay?.classList.remove('open');
  };

  $('#closeMobileNav')?.addEventListener('click', closeMobileNav);
  overlay?.addEventListener('click', closeMobileNav);

  // ===== Модальне вікно консультації =====
  const modal = $('#consultationModal');

  const openModal = () => {
    modal?.classList.add('open');
    modal?.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    modal?.classList.remove('open');
    modal?.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  $('#consultationBtn')?.addEventListener('click', openModal);
  $('#closeConsultation')?.addEventListener('click', closeModal);

  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // ===== Форма консультації → Supabase =====
  $('#consultationForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const button = $('button[type="submit"]', form);
    button.disabled = true;
    try {
      await submitConsultation({
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        message: form.message.value.trim(),
      });
      form.reset();
      closeModal();
      toast('Дякуємо! Ваш запит на консультацію надіслано.');
    } catch (err) {
      toast(err.message || 'Не вдалося надіслати запит.', true);
    } finally {
      button.disabled = false;
    }
  });

  // ===== Підписка на новини → Supabase =====
  $('#newsletterForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const button = $('button[type="submit"]', form);
    button.disabled = true;
    try {
      await subscribe(form.email.value.trim());
      form.reset();
      toast('Ви успішно підписалися на новини!');
    } catch (err) {
      toast(err.message || 'Помилка підписки.', true);
    } finally {
      button.disabled = false;
    }
  });

  // ===== Завантаження новин із Supabase =====
  async function loadNews() {
    const grid = $('#newsGrid');
    if (!grid) return;

    try {
      const news = await fetchNews();

      if (!news || !news.length) {
        grid.innerHTML =
          '<p class="news-loading">Новини скоро з’являться.</p>';
        return;
      }

      grid.innerHTML = news
        .map((n) => {
          const date = n.created_at
            ? new Date(n.created_at).toLocaleDateString('uk-UA', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })
            : '';
          const excerpt =
            (n.content || '').length > 180
              ? (n.content || '').slice(0, 180) + '…'
              : n.content || '';

          return `
            <article class="news-card">
              ${
                n.image
                  ? `<img class="news-image" src="${escapeHtml(
                      n.image
                    )}" alt="" loading="lazy" onerror="this.style.display='none'">`
                  : ''
              }
              <div class="news-copy">
                <span class="news-date">${escapeHtml(date)}</span>
                <h3>${escapeHtml(n.title)}</h3>
                <p>${escapeHtml(excerpt)}</p>
              </div>
            </article>
          `;
        })
        .join('');
    } catch (err) {
      console.error('News load error:', err);
      grid.innerHTML =
        '<p class="news-loading">Не вдалося завантажити новини. Перевірте налаштування Supabase.</p>';
    }
  }

  // ===== Графіки Chart.js (з graceful degradation) =====
  if (window.Chart) {
    const growth = $('#growthChart');
    if (growth) {
      new Chart(growth, {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
          datasets: [
            {
              label: 'Growth',
              data: [18, 24, 22, 39, 34, 56, 63, 82],
              borderColor: '#a78bfa',
              backgroundColor: 'rgba(167,139,250,.12)',
              fill: true,
              tension: 0.42,
              pointRadius: 2,
              pointBackgroundColor: '#c4b5fd',
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: '#77738e', font: { size: 10 } },
            },
            y: {
              grid: { color: 'rgba(255,255,255,.06)' },
              ticks: { color: '#77738e', font: { size: 10 } },
              border: { display: false },
            },
          },
        },
      });
    }

    const pie = $('#pieChartCanvas');
    if (pie) {
      new Chart(pie, {
        type: 'doughnut',
        data: {
          labels: ['Payments', 'Analytics', 'Security', 'Other'],
          datasets: [
            {
              data: [34, 25, 23, 18],
              backgroundColor: ['#8b5cf6', '#a78bfa', '#c026d3', '#4f46e5'],
              borderWidth: 0,
              hoverOffset: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '70%',
          plugins: { legend: { display: false } },
        },
      });
    }

    $('#refreshPieBtn')?.addEventListener('click', () => {
      const c = Chart.getChart('pieChartCanvas');
      if (c) {
        c.data.datasets[0].data = c.data.datasets[0].data.map(() =>
          Math.floor(10 + Math.random() * 35)
        );
        c.update();
      }
    });
  }

  // ===== Ініціалізація =====
  const initial = location.hash.replace('#', '');
  showSection(initial || 'home', false);
  loadNews();

  // Слухаємо зміну хешу (напр. перехід за прямим посиланням #resources)
  window.addEventListener('hashchange', () => {
    const name = location.hash.replace('#', '') || 'home';
    showSection(name, false);
  });
})();