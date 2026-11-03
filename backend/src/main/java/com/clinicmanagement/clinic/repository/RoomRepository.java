package com.clinicmanagement.clinic.repository;

import com.clinicmanagement.clinic.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomRepository extends JpaRepository<Room, String> {
    List<Room> findByClinicId(String clinicId);
    List<Room> findBySpecialtyId(String specialtyId);
    Optional<Room> findByCode(String code);
}

