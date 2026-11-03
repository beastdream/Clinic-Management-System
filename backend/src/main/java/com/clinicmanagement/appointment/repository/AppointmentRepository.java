package com.clinicmanagement.appointment.repository;

import com.clinicmanagement.appointment.entity.Appointment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, String> {

    Optional<Appointment> findByAppointmentCode(String appointmentCode);

    boolean existsByAppointmentCode(String appointmentCode);

    List<Appointment> findByPatientIdOrderByAppointmentDateDescAppointmentTimeDesc(String patientId);

    List<Appointment> findByDoctorIdAndStatusInOrderByAppointmentDateAscAppointmentTimeAsc(
            String doctorId, java.util.Collection<String> statuses);

    List<Appointment> findByDoctorIdAndAppointmentDate(String doctorId, LocalDate appointmentDate);

    boolean existsByDoctorIdAndAppointmentDateAndAppointmentTimeAndStatusNot(
            String doctorId, LocalDate appointmentDate, LocalTime appointmentTime, String status);

    List<Appointment> findByAppointmentDateOrderByAppointmentTimeAsc(LocalDate appointmentDate);

    Page<Appointment> findByStatus(String status, Pageable pageable);

    Page<Appointment> findByAppointmentDate(LocalDate appointmentDate, Pageable pageable);

    Page<Appointment> findByAppointmentDateAndStatus(LocalDate appointmentDate, String status, Pageable pageable);

    Page<Appointment> findByDoctorId(String doctorId, Pageable pageable);

    Page<Appointment> findByPatientId(String patientId, Pageable pageable);

    long countByAppointmentDate(LocalDate appointmentDate);

    long countByStatusIn(java.util.Collection<String> statuses);

    @org.springframework.data.jpa.repository.Query("SELECT a.status, COUNT(a) FROM Appointment a GROUP BY a.status")
    List<Object[]> countAppointmentsByStatus();

    @org.springframework.data.jpa.repository.Query("SELECT a.appointmentDate, COUNT(a) FROM Appointment a GROUP BY a.appointmentDate ORDER BY a.appointmentDate DESC")
    List<Object[]> countAppointmentsByDate();

    List<Appointment> findTop5ByOrderByCreatedAtDesc();
}
