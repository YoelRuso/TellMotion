// Small UI helpers: scroll reveal, sticky nav state, click-to-copy buttons.
const reveal = new IntersectionObserver(
  entries => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        reveal.unobserve(e.target);
      }
    }
  },
  {threshold: 0.12, rootMargin: '0px 0px -40px 0px'},
);
document.querySelectorAll('.reveal').forEach(el => reveal.observe(el));

const nav = document.getElementById('nav');
const onScroll = () => nav?.classList.toggle('scrolled', window.scrollY > 16);
onScroll();
addEventListener('scroll', onScroll, {passive: true});

document.querySelectorAll<HTMLElement>('[data-copy]').forEach(el => {
  el.addEventListener('click', () => {
    navigator.clipboard.writeText(el.dataset.copy || '').then(() => {
      const isBtn = el.classList.contains('copy');
      const old = el.innerHTML;
      el.classList.add('copied');
      if (isBtn) el.textContent = 'Copied ✓';
      else el.insertAdjacentHTML('afterbegin', '<span style="color:#4ade80">✓ copied</span>');
      setTimeout(() => {
        el.classList.remove('copied');
        el.innerHTML = old;
      }, 1500);
    });
  });
});
