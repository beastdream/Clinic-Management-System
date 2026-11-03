package com.clinicmanagement.user.repository;

import com.clinicmanagement.user.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, String> {

    Optional<Role> findByCode(String code);

    boolean existsByCode(String code);
}
