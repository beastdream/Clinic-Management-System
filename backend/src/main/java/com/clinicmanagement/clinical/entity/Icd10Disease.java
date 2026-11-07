package com.clinicmanagement.clinical.entity;

import com.clinicmanagement.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "icd10_diseases")
public class Icd10Disease extends BaseEntity {

    @Column(name = "code", length = 20, nullable = false, unique = true)
    private String code;

    @Column(name = "name_vi", length = 255, nullable = false)
    private String nameVi;

    @Column(name = "name_en", length = 255)
    private String nameEn;

    @Column(name = "chapter", length = 50)
    private String chapter;

    @Column(name = "is_common", nullable = false)
    private Boolean common = true;

    public Icd10Disease() {
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getNameVi() {
        return nameVi;
    }

    public void setNameVi(String nameVi) {
        this.nameVi = nameVi;
    }

    public String getNameEn() {
        return nameEn;
    }

    public void setNameEn(String nameEn) {
        this.nameEn = nameEn;
    }

    public String getChapter() {
        return chapter;
    }

    public void setChapter(String chapter) {
        this.chapter = chapter;
    }

    public Boolean getCommon() {
        return common;
    }

    public void setCommon(Boolean common) {
        this.common = common;
    }
}

