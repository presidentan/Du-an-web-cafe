document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector(".contact-form form");
    const status = document.getElementById("contact-status");
    if (!form || !status) return;

    form.addEventListener("submit", event => {
        event.preventDefault();
        const formData = new FormData(form);
        let feedback;

        try {
            feedback = JSON.parse(localStorage.getItem("feedback") || "[]");
            if (!Array.isArray(feedback)) throw new Error("Dữ liệu feedback không hợp lệ.");
        } catch (error) {
            status.textContent = "Không đọc được dữ liệu phản hồi đã lưu. Vui lòng báo quản trị viên.";
            status.style.color = "#b5534b";
            console.error("Không thể đọc dữ liệu feedback", error);
            return;
        }

        feedback.push({
            name: String(formData.get("name") || "").trim(),
            email: String(formData.get("email") || "").trim(),
            phone: String(formData.get("phone") || "").trim(),
            message: String(formData.get("message") || "").trim(),
            createdAt: new Date().toISOString()
        });

        try {
            localStorage.setItem("feedback", JSON.stringify(feedback));
        } catch (error) {
            status.textContent = "Không lưu được phản hồi. Vui lòng thử lại.";
            status.style.color = "#b5534b";
            console.error("Không thể lưu feedback", error);
            return;
        }

        form.reset();
        status.style.color = "";
        status.textContent = "Cảm ơn bạn! Phản hồi đã được gửi.";
    });
});
