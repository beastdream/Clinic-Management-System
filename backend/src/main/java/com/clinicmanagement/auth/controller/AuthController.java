package com.clinicmanagement.auth.controller;

import com.clinicmanagement.auth.dto.AuthResponse;
import com.clinicmanagement.auth.dto.LoginRequest;
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
