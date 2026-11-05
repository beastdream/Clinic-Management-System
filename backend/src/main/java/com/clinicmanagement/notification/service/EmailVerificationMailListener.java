package com.clinicmanagement.notification.service;

import com.clinicmanagement.auth.event.EmailVerificationRequestedEvent;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.web.util.HtmlUtils;

import java.nio.charset.StandardCharsets;

/**
 * Gửi email xác thực sau khi transaction đăng ký/gửi lại đã commit.
 * Chưa cấu hình SMTP (MAIL_HOST trống) -> in link ra log để dev kiểm thử.
 */
@Component
public class EmailVerificationMailListener {

    private static final Logger log = LoggerFactory.getLogger(EmailVerificationMailListener.class);

    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    @Value("${spring.mail.host:}")
    private String mailHost;

    @Value("${app.mail.from:MediCare Clinic <no-reply@medicare-clinic.local>}")
    private String mailFrom;

    public EmailVerificationMailListener(ObjectProvider<JavaMailSender> mailSenderProvider) {
        this.mailSenderProvider = mailSenderProvider;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onEmailVerificationRequested(EmailVerificationRequestedEvent event) {
        JavaMailSender sender = mailSenderProvider.getIfAvailable();
        if (mailHost == null || mailHost.isBlank() || sender == null) {
            log.warn("[DEV - CHƯA CẤU HÌNH SMTP] Link xác thực email cho {}: {}", event.email(), event.verificationLink());
            return;
        }
        try {
            MimeMessage message = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());
            helper.setFrom(mailFrom);
            helper.setTo(event.email());
            helper.setSubject("Xác thực email tài khoản MediCare Clinic");
            helper.setText(plainText(event), htmlBody(event));
            sender.send(message);
            log.info("Đã gửi email xác thực tới {}", event.email());
        } catch (Exception ex) {
            // Người dùng có thể bấm "Gửi lại email" nếu gửi thất bại
            log.error("Gửi email xác thực tới {} thất bại: {}", event.email(), ex.getMessage());
        }
    }

    private String plainText(EmailVerificationRequestedEvent e) {
        return "Xin chào " + e.displayName() + ",\n\n"
                + "Cảm ơn bạn đã đăng ký tài khoản bệnh nhân tại MediCare Clinic.\n"
                + "Vui lòng mở liên kết sau để xác thực email (hiệu lực " + e.expirationHours() + " giờ):\n"
                + e.verificationLink() + "\n\n"
                + "Nếu bạn không thực hiện đăng ký, hãy bỏ qua email này.\n\nMediCare Clinic";
    }

    private String htmlBody(EmailVerificationRequestedEvent e) {
        String name = HtmlUtils.htmlEscape(e.displayName());
        String link = HtmlUtils.htmlEscape(e.verificationLink());
        return """
                <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1e293b">
                  <div style="background:#0f766e;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0">
                    <strong style="font-size:18px">MediCare Clinic</strong>
                  </div>
                  <div style="border:1px solid #e2e8f0;border-top:0;padding:24px;border-radius:0 0 12px 12px">
                    <p>Xin chào <strong>%s</strong>,</p>
                    <p>Cảm ơn bạn đã đăng ký tài khoản bệnh nhân tại MediCare Clinic. Bấm nút dưới đây để xác thực địa chỉ email của bạn:</p>
                    <p style="text-align:center;margin:28px 0">
                      <a href="%s" style="background:#0d9488;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:bold;display:inline-block">Xác thực email</a>
                    </p>
                    <p style="font-size:13px;color:#64748b">Liên kết có hiệu lực trong %d giờ. Nếu nút không hoạt động, hãy sao chép đường dẫn sau vào trình duyệt:<br>
                      <a href="%s" style="color:#0f766e;word-break:break-all">%s</a></p>
                    <p style="font-size:13px;color:#64748b">Nếu bạn không thực hiện đăng ký, hãy bỏ qua email này.</p>
                  </div>
                </div>
                """.formatted(name, link, e.expirationHours(), link, link);
    }
}
