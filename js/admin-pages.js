document.addEventListener("DOMContentLoaded", () => {
    const message = document.getElementById("report-message");

    function showError(text, error) {
        if (message) {
            message.hidden = false;
            message.textContent = text;
        }
        if (error) console.error(text, error);
    }

    function readOrders() {
        try {
            const orders = JSON.parse(localStorage.getItem("orders") || "[]");
            if (!Array.isArray(orders)) throw new Error("Dữ liệu đơn hàng phải là danh sách.");
            return orders;
        } catch (error) {
            showError("Không đọc được dữ liệu đơn hàng. Hãy kiểm tra dữ liệu lưu trữ rồi tải lại trang.", error);
            return [];
        }
    }

    function dateValue(value) {
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    function money(value) {
        return (Number(value) || 0).toLocaleString("vi-VN") + "₫";
    }

    function localDateKey(date) {
        return [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0")
        ].join("-");
    }

    function uncancelledOrders(orders) {
        return orders.filter(order => order && order.status !== "Đã hủy");
    }

    function createPeriods(type) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (type === "daily") {
            return Array.from({ length: 7 }, (_, index) => {
                const date = new Date(today);
                date.setDate(today.getDate() - (6 - index));
                return {
                    key: localDateKey(date),
                    label: date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
                    value: 0
                };
            });
        }

        if (type === "weekly") {
            const currentMonday = new Date(today);
            const dayOffset = (currentMonday.getDay() + 6) % 7;
            currentMonday.setDate(currentMonday.getDate() - dayOffset);
            return Array.from({ length: 8 }, (_, index) => {
                const start = new Date(currentMonday);
                start.setDate(currentMonday.getDate() - (7 * (7 - index)));
                const end = new Date(start);
                end.setDate(start.getDate() + 6);
                return {
                    key: localDateKey(start),
                    endKey: localDateKey(end),
                    label: start.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
                    value: 0
                };
            });
        }

        return Array.from({ length: 12 }, (_, index) => {
            const date = new Date(today.getFullYear(), today.getMonth() - (11 - index), 1);
            return {
                key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
                label: date.toLocaleDateString("vi-VN", { month: "2-digit", year: "2-digit" }),
                value: 0
            };
        });
    }

    function groupRevenue(orders, type) {
        const periods = createPeriods(type);
        const periodByKey = new Map(periods.map(period => [period.key, period]));

        uncancelledOrders(orders).forEach(order => {
            const date = dateValue(order.createdAt);
            if (!date) return;
            let key;
            if (type === "daily") {
                key = localDateKey(date);
            } else if (type === "weekly") {
                const monday = new Date(date);
                monday.setHours(0, 0, 0, 0);
                monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
                key = localDateKey(monday);
            } else {
                key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
            }
            const period = periodByKey.get(key);
            if (period) period.value += Number(order.total) || 0;
        });

        return periods;
    }

    function appendSvgElement(svg, tag, attributes, text) {
        const element = document.createElementNS("http://www.w3.org/2000/svg", tag);
        Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, String(value)));
        if (text != null) element.textContent = text;
        svg.appendChild(element);
        return element;
    }

    function renderChart(svg, periods) {
        svg.textContent = "";
        const width = 720;
        const height = 270;
        const left = 62;
        const right = 18;
        const top = 24;
        const bottom = 44;
        const plotWidth = width - left - right;
        const plotHeight = height - top - bottom;
        const maxValue = Math.max(1000, ...periods.map(period => period.value));
        const step = maxValue / 4;
        const slotWidth = plotWidth / periods.length;
        const barWidth = Math.min(42, slotWidth * 0.62);

        for (let index = 0; index <= 4; index += 1) {
            const y = top + plotHeight - (plotHeight * index / 4);
            appendSvgElement(svg, "line", {
                x1: left,
                y1: y,
                x2: width - right,
                y2: y,
                class: index === 0 ? "chart-baseline" : "chart-gridline"
            });
            appendSvgElement(svg, "text", {
                x: left - 8,
                y: y + 4,
                class: "chart-label",
                style: "text-anchor: end;"
            }, money(step * index));
        }

        periods.forEach((period, index) => {
            const barHeight = (period.value / maxValue) * plotHeight;
            const x = left + (slotWidth * index) + ((slotWidth - barWidth) / 2);
            const y = top + plotHeight - barHeight;
            const bar = appendSvgElement(svg, "rect", {
                x,
                y,
                width: barWidth,
                height: Math.max(period.value > 0 ? 2 : 0, barHeight),
                rx: 4,
                class: "chart-bar"
            });
            appendSvgElement(bar, "title", {}, `${period.label}: ${money(period.value)}`);
            appendSvgElement(svg, "text", {
                x: x + barWidth / 2,
                y: height - 14,
                class: "chart-label"
            }, period.label);
        });
    }

    function renderRevenue(orders) {
        ["daily", "weekly", "monthly"].forEach(type => {
            const chart = document.getElementById(`chart-${type}`);
            if (chart) renderChart(chart, groupRevenue(orders, type));
        });
    }

    function renderPending(orders) {
        const body = document.getElementById("report-orders-body");
        if (!body) return;
        body.textContent = "";

        const pending = orders.filter(order =>
            order && order.status !== "Hoàn tất" && order.status !== "Đã hủy"
        ).sort((first, second) =>
            (dateValue(second.createdAt)?.getTime() || 0) - (dateValue(first.createdAt)?.getTime() || 0)
        );

        if (pending.length === 0) {
            const row = document.createElement("tr");
            const cell = document.createElement("td");
            cell.colSpan = 6;
            cell.className = "empty-cell";
            cell.textContent = "Không có đơn hàng nào đang chờ xử lý.";
            row.appendChild(cell);
            body.appendChild(row);
            return;
        }

        pending.forEach(order => {
            const row = document.createElement("tr");
            const values = [
                order.code ? `#${order.code}` : "—",
                [order.name || "Khách vãng lai", order.phone, order.customerEmail].filter(Boolean).join(" · "),
                dateValue(order.createdAt)?.toLocaleString("vi-VN") || "—",
                Array.isArray(order.items)
                    ? order.items.map(item => `${item.name || "Món"} ×${Number(item.qty) || 0}`).join(", ")
                    : "—",
                money(order.total),
                order.status || "Chờ xử lý"
            ];

            values.forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = value;
                row.appendChild(cell);
            });
            body.appendChild(row);
        });
    }

    const orders = readOrders();
    if (document.getElementById("chart-daily")) renderRevenue(orders);
    if (document.body.dataset.reportPage === "pending") renderPending(orders);
});
