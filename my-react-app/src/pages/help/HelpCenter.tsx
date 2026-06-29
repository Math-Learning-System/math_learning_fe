import {
  ArrowRight,
  BookOpen,
  Bot,
  ChevronDown,
  Circle,
  CreditCard,
  FileText,
  HelpCircle,
  Lock,
  Mail,
  MessageCircle,
  Phone,
  Search,
  Settings,
  ThumbsDown,
  ThumbsUp,
  User,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { UI_TEXT } from '../../constants/uiText';
import { mockAdmin, mockStudent, mockTeacher } from '../../data/mockData';
import { AuthService } from '../../services/api/auth.service';
import './HelpCenter.css';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: string;
  helpful: number;
}

interface Article {
  id: number;
  title: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  readTime: string;
}

const HelpCenter: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);

  const categories = [
    { id: 'all', name: 'Tất cả', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'account', name: 'Tài khoản', icon: <User className="w-4 h-4" /> },
    { id: 'courses', name: UI_TEXT.COURSE, icon: <BookOpen className="w-4 h-4" /> },
    { id: 'payment', name: 'Thanh toán', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'technical', name: 'Kỹ thuật', icon: <Settings className="w-4 h-4" /> },
  ];

  const faqs: FAQItem[] = [
    {
      id: 1,
      question: 'Làm thế nào để đặt lại mật khẩu?',
      answer:
        'Bạn có thể đặt lại mật khẩu bằng cách vào trang Đăng nhập > Quên mật khẩu, sau đó nhập email đã đăng ký. Hệ thống sẽ gửi link đặt lại mật khẩu về email của bạn.',
      category: 'account',
      helpful: 125,
    },
    {
      id: 2,
      question: `Cách đăng ký ${UI_TEXT.COURSE} mới?`,
      answer: `Để đăng ký ${UI_TEXT.COURSE.toLowerCase()}: 1) Vào trang ${UI_TEXT.COURSE}, 2) Chọn ${UI_TEXT.COURSE} bạn quan tâm, 3) Nhấn "Đăng ký ngay", 4) Chọn gói thanh toán phù hợp, 5) Hoàn tất thanh toán.`,
      category: 'courses',
      helpful: 98,
    },
    {
      id: 3,
      question: 'Các phương thức thanh toán được hỗ trợ?',
      answer:
        'Chúng tôi hỗ trợ thanh toán qua: Thẻ ATM nội địa, Thẻ Visa/MasterCard, Ví điện tử (MoMo, ZaloPay, VNPay), Chuyển khoản ngân hàng. Tất cả giao dịch đều được bảo mật.',
      category: 'payment',
      helpful: 87,
    },
    {
      id: 4,
      question: 'Video bài học không phát được?',
      answer:
        'Nếu video không phát: 1) Kiểm tra kết nối internet, 2) Thử tải lại trang (F5), 3) Xóa cache trình duyệt, 4) Thử trình duyệt khác. Nếu vẫn lỗi, vui lòng liên hệ hỗ trợ kỹ thuật.',
      category: 'technical',
      helpful: 76,
    },
    {
      id: 5,
      question: 'Thời gian học tập có giới hạn không?',
      answer: `Sau khi đăng ký ${UI_TEXT.COURSE.toLowerCase()}, bạn có thể truy cập nội dung trong 12 tháng kể từ ngày đăng ký. Các bài tập và tài liệu có thể tải về để sử dụng vĩnh viễn.`,
      category: 'courses',
      helpful: 65,
    },
    {
      id: 6,
      question: 'Cách cập nhật thông tin cá nhân?',
      answer:
        'Vào menu Cài đặt > Hồ sơ cá nhân, tại đây bạn có thể chỉnh sửa tên, email, số điện thoại, ảnh đại diện và các thông tin khác. Nhớ nhấn "Lưu thay đổi" khi hoàn tất.',
      category: 'account',
      helpful: 54,
    },
    {
      id: 7,
      question: 'Chứng chỉ hoàn thành được cấp như thế nào?',
      answer: `Chứng chỉ sẽ được tự động cấp khi bạn hoàn thành 100% nội dung ${UI_TEXT.COURSE.toLowerCase()} và đạt điểm trung bình ≥ 7.0 trong các bài kiểm tra. Bạn có thể tải xuống PDF hoặc chia sẻ trực tuyến.`,
      category: 'courses',
      helpful: 92,
    },
    {
      id: 8,
      question: 'Hoàn tiền trong trường hợp nào?',
      answer: `Bạn có thể yêu cầu hoàn tiền 100% trong vòng 7 ngày đầu nếu chưa hoàn thành quá 20% ${UI_TEXT.COURSE.toLowerCase()}. Sau 7 ngày, chúng tôi không hỗ trợ hoàn tiền nhưng có thể chuyển sang ${UI_TEXT.COURSE.toLowerCase()} khác.`,
      category: 'payment',
      helpful: 43,
    },
  ];

  const articles: Article[] = [
    {
      id: 1,
      title: 'Hướng dẫn sử dụng nền tảng cho người mới',
      description: 'Tìm hiểu các tính năng cơ bản và cách bắt đầu học tập hiệu quả',
      category: 'account',
      icon: <Zap className="w-5 h-5 text-[#0ea5e9]" />,
      readTime: '5 phút',
    },
    {
      id: 2,
      title: 'Tối ưu hóa trải nghiệm học tập',
      description: 'Những mẹo và thủ thuật giúp bạn học tập hiệu quả hơn',
      category: 'courses',
      icon: <BookOpen className="w-5 h-5 text-[#0ea5e9]" />,
      readTime: '8 phút',
    },
    {
      id: 3,
      title: 'Bảo mật tài khoản của bạn',
      description: 'Cách bảo vệ tài khoản và dữ liệu cá nhân an toàn',
      category: 'account',
      icon: <Lock className="w-5 h-5 text-[#0ea5e9]" />,
      readTime: '6 phút',
    },
    {
      id: 4,
      title: 'Hướng dẫn thanh toán chi tiết',
      description: 'Các bước thanh toán và xử lý vấn đề phổ biến',
      category: 'payment',
      icon: <CreditCard className="w-5 h-5 text-[#0ea5e9]" />,
      readTime: '10 phút',
    },
    {
      id: 5,
      title: 'Xử lý sự cố kỹ thuật thường gặp',
      description: 'Giải pháp cho các lỗi phổ biến khi sử dụng nền tảng',
      category: 'technical',
      icon: <Wrench className="w-5 h-5 text-[#0ea5e9]" />,
      readTime: '12 phút',
    },
    {
      id: 6,
      title: 'Sử dụng AI Assistant hiệu quả',
      description: 'Khai thác tối đa tính năng trợ lý AI trong học tập',
      category: 'courses',
      icon: <Bot className="w-5 h-5 text-[#0ea5e9]" />,
      readTime: '7 phút',
    },
  ];

  const filteredFAQs = faqs.filter((faq) => {
    const matchCategory = categoryFilter === 'all' || faq.category === categoryFilter;
    const matchSearch =
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  const filteredArticles = articles.filter((article) => {
    const matchCategory = categoryFilter === 'all' || article.category === categoryFilter;
    const matchSearch =
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  const currentRole = (AuthService.getUserRole() ?? 'student') as 'teacher' | 'student' | 'admin';
  let currentUser: { name: string; avatar: string } = mockStudent;
  if (currentRole === 'teacher') currentUser = mockTeacher;
  else if (currentRole === 'admin') currentUser = mockAdmin;

  return (
    <DashboardLayout
      role={currentRole}
      user={{ name: currentUser.name, avatar: currentUser.avatar, role: currentRole }}
      notificationCount={5}
    >
      <div className="p-6 lg:p-8 animate-[fadeInUp_0.4s_ease_both]">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-[#e2e8f0] rounded-2xl mb-4">
            <HelpCircle className="w-8 h-8 text-[#0ea5e9]" />
          </div>
          <h1 className="font-[Be_Vietnam_Pro] text-[36px] font-bold tracking-[-0.01em] leading-[1.2] text-[#0f172a] mb-3">
            Trung Tâm Trợ Giúp
          </h1>
          <p className="font-[Be_Vietnam_Pro] text-[15px] font-normal text-[#64748b] leading-[1.6]">
            Tìm câu trả lời cho mọi thắc mắc của bạn
          </p>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="bg-[#ffffff] border border-[#e2e8f0] rounded-xl shadow-[0px_0px_0px_1px_#e2e8f0] px-5 py-3.5 flex items-center gap-3 focus-within:border-[#3898EC] focus-within:shadow-[0_0_0_3px_rgba(56,152,236,0.12)] transition-all duration-200">
            <Search className="w-4 h-4 text-[#64748b]" />
            <input
              type="text"
              placeholder="Tìm kiếm câu hỏi, hướng dẫn..."
              className="flex-1 font-[Be_Vietnam_Pro] text-[14px] placeholder:text-[#64748b] bg-transparent outline-none text-[#0f172a]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <p className="text-center mt-3 font-[Be_Vietnam_Pro] text-[13px] text-[#64748b]">
            Ví dụ: "đặt lại mật khẩu", "thanh toán", "chứng chỉ"...
          </p>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-[Be_Vietnam_Pro] text-[13px] transition-all duration-150 active:scale-[0.98] ${
                categoryFilter === cat.id
                  ? 'bg-[#0f172a] text-[#ffffff] font-semibold'
                  : 'bg-transparent text-[#475569] font-medium hover:bg-[#e2e8f0] hover:text-[#0f172a]'
              }`}
              onClick={() => setCategoryFilter(cat.id)}
            >
              {cat.icon}
              {cat.name}
            </button>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
          <div
            className="bg-[#ffffff] rounded-2xl border border-[#e2e8f0] shadow-[rgba(0,0,0,0.05)_0px_4px_24px] p-5 flex flex-col gap-3 hover:shadow-[0px_0px_0px_1px_#cbd5e1,rgba(0,0,0,0.08)_0px_8px_30px] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
            onClick={() => setShowContactModal(true)}
          >
            <div className="w-11 h-11 rounded-xl bg-[#e2e8f0] flex items-center justify-center text-[#475569] group-hover:scale-110 transition-transform duration-300">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-[Be_Vietnam_Pro] text-[15px] font-semibold text-[#0f172a] mb-1">
                Liên hệ hỗ trợ
              </h3>
              <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#64748b]">
                Gửi yêu cầu hỗ trợ trực tiếp
              </p>
            </div>
          </div>

          <div className="bg-[#ffffff] rounded-2xl border border-[#e2e8f0] shadow-[rgba(0,0,0,0.05)_0px_4px_24px] p-5 flex flex-col gap-3 hover:shadow-[0px_0px_0px_1px_#cbd5e1,rgba(0,0,0,0.08)_0px_8px_30px] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group">
            <div className="w-11 h-11 rounded-xl bg-[#e2e8f0] flex items-center justify-center text-[#475569] group-hover:scale-110 transition-transform duration-300">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-[Be_Vietnam_Pro] text-[15px] font-semibold text-[#0f172a] mb-1">
                Chat với chúng tôi
              </h3>
              <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#64748b]">
                Trò chuyện trực tiếp (8:00 - 22:00)
              </p>
            </div>
          </div>

          <div className="bg-[#ffffff] rounded-2xl border border-[#e2e8f0] shadow-[rgba(0,0,0,0.05)_0px_4px_24px] p-5 flex flex-col gap-3 hover:shadow-[0px_0px_0px_1px_#cbd5e1,rgba(0,0,0,0.08)_0px_8px_30px] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group">
            <div className="w-11 h-11 rounded-xl bg-[#e2e8f0] flex items-center justify-center text-[#475569] group-hover:scale-110 transition-transform duration-300">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-[Be_Vietnam_Pro] text-[15px] font-semibold text-[#0f172a] mb-1">
                Hotline: 1900-xxxx
              </h3>
              <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#64748b]">Hỗ trợ 24/7</p>
            </div>
          </div>

          <div className="bg-[#ffffff] rounded-2xl border border-[#e2e8f0] shadow-[rgba(0,0,0,0.05)_0px_4px_24px] p-5 flex flex-col gap-3 hover:shadow-[0px_0px_0px_1px_#cbd5e1,rgba(0,0,0,0.08)_0px_8px_30px] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group">
            <div className="w-11 h-11 rounded-xl bg-[#e2e8f0] flex items-center justify-center text-[#475569] group-hover:scale-110 transition-transform duration-300">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-[Be_Vietnam_Pro] text-[15px] font-semibold text-[#0f172a] mb-1">
                Tài liệu hướng dẫn
              </h3>
              <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#64748b]">
                Tải PDF hướng dẫn sử dụng
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area - Articles */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="font-[Playfair_Display] text-[18px] font-medium text-[#0f172a] mb-5 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#0ea5e9]" />
                Bài viết hướng dẫn
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredArticles.map((article) => (
                  <div
                    key={article.id}
                    className="bg-[#ffffff] rounded-2xl border border-[#e2e8f0] shadow-[rgba(0,0,0,0.05)_0px_4px_24px] p-5 hover:shadow-[0px_0px_0px_1px_#cbd5e1,rgba(0,0,0,0.08)_0px_8px_30px] hover:-translate-y-0.5 transition-all duration-200 group flex flex-col h-full cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#e2e8f0] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      {article.icon}
                    </div>
                    <h3 className="font-[Be_Vietnam_Pro] text-[15px] font-semibold text-[#0f172a] mb-2">
                      {article.title}
                    </h3>
                    <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#64748b] mb-4 flex-1 leading-[1.6]">
                      {article.description}
                    </p>
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#e2e8f0]">
                      <span className="font-[Be_Vietnam_Pro] text-[12px] font-medium text-[#64748b] uppercase tracking-[0.5px]">
                        {article.readTime}
                      </span>
                      <button className="font-[Be_Vietnam_Pro] text-[13px] font-semibold text-[#0ea5e9] flex items-center gap-1 group-hover:gap-2 transition-all duration-200 hover:text-[#0284c7]">
                        Đọc ngay <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Need Help CTA below articles */}
            <div className="bg-[#0f172a] rounded-2xl p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#0ea5e9] rounded-full filter blur-[100px] opacity-20 -translate-y-1/2 translate-x-1/4"></div>
              <div className="relative z-10">
                <h2 className="font-[Playfair_Display] text-[20px] font-medium text-[#ffffff] mb-2">
                  Vẫn chưa tìm được câu trả lời?
                </h2>
                <p className="font-[Be_Vietnam_Pro] text-[15px] text-[#94a3b8] mb-6 max-w-md leading-[1.6]">
                  Đừng lo lắng! Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giúp đỡ bạn giải quyết
                  mọi vấn đề.
                </p>
                <button
                  className="bg-[#0ea5e9] text-[#ffffff] rounded-xl px-5 py-2.5 font-[Be_Vietnam_Pro] text-[14px] font-semibold shadow-[#0ea5e9_0px_0px_0px_0px,#0ea5e9_0px_0px_0px_1px] hover:brightness-95 active:scale-[0.98] transition-all duration-150 inline-flex items-center gap-2"
                  onClick={() => setShowContactModal(true)}
                >
                  <Mail className="w-4 h-4" />
                  Liên hệ hỗ trợ
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar - FAQs */}
          <div className="lg:col-span-1">
            <div className="bg-[#ffffff] rounded-2xl border border-[#e2e8f0] shadow-[rgba(0,0,0,0.05)_0px_4px_24px] p-6 sticky top-6">
              <h2 className="font-[Playfair_Display] text-[18px] font-medium text-[#0f172a] mb-5">
                Câu hỏi thường gặp
              </h2>
              <div className="space-y-3">
                {filteredFAQs.map((faq) => (
                  <div
                    key={faq.id}
                    className="border border-[#e2e8f0] rounded-xl overflow-hidden bg-[#f8fafc] transition-colors duration-200"
                  >
                    <button
                      className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-[#e2e8f0] transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3898EC] focus-visible:ring-offset-1"
                      onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                    >
                      <span className="font-[Be_Vietnam_Pro] text-[14px] font-semibold text-[#0f172a] pr-4">
                        {faq.question}
                      </span>
                      <div
                        className={`text-[#64748b] flex-shrink-0 transition-transform duration-200 ${expandedFAQ === faq.id ? 'rotate-180' : ''}`}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </button>

                    <div
                      className={`grid transition-all duration-200 ease-in-out ${expandedFAQ === faq.id ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                    >
                      <div className="overflow-hidden">
                        <div className="px-4 pb-4 pt-1">
                          <p className="font-[Be_Vietnam_Pro] text-[14px] text-[#475569] mb-4 leading-[1.6]">
                            {faq.answer}
                          </p>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#e2e8f0]">
                            <span className="font-[Be_Vietnam_Pro] text-[12px] font-medium text-[#64748b]">
                              {faq.helpful} người thấy hữu ích
                            </span>
                            <div className="flex items-center gap-2">
                              <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-[Be_Vietnam_Pro] text-[12px] font-medium text-[#475569] hover:bg-[#ffffff] hover:text-[#0ea5e9] hover:shadow-[0px_0px_0px_1px_#e2e8f0] transition-all duration-150">
                                <ThumbsUp className="w-3.5 h-3.5" /> Có
                              </button>
                              <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-[Be_Vietnam_Pro] text-[12px] font-medium text-[#475569] hover:bg-[#ffffff] hover:text-[#B53333] hover:shadow-[0px_0px_0px_1px_#e2e8f0] transition-all duration-150">
                                <ThumbsDown className="w-3.5 h-3.5" /> Không
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Contact Modal */}
        {showContactModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f172a]/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease_out]">
            <div
              className="bg-[#ffffff] rounded-2xl shadow-[rgba(0,0,0,0.05)_0px_4px_24px,0px_0px_0px_1px_#e2e8f0] w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-[slideUp_0.3s_ease_out]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5 border-b border-[#e2e8f0]">
                <h2 className="font-[Playfair_Display] text-[18px] font-medium text-[#0f172a] flex items-center gap-2">
                  <Mail className="w-5 h-5 text-[#0ea5e9]" />
                  Gửi yêu cầu hỗ trợ
                </h2>
                <button
                  className="p-2 text-[#64748b] hover:bg-[#e2e8f0] rounded-xl transition-colors duration-150 active:scale-[0.98]"
                  onClick={() => setShowContactModal(false)}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="font-[Be_Vietnam_Pro] text-[13px] font-semibold text-[#0f172a]">
                      Danh mục vấn đề <span className="text-[#B53333]">*</span>
                    </label>
                    <select className="w-full bg-[#ffffff] border border-[#e2e8f0] rounded-xl px-3.5 py-2.5 font-[Be_Vietnam_Pro] text-[14px] text-[#0f172a] focus:border-[#3898EC] focus:ring-2 focus:ring-[#3898EC]/20 outline-none transition-all duration-150">
                      <option value="">Chọn danh mục</option>
                      <option value="account">Tài khoản</option>
                      <option value="courses">{UI_TEXT.COURSE}</option>
                      <option value="payment">Thanh toán</option>
                      <option value="technical">Kỹ thuật</option>
                      <option value="other">Khác</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-[Be_Vietnam_Pro] text-[13px] font-semibold text-[#0f172a]">
                      Email liên hệ <span className="text-[#B53333]">*</span>
                    </label>
                    <input
                      type="email"
                      defaultValue={mockStudent.email}
                      className="w-full bg-[#ffffff] border border-[#e2e8f0] rounded-xl px-3.5 py-2.5 font-[Be_Vietnam_Pro] text-[14px] text-[#0f172a] focus:border-[#3898EC] focus:ring-2 focus:ring-[#3898EC]/20 outline-none transition-all duration-150"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-[Be_Vietnam_Pro] text-[13px] font-semibold text-[#0f172a]">
                    Tiêu đề <span className="text-[#B53333]">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Mô tả ngắn gọn vấn đề của bạn"
                    className="w-full bg-[#ffffff] border border-[#e2e8f0] rounded-xl px-3.5 py-2.5 font-[Be_Vietnam_Pro] text-[14px] text-[#0f172a] placeholder:text-[#64748b] focus:border-[#3898EC] focus:ring-2 focus:ring-[#3898EC]/20 outline-none transition-all duration-150"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-[Be_Vietnam_Pro] text-[13px] font-semibold text-[#0f172a]">
                    Nội dung chi tiết <span className="text-[#B53333]">*</span>
                  </label>
                  <textarea
                    rows={6}
                    placeholder="Mô tả chi tiết vấn đề bạn đang gặp phải...&#10;&#10;Vui lòng cung cấp:&#10;• Mô tả chi tiết vấn đề&#10;• Các bước đã thực hiện&#10;• Ảnh chụp màn hình (nếu có)&#10;• Thời gian xảy ra lỗi"
                    className="w-full bg-[#ffffff] border border-[#e2e8f0] rounded-xl px-3.5 py-2.5 font-[Be_Vietnam_Pro] text-[14px] text-[#0f172a] placeholder:text-[#64748b] focus:border-[#3898EC] focus:ring-2 focus:ring-[#3898EC]/20 outline-none transition-all duration-150 resize-none"
                  ></textarea>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="font-[Be_Vietnam_Pro] text-[13px] font-semibold text-[#0f172a]">
                    Độ ưu tiên
                  </label>
                  <div className="flex flex-wrap gap-3">
                    <label className="relative flex items-center justify-center px-4 py-2 border border-[#e2e8f0] rounded-xl cursor-pointer hover:bg-[#e2e8f0] transition-colors duration-150 has-[:checked]:bg-[#e2e8f0] has-[:checked]:border-[#0ea5e9] has-[:checked]:ring-1 has-[:checked]:ring-[#0ea5e9]">
                      <input
                        type="radio"
                        name="priority"
                        value="low"
                        defaultChecked
                        className="sr-only"
                      />
                      <div className="flex items-center gap-2 font-[Be_Vietnam_Pro] text-[14px] font-medium text-[#0f172a]">
                        <Circle className="w-3.5 h-3.5 text-[#475569] fill-current" /> Thấp
                      </div>
                    </label>
                    <label className="relative flex items-center justify-center px-4 py-2 border border-[#e2e8f0] rounded-xl cursor-pointer hover:bg-[#e2e8f0] transition-colors duration-150 has-[:checked]:bg-[#e2e8f0] has-[:checked]:border-[#0ea5e9] has-[:checked]:ring-1 has-[:checked]:ring-[#0ea5e9]">
                      <input type="radio" name="priority" value="medium" className="sr-only" />
                      <div className="flex items-center gap-2 font-[Be_Vietnam_Pro] text-[14px] font-medium text-[#0f172a]">
                        <Circle className="w-3.5 h-3.5 text-[#14b8a6] fill-current" /> Trung bình
                      </div>
                    </label>
                    <label className="relative flex items-center justify-center px-4 py-2 border border-[#e2e8f0] rounded-xl cursor-pointer hover:bg-[#e2e8f0] transition-colors duration-150 has-[:checked]:bg-[#e2e8f0] has-[:checked]:border-[#0ea5e9] has-[:checked]:ring-1 has-[:checked]:ring-[#0ea5e9]">
                      <input type="radio" name="priority" value="high" className="sr-only" />
                      <div className="flex items-center gap-2 font-[Be_Vietnam_Pro] text-[14px] font-medium text-[#0f172a]">
                        <Circle className="w-3.5 h-3.5 text-[#B53333] fill-current" /> Cao
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-end gap-3">
                <button
                  className="px-5 py-2.5 rounded-xl font-[Be_Vietnam_Pro] text-[14px] font-medium text-[#334155] bg-[#e2e8f0] shadow-[#e2e8f0_0px_0px_0px_0px,#cbd5e1_0px_0px_0px_1px] hover:shadow-[#e2e8f0_0px_0px_0px_0px,#C2C0B6_0px_0px_0px_1px] active:scale-[0.98] transition-all duration-150"
                  onClick={() => setShowContactModal(false)}
                >
                  Hủy
                </button>
                <button className="px-5 py-2.5 rounded-xl font-[Be_Vietnam_Pro] text-[14px] font-semibold text-[#ffffff] bg-[#0ea5e9] shadow-[#0ea5e9_0px_0px_0px_0px,#0ea5e9_0px_0px_0px_1px] hover:shadow-[#0ea5e9_0px_0px_0px_0px,#0284c7_0px_0px_0px_1px] hover:brightness-95 active:scale-[0.98] transition-all duration-150">
                  Gửi yêu cầu
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default HelpCenter;
