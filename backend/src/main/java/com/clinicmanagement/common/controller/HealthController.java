package com.clinicmanagement.common.controller;

import com.clinicmanagement.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.lang.management.ManagementFactory;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/health")
@Tag(name = "Health Check", description = "Kiểm tra trạng thái hoạt động của hệ thống và kết nối MySQL")
public class HealthController {

    private static final Logger log = LoggerFactory.getLogger(HealthController.class);

    private final DataSource dataSource;

    @Value("${spring.profiles.active:dev}")
    private String activeProfile;

    public HealthController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @GetMapping
    @Operation(summary = "Kiểm tra sức khỏe hệ thống", description = "Trả về trạng thái hoạt động của backend, thông số kết nối MySQL, múi giờ và thời gian chạy")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkHealth() {
        Map<String, Object> healthInfo = new LinkedHashMap<>();
        healthInfo.put("status", "UP");
        healthInfo.put("service", "Clinic Management System Backend");
        healthInfo.put("version", "1.0.0");
        healthInfo.put("activeProfile", activeProfile);

        // Uptime
        long uptimeMs = ManagementFactory.getRuntimeMXBean().getUptime();
        healthInfo.put("uptimeMs", uptimeMs);
        healthInfo.put("uptimeReadable", (uptimeMs / 1000) + " giây");

        // Timestamps (UTC and Local Asia/Ho_Chi_Minh)
        Instant nowUtc = Instant.now();
        ZonedDateTime nowVn = nowUtc.atZone(ZoneId.of("Asia/Ho_Chi_Minh"));
        healthInfo.put("timestampUtc", nowUtc.toString());
        healthInfo.put("timestampVietnam", nowVn.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));
        healthInfo.put("timezone", "Asia/Ho_Chi_Minh");

        // Database connection probe
        Map<String, Object> dbInfo = new LinkedHashMap<>();
        try (Connection conn = dataSource.getConnection()) {
            DatabaseMetaData metaData = conn.getMetaData();
            dbInfo.put("status", "CONNECTED");
            dbInfo.put("databaseProduct", metaData.getDatabaseProductName());
            dbInfo.put("databaseVersion", metaData.getDatabaseProductVersion());
            dbInfo.put("driverName", metaData.getDriverName());
            dbInfo.put("url", metaData.getURL());
            dbInfo.put("defaultTransactionIsolation", conn.getTransactionIsolation());
        } catch (Exception ex) {
            log.error("Kiểm tra kết nối Database thất bại: {}", ex.getMessage());
            dbInfo.put("status", "DISCONNECTED");
            dbInfo.put("error", ex.getMessage());
            healthInfo.put("status", "DEGRADED");
        }
        healthInfo.put("database", dbInfo);

        return ResponseEntity.ok(ApiResponse.success("Hệ thống hoạt động bình thường", healthInfo));
    }
}
