package com.clinicmanagement;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

import java.util.TimeZone;

@SpringBootApplication
@EnableJpaAuditing
public class ClinicManagementApplication {

    public static void main(String[] args) {
        // Cố định múi giờ UTC cho JVM để đảm bảo toàn vẹn thời gian lưu trữ cơ sở dữ liệu
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
        SpringApplication.run(ClinicManagementApplication.class, args);
    }
}
