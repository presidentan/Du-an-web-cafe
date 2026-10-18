
(function () {
  var user = null;
  try {
    user = JSON.parse(localStorage.getItem('currentUser') || 'null');
  } catch (e) {}

  var box = document.querySelector('[data-auth]');
  if (!box || !user || !user.username) return;

  box.textContent = '';

  var hi = document.createElement('span');
  hi.className = 'text-xs font-bold text-black-90';
  hi.textContent = 'Xin chào, ' + user.username;

  var out = document.createElement('a');
  out.className = 'button positive black text-xs';
  out.href = '#';
  out.textContent = 'Đăng xuất';
  out.addEventListener('click', function (e) {
    e.preventDefault();
    localStorage.removeItem('currentUser');
    window.location.reload();
  });

  box.appendChild(hi);
  box.appendChild(out);
})();