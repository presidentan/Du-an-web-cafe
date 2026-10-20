document.addEventListener("DOMContentLoaded", () => {
    const sidebar = document.getElementById("admin-sidebar");
    const toggle = document.querySelector(".sidebar-toggle");
    if (!sidebar || !toggle) return;

    toggle.addEventListener("click", () => {
        const isOpen = sidebar.classList.toggle("sidebar-open");
        sidebar.classList.toggle("sidebar-closed", !isOpen);
        toggle.setAttribute("aria-expanded", String(isOpen));
        toggle.setAttribute("aria-label", isOpen ? "Đóng thanh điều hướng" : "Mở thanh điều hướng");
    });

    sidebar.addEventListener("mouseenter", () => {
        sidebar.classList.remove("sidebar-closed");
    });

    sidebar.addEventListener("focusin", () => {
        sidebar.classList.remove("sidebar-closed");
    });

    sidebar.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            sidebar.classList.remove("sidebar-open");
            sidebar.classList.add("sidebar-closed");
            toggle.setAttribute("aria-expanded", "false");
            toggle.setAttribute("aria-label", "Mở thanh điều hướng");
            toggle.focus();
        });
    });
});
