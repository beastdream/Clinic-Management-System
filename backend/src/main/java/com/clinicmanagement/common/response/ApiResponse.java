package com.clinicmanagement.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private boolean success;
    private String code;
    private String message;
    private T data;
    private List<ValidationErrorDetail> details;
    private Instant timestamp;

    public ApiResponse() {
    }

    public ApiResponse(boolean success, String code, String message, T data, List<ValidationErrorDetail> details, Instant timestamp) {
        this.success = success;
        this.code = code;
        this.message = message;
        this.data = data;
        this.details = details;
        this.timestamp = timestamp;
    }

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, "SUCCESS", "Thao tác thành công", data, null, Instant.now());
    }

    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<>(true, "SUCCESS", message, data, null, Instant.now());
    }

    public static <T> ApiResponse<T> error(String code, String message) {
        return new ApiResponse<>(false, code, message, null, null, Instant.now());
    }

    public static <T> ApiResponse<T> error(String code, String message, List<ValidationErrorDetail> details) {
        return new ApiResponse<>(false, code, message, null, details, Instant.now());
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public T getData() {
        return data;
    }

    public void setData(T data) {
        this.data = data;
    }

    public List<ValidationErrorDetail> getDetails() {
        return details;
    }

    public void setDetails(List<ValidationErrorDetail> details) {
        this.details = details;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }

    public static class ValidationErrorDetail {
        private String field;
        private String issue;

        public ValidationErrorDetail() {
        }

        public ValidationErrorDetail(String field, String issue) {
            this.field = field;
            this.issue = issue;
        }

        public String getField() {
            return field;
        }

        public void setField(String field) {
            this.field = field;
        }

        public String getIssue() {
            return issue;
        }

        public void setIssue(String issue) {
            this.issue = issue;
        }
    }
}
