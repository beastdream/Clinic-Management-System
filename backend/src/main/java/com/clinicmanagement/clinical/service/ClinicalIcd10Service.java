package com.clinicmanagement.clinical.service;

import com.clinicmanagement.clinical.dto.DoctorPillarDtos.Icd10DiseaseDto;
import com.clinicmanagement.clinical.entity.Icd10Disease;
import com.clinicmanagement.clinical.repository.Icd10DiseaseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class ClinicalIcd10Service {

    private final Icd10DiseaseRepository diseaseRepository;

    public ClinicalIcd10Service(Icd10DiseaseRepository diseaseRepository) {
        this.diseaseRepository = diseaseRepository;
    }

    public List<Icd10DiseaseDto> getCommonDiseases() {
        return diseaseRepository.findByCommonTrueOrderByCodeAsc().stream()
                .map(this::mapToDto)
                .toList();
    }

    public List<Icd10DiseaseDto> searchDiseases(String keyword) {
        if (keyword == null || keyword.trim().isBlank()) {
            return getCommonDiseases();
        }
        return diseaseRepository.searchDiseases(keyword.trim()).stream()
                .map(this::mapToDto)
                .toList();
    }

    private Icd10DiseaseDto mapToDto(Icd10Disease d) {
        return new Icd10DiseaseDto(
                d.getId(),
                d.getCode(),
                d.getNameVi(),
                d.getNameEn(),
                d.getChapter(),
                d.getCommon()
        );
    }
}

