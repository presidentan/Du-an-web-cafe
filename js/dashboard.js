document.addEventListener("DOMContentLoaded", () => {
    const ORDER_KEY = "orders";
    const USER_KEY = "users";
    const FEEDBACK_KEY = "feedback";
    const STATUSES = ["Chờ xử lý", "Đang chuẩn bị", "Hoàn tất", "Đã hủy"];
    const ordersBody = document.getElementById("orders-body");
    const customersBody = document.getElementById("customers-body");
    const feedbackBody = document.getElementById("feedback-body");
    const message = document.getElementById("dashboard-message");
    let orders = readList(ORDER_KEY);
    const users = readList(USER_KEY);
    const feedback = readList(FEEDBACK_KEY);

    function readList(key) {
        try {
            const value = JSON.parse(localStorage.getItem(key) || "[]");
            if (!Array.isArray(value)) throw new Error("Dữ liệu phải là danh sách.");
            return value;
        } catch (error) {
            message.hidden = false;
            const label = key === ORDER_KEY ? "đơn hàng" : key === USER_KEY ? "khách hàng" : "feedback";
            message.textContent = "Không đọc được dữ liệu " + label +
                " trong trình duyệt. Hãy kiểm tra dữ liệu lưu trữ rồi tải lại trang.";
            console.error("Không thể đọc localStorage key " + key, error);
            return [];
        }
    }

    function money(value) {
        return (Number(value) || 0).toLocaleString("vi-VN") + "₫";
    }

    function dateValue(value) {
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    function formatDate(value) {
        const date = dateValue(value);
        return date ? date.toLocaleString("vi-VN") : "—";
    }

    function cell(row, value) {
        const td = document.createElement("td");
        td.textContent = value == null || value === "" ? "—" : String(value);
        row.appendChild(td);
        return td;
    }

    function emptyRow(body, columns, text) {
        const row = document.createElement("tr");
        const td = cell(row, text);
        td.colSpan = columns;
        td.className = "empty-cell";
        body.appendChild(row);
    }

    function renderOrders() {
        ordersBody.textContent = "";
        if (orders.length === 0) {
            emptyRow(ordersBody, 6, "Chưa có đơn hàng nào. Sau khi khách gửi đơn ở trang Đặt hàng, đơn sẽ hiển thị tại đây.");
            return;
        }

        orders.slice().sort((a, b) => (dateValue(b.createdAt)?.getTime() || 0) - (dateValue(a.createdAt)?.getTime() || 0))
            .forEach(order => {
                const row = document.createElement("tr");
                cell(row, order.code ? "#" + order.code : "—");
                const customer = document.createElement("td");
                const name = document.createElement("strong");
                name.textContent = order.name || "Khách vãng lai";
                customer.appendChild(name);
                const contact = document.createElement("small");
                contact.textContent = [order.phone, order.customerEmail].filter(Boolean).join(" · ");
                customer.appendChild(contact);
                row.appendChild(customer);
                cell(row, formatDate(order.createdAt));
                const items = Array.isArray(order.items)
                    ? order.items.map(item => (item.name || "Món") + " ×" + (Number(item.qty) || 0)).join(", ")
                    : "—";
                cell(row, items);
                cell(row, money(order.total));

                const statusCell = document.createElement("td");
                const status = document.createElement("select");
                status.className = "order-status";
                status.setAttribute("aria-label", "Trạng thái đơn " + (order.code || ""));
                const currentStatus = STATUSES.includes(order.status) ? order.status : STATUSES[0];
                STATUSES.forEach(label => {
                    const option = document.createElement("option");
                    option.value = label;
                    option.textContent = label;
                    option.selected = label === currentStatus;
                    status.appendChild(option);
                });
                status.addEventListener("change", () => {
                    const index = orders.findIndex(item => item.code === order.code);
                    if (index === -1) return;
                    orders[index].status = status.value;
                    try {
                        localStorage.setItem(ORDER_KEY, JSON.stringify(orders));
                        renderSummary();
                    } catch (error) {
                        message.hidden = false;
                        message.textContent = "Không lưu được trạng thái đơn. Vui lòng thử lại.";
                        console.error("Không thể lưu trạng thái đơn", error);
                    }
                });
                statusCell.appendChild(status);
                row.appendChild(statusCell);
                ordersBody.appendChild(row);
            });
    }

    function renderCustomers() {
        const customers = new Map();
        users.forEach(user => {
            if (!user || !user.email) return;
            const email = String(user.email).trim().toLocaleLowerCase("vi");
            customers.set("email:" + email, {
                name: user.username || user.name || "Khách hàng",
                email: user.email,
                phone: user.phone || "",
                orders: []
            });
        });

        orders.forEach(order => {
            const email = String(order.customerEmail || "").trim().toLocaleLowerCase("vi");
            const phone = String(order.phone || "").trim();
            const key = email ? "email:" + email : "phone:" + phone;
            if (!key || key === "phone:") return;
            let customer = customers.get(key);
            if (!customer) {
                customer = { name: order.name || "Khách vãng lai", email: order.customerEmail || "", phone, orders: [] };
                customers.set(key, customer);
            }
            if (order.name) customer.name = order.name;
            if (phone) customer.phone = phone;
            customer.orders.push(order);
        });

        customersBody.textContent = "";
        if (customers.size === 0) {
            emptyRow(customersBody, 6, "Chưa có tài khoản đăng ký hoặc khách đặt hàng nào.");
            return;
        }

        Array.from(customers.values())
            .sort((a, b) => b.orders.length - a.orders.length || a.name.localeCompare(b.name, "vi"))
            .forEach(customer => {
                const row = document.createElement("tr");
                cell(row, customer.name);
                cell(row, customer.email);
                cell(row, customer.phone);
                cell(row, customer.orders.length);
                cell(row, money(customer.orders.reduce((sum, order) => sum + (Number(order.total) || 0), 0)));
                const latestOrder = customer.orders
                    .map(order => order.createdAt)
                    .filter(Boolean)
                    .sort((a, b) => (dateValue(b)?.getTime() || 0) - (dateValue(a)?.getTime() || 0))[0];
                cell(row, latestOrder ? formatDate(latestOrder) : "Chưa đặt hàng");
                customersBody.appendChild(row);
            });
    }

    function renderFeedback() {
        if (!feedbackBody) return;
        feedbackBody.textContent = "";
        if (feedback.length === 0) {
            emptyRow(feedbackBody, 5, "Chưa có phản hồi nào. Nội dung khách gửi qua trang Contact sẽ hiển thị tại đây.");
            return;
        }

        feedback.slice().sort((a, b) =>
            (dateValue(b.createdAt)?.getTime() || 0) - (dateValue(a.createdAt)?.getTime() || 0)
        ).forEach(item => {
            const row = document.createElement("tr");
            cell(row, item.name);
            cell(row, item.email);
            cell(row, item.phone);
            cell(row, item.message);
            cell(row, formatDate(item.createdAt));
            feedbackBody.appendChild(row);
        });
    }

    function renderSummary() {
        const today = new Date();
        const isToday = order => {
            const date = dateValue(order.createdAt);
            return date && date.getFullYear() === today.getFullYear() &&
                date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
        };
        const todaysOrders = orders.filter(isToday);
        document.getElementById("orders-today").textContent = String(todaysOrders.length);
        document.getElementById("revenue-today").textContent = money(todaysOrders
            .filter(order => order.status !== "Đã hủy")
            .reduce((sum, order) => sum + (Number(order.total) || 0), 0));
        document.getElementById("orders-pending").textContent = String(orders
            .filter(order => !order.status || order.status === "Chờ xử lý").length);
        const cancelledOrders = document.getElementById("orders-cancelled");
        if (cancelledOrders) {
            cancelledOrders.textContent = String(orders
                .filter(order => order.status === "Đã hủy").length);
        }
    }

    function addAutumnDecoration() {
        const svgNamespace = "http://www.w3.org/2000/svg";
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        const addLeaf = () => {
            const leaf = document.createElementNS(svgNamespace, "svg");
            leaf.classList.add("falling-leaf");
            leaf.setAttribute("viewBox", "0 0 100 100");
            leaf.setAttribute("aria-hidden", "true");
            leaf.style.left = `${Math.random() * 100}vw`;
            leaf.style.setProperty("--leaf-drift", `${Math.round(Math.random() * 180 - 90)}px`);
            leaf.style.setProperty("--fall-duration", `${(4 + Math.random() * 3).toFixed(1)}s`);

            const shape = document.createElementNS(svgNamespace, "path");
            shape.setAttribute("d", "M50 96 42 73 22 84 27 64 5 60 20 50 4 33 27 36 24 13 42 28 50 3 58 28 76 13 73 36 96 33 80 50 95 60 73 64 78 84 58 73Z");
            shape.setAttribute("fill", ["#bf5636", "#d78a37", "#c95d32", "#d5a13b"][Math.floor(Math.random() * 4)]);
            shape.setAttribute("stroke", "#87432f");
            shape.setAttribute("stroke-width", "2");
            leaf.appendChild(shape);

            const veins = document.createElementNS(svgNamespace, "path");
            veins.setAttribute("d", "M50 85 50 31 M50 63 27 40 M50 63 73 40 M50 75 30 67 M50 75 70 67");
            veins.setAttribute("fill", "none");
            veins.setAttribute("stroke", "#87432f");
            veins.setAttribute("stroke-width", "2.5");
            veins.setAttribute("stroke-linecap", "round");
            veins.setAttribute("opacity", "0.65");
            leaf.appendChild(veins);
            leaf.addEventListener("animationend", () => leaf.remove(), { once: true });
            document.body.appendChild(leaf);
        };

        let leafTimer = window.setInterval(addLeaf, 850);
        document.addEventListener("visibilitychange", () => {
            if (document.hidden) {
                window.clearInterval(leafTimer);
                leafTimer = null;
            } else if (leafTimer === null) {
                addLeaf();
                leafTimer = window.setInterval(addLeaf, 850);
            }
        });
        addLeaf();
    }

    document.querySelectorAll(".sidebar-menu a").forEach(item => {
        item.addEventListener("click", () => {
            document.querySelectorAll(".sidebar-menu a").forEach(link => link.classList.remove("active"));
            item.classList.add("active");
        });
    });

    renderOrders();
    renderCustomers();
    renderFeedback();
    renderSummary();
    addAutumnDecoration();
});