import React, { useState } from "react";
import { toast } from "react-toastify";

const SupportSettings = () => {
  const [loading, setLoading] = useState({
    contact: false,
    report: false,
  });

  const [contactForm, setContactForm] = useState({
    message: "",
  });

  const [reportForm, setReportForm] = useState({
    title: "",
    description: "",
  });

  const handleContactChange = (e) => {
    setContactForm({
      ...contactForm,
      message: e.target.value,
    });
  };

  const handleReportChange = (e) => {
    setReportForm({
      ...reportForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();

    if (!contactForm.message.trim()) {
      toast.error("Vui lòng nhập nội dung tin nhắn");
      return;
    }

    try {
      setLoading((prev) => ({ ...prev, contact: true }));

      // Giả lập API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Đã gửi yêu cầu hỗ trợ thành công");
      setContactForm({ message: "" });
    } catch (error) {
      console.error("Lỗi khi gửi tin nhắn:", error);
      toast.error("Không thể gửi yêu cầu hỗ trợ");
    } finally {
      setLoading((prev) => ({ ...prev, contact: false }));
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();

    if (!reportForm.title.trim() || !reportForm.description.trim()) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    try {
      setLoading((prev) => ({ ...prev, report: true }));

      // Giả lập API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Đã gửi báo cáo sự cố thành công");
      setReportForm({ title: "", description: "" });
    } catch (error) {
      console.error("Lỗi khi gửi báo cáo:", error);
      toast.error("Không thể gửi báo cáo sự cố");
    } finally {
      setLoading((prev) => ({ ...prev, report: false }));
    }
  };

  const openFAQ = () => {
    window.open("/faq", "_blank");
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-8 space-y-10 bg-neutral-50 border border-neutral-200 rounded-xl">
      <h1 className="text-2xl font-semibold text-neutral-800">
        Cài Đặt Hỗ Trợ
      </h1>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-neutral-700">Liên Hệ Hỗ Trợ</h2>
        <form onSubmit={handleContactSubmit}>
          <textarea
            value={contactForm.message}
            onChange={handleContactChange}
            placeholder="Mô tả vấn đề của bạn..."
            rows={4}
            className="w-full p-3 border border-neutral-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
            required
          />
          <div className="flex justify-end mt-4">
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition disabled:opacity-50"
              disabled={loading.contact}
            >
              {loading.contact ? "Đang gửi..." : "Gửi Yêu Cầu"}
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-neutral-700">
          Câu Hỏi Thường Gặp
        </h2>
        <ul className="space-y-2 text-sm text-neutral-600">
          <li>• Làm thế nào để đặt lại mật khẩu?</li>
          <li>• Làm thế nào để xóa tài khoản của tôi?</li>
          <li>• Làm thế nào để thay đổi email của tôi?</li>
          <li>• Làm thế nào để liên hệ với bộ phận hỗ trợ?</li>
        </ul>
        <div className="flex justify-end">
          <button
            onClick={openFAQ}
            className="px-5 py-2 bg-neutral-800 text-white rounded-md text-sm hover:bg-neutral-900 transition"
          >
            Xem Thêm FAQ
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-neutral-700">Báo Cáo Sự Cố</h2>
        <form onSubmit={handleReportSubmit}>
          <input
            type="text"
            name="title"
            value={reportForm.title}
            onChange={handleReportChange}
            placeholder="Tiêu đề"
            className="w-full p-3 border border-neutral-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none mb-4"
            required
          />
          <textarea
            name="description"
            value={reportForm.description}
            onChange={handleReportChange}
            placeholder="Mô tả sự cố..."
            rows={4}
            className="w-full p-3 border border-neutral-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
            required
          />
          <div className="flex justify-end mt-4">
            <button
              type="submit"
              className="px-5 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition disabled:opacity-50"
              disabled={loading.report}
            >
              {loading.report ? "Đang gửi..." : "Báo Cáo Sự Cố"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default SupportSettings;
