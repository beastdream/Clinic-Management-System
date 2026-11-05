package com.clinicmanagement.auth.controller;

import com.clinicmanagement.auth.dto.AuthResponse;
import com.clinicmanagement.auth.dto.LoginRequest;
import com.clinicmanagement.auth.dto.RegisterRequest;
import com.clinicmanagement.auth.dto.GoogleAuthDtos.AuthProvidersResponse;
import com.clinicmanagement.auth.dto.GoogleAuthDtos.GoogleAuthResult;
import com.clinicmanagement.auth.dto.GoogleAuthDtos.GoogleLoginRequest;
import com.clinicmanagement.auth.dto.GoogleAuthDtos.GoogleRegisterRequest;
import com.clinicmanagement.auth.dto.GoogleAuthDtos.RegistrationResult;
import com.clinicmanagement.auth.dto.GoogleAuthDtos.ResendVerificationRequest;
import com.clinicmanagement.auth.dto.GoogleAuthDtos.VerifyEmailRequest;
import org.springframework.http.HttpStatus;
import com.clinicmanagement.auth.service.AuthService;
import com.clinicmanagement.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication", description = "Các API xác thực, đăng nhập và cấp phát token")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    @Operation(summary = "Đăng nhập hệ thống", description = "Xác thực tài khoản và trả về cặp Access Token + Refresh Token")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Đăng nhập thành công", response));
    }

    @PostMapping("/register")
    @Operation(summary = "Bệnh nhân đăng ký tài khoản", description = "Tạo tài khoản cổng thông tin bệnh nhân + hồ sơ bệnh nhân mới và gửi email xác thực")
    public ResponseEntity<ApiResponse<RegistrationResult>> register(@Valid @RequestBody RegisterRequest request) {
        RegistrationResult response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
                "Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản", response));
    }

    @PostMapping("/verify-email")
    @Operation(summary = "Xác thực email", description = "Xác thực email bằng mã trong liên kết đã gửi tới hộp thư")
    public ResponseEntity<ApiResponse<Map<String, String>>> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        String email = authService.verifyEmail(request.token());
        return ResponseEntity.ok(ApiResponse.success("Xác thực email thành công. Bạn có thể đăng nhập ngay bây giờ",
                Map.of("email", email)));
    }

    @PostMapping("/resend-verification")
    @Operation(summary = "Gửi lại email xác thực", description = "Luôn trả về thành công để không lộ email nào đã đăng ký")
    public ResponseEntity<ApiResponse<Void>> resendVerification(@Valid @RequestBody ResendVerificationRequest request) {
        authService.resendVerificationEmail(request.email());
        return ResponseEntity.ok(ApiResponse.success(
                "Nếu email đã đăng ký và chưa được xác thực, chúng tôi đã gửi lại liên kết xác thực", null));
    }

    @GetMapping("/providers")
    @Operation(summary = "Phương thức đăng nhập khả dụng", description = "Cho biết đăng nhập Google có được bật và Client ID công khai")
    public ResponseEntity<ApiResponse<AuthProvidersResponse>> providers() {
        return ResponseEntity.ok(ApiResponse.success(authService.getProviders()));
    }

    @PostMapping("/google")
    @Operation(summary = "Đăng nhập bằng Google", description = "Gửi Google ID token; trả về token đăng nhập hoặc yêu cầu bổ sung hồ sơ bệnh nhân")
    public ResponseEntity<ApiResponse<GoogleAuthResult>> googleLogin(@Valid @RequestBody GoogleLoginRequest request) {
        GoogleAuthResult result = authService.googleLogin(request.credential());
        return ResponseEntity.ok(ApiResponse.success(
                result.profileRequired() ? "Vui lòng bổ sung thông tin hồ sơ để hoàn tất đăng ký" : "Đăng nhập thành công", result));
    }

    @PostMapping("/google/register")
    @Operation(summary = "Đăng ký bằng Google", description = "Hoàn tất hồ sơ bệnh nhân cho lần đầu đăng nhập bằng Google")
    public ResponseEntity<ApiResponse<AuthResponse>> googleRegister(@Valid @RequestBody GoogleRegisterRequest request) {
        AuthResponse response = authService.googleRegister(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Đăng ký tài khoản thành công", response));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Làm mới Access Token", description = "Gửi refresh token hợp lệ để nhận access token mới")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(@RequestBody Map<String, String> request) {
        String token = request.get("refreshToken");
        AuthResponse response = authService.refreshToken(token);
        return ResponseEntity.ok(ApiResponse.success("Làm mới token thành công", response));
    }

    @GetMapping("/me")
    @Operation(summary = "Lấy thông tin người dùng hiện tại", description = "Trả về thông tin chi tiết, roles và permissions của phiên đăng nhập hiện tại")
    public ResponseEntity<ApiResponse<AuthResponse>> getMe() {
        AuthResponse response = authService.getCurrentUserInfo();
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
