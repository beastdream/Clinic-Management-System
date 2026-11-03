package com.clinicmanagement.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    private static final String SECURITY_SCHEME_NAME = "Bearer Authentication";

    @Bean
    public OpenAPI clinicManagementOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Clinic Management System REST API")
                        .description("Tài liệu đặc tả RESTful API cho Hệ thống Quản lý Phòng khám Đa khoa / Chuyên khoa")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Đội ngũ Kỹ thuật Clinic Management")
                                .email("dev@clinicmanagement.vn"))
                        .license(new License().name("Proprietary")))
                .addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME_NAME))
                .components(new Components()
                        .addSecuritySchemes(SECURITY_SCHEME_NAME, new SecurityScheme()
                                .name(SECURITY_SCHEME_NAME)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Nhập Bearer Token để xác thực các API có phân quyền")));
    }
}
