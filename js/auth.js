
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

    // ── Nút Admin Panel (chỉ hiện với admin) ────────────────────────────────
    if (user.role === 'admin') {
        var adminLink = document.createElement('a');
        adminLink.className = 'button black text-xs';
        adminLink.href = 'dashboard.html';
        adminLink.textContent = '⚙ Admin Panel';
        box.appendChild(hi);
        box.appendChild(adminLink);
    } else {
        box.appendChild(hi);
    }

    var out = document.createElement('a');
    out.className = 'button positive black text-xs';
    out.href = '#';
    out.textContent = 'Đăng xuất';
    out.addEventListener('click', function (e) {
        e.preventDefault();
        localStorage.removeItem('currentUser');
        window.location.reload();
    });

    box.appendChild(out);
})();
