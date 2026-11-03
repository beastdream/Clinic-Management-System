package com.clinicmanagement.appointment.repository;

import com.clinicmanagement.appointment.entity.PatientQueue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PatientQueueRepository extends JpaRepository<PatientQueue, String> {

    List<PatientQueue> findByRoomIdAndQueueDateOrderByQueueNumberAsc(String roomId, LocalDate queueDate);

    List<PatientQueue> findByQueueDateAndStatus(LocalDate queueDate, String status);

    Optional<PatientQueue> findByRoomIdAndQueueDateAndQueueNumber(String roomId, LocalDate queueDate, int queueNumber);
}

