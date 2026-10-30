document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());

// The e-mail address is not written in the HTML, so simple address harvesters don't find it.
// It is put together here; without JavaScript the page shows "contact (at) brage.org".
document.querySelectorAll('a.email').forEach(a => {
  const addr = a.dataset.u + '@' + a.dataset.d;
  a.href = 'mailto:' + addr;
  a.textContent = addr;
});
