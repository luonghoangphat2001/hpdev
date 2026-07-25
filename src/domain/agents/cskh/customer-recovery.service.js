'use strict';

class CustomerRecoveryService {
  constructor({
    defaultVoucherAmount = 50000,
    templateConfidence = 0.95,
  } = {}) {
    this.defaultVoucherAmount = defaultVoucherAmount;
    this.templateConfidence = templateConfidence;
  }

  build(feedback) {
    const severe = feedback.sentiment === 'negative' || Number(feedback.rating) <= 2;
    const customerName = feedback.customer_name || 'quý khách';
    const replyContent = severe
      ? `Xin lỗi ${customerName} về trải nghiệm chưa tốt. Chúng tôi đang ưu tiên kiểm tra và sẽ phản hồi hướng xử lý sớm nhất.`
      : `Cảm ơn ${customerName} đã gửi phản hồi. Chúng tôi đã ghi nhận để tiếp tục cải thiện dịch vụ.`;

    return Object.freeze({
      severe,
      reply_content: replyContent,
      confidence: this.templateConfidence,
      voucher_amount: severe ? this.defaultVoucherAmount : null,
    });
  }
}

module.exports = CustomerRecoveryService;
