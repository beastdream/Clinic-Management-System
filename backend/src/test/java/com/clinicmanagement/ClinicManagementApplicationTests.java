package com.clinicmanagement;

import com.clinicmanagement.auth.dto.AuthResponse;
import com.clinicmanagement.auth.dto.LoginRequest;
import com.clinicmanagement.auth.service.AuthService;
import com.clinicmanagement.common.controller.HealthController;
import com.clinicmanagement.common.response.ApiResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("dev")
class ClinicManagementApplicationTests {

    @Autowired
    private HealthController healthController;

    @Autowired
    private AuthService authService;

    @Test
    @DisplayName("Application context khởi tạo thành công")
    void contextLoads() {
        assertThat(healthController).isNotNull();
        assertThat(authService).isNotNull();
    }

    @Test
    @DisplayName("Health check endpoint trả về trạng thái UP và kết nối MySQL thành công")
    void healthCheckReturnsUpAndConnected() {
        ResponseEntity<ApiResponse<Map<String, Object>>> response = healthController.checkHealth();

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isTrue();

        Map<String, Object> data = response.getBody().getData();
        assertThat(data.get("status")).isEqualTo("UP");
        assertThat(data.get("version")).isEqualTo("1.0.0");

        @SuppressWarnings("unchecked")
        Map<String, Object> dbInfo = (Map<String, Object>) data.get("database");
        assertThat(dbInfo.get("status")).isEqualTo("CONNECTED");
    }

    @Test
    @DisplayName("Đăng nhập tài khoản admin mặc định thành công và sinh JWT token hợp lệ")
    void defaultAdminLoginSuccess() {
        LoginRequest request = LoginRequest.builder()
                .username("admin")
                .password("Admin@123456")
                .build();

        AuthResponse authResponse = authService.login(request);

        assertThat(authResponse).isNotNull();
        assertThat(authResponse.getAccessToken()).isNotBlank();
        assertThat(authResponse.getUsername()).isEqualTo("admin");
        assertThat(authResponse.getRoles()).contains("ROLE_ADMIN");
    }
}
