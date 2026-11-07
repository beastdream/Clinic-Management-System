package com.clinicmanagement.admin.repository;

import com.clinicmanagement.admin.entity.SystemSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SystemSettingRepository extends JpaRepository<SystemSetting, String> {

    Optional<SystemSetting> findBySettingKey(String settingKey);

    List<SystemSetting> findBySettingGroup(String settingGroup);

    boolean existsBySettingKey(String settingKey);
}

