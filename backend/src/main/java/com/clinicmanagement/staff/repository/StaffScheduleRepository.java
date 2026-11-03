package com.clinicmanagement.staff.repository;

import com.clinicmanagement.staff.entity.StaffSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface StaffScheduleRepository extends JpaRepository<StaffSchedule, String> {

    List<StaffSchedule> findByStaffIdAndWorkDate(String staffId, LocalDate workDate);

    List<StaffSchedule> findByRoomIdAndWorkDate(String roomId, LocalDate workDate);

    List<StaffSchedule> findByWorkDate(LocalDate workDate);
}
