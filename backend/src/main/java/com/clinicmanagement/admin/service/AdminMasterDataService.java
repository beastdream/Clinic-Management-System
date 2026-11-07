package com.clinicmanagement.admin.service;

import com.clinicmanagement.admin.dto.MasterDataDtos.*;
import com.clinicmanagement.audit.entity.AuditLog;
import com.clinicmanagement.audit.repository.AuditLogRepository;
import com.clinicmanagement.clinic.entity.Room;
import com.clinicmanagement.clinic.entity.ServiceItem;
import com.clinicmanagement.clinic.entity.ServicePrice;
import com.clinicmanagement.clinic.entity.Specialty;
import com.clinicmanagement.clinic.repository.ClinicRepository;
import com.clinicmanagement.clinic.repository.RoomRepository;
import com.clinicmanagement.clinic.repository.ServiceItemRepository;
import com.clinicmanagement.clinic.repository.ServicePriceRepository;
import com.clinicmanagement.clinic.repository.SpecialtyRepository;
import com.clinicmanagement.common.exception.BusinessException;
import com.clinicmanagement.common.exception.ErrorCode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminMasterDataService {

    private final SpecialtyRepository specialtyRepository;
    private final RoomRepository roomRepository;
    private final ServiceItemRepository serviceItemRepository;
    private final ServicePriceRepository servicePriceRepository;
    private final ClinicRepository clinicRepository;
    private final AuditLogRepository auditLogRepository;

    public AdminMasterDataService(SpecialtyRepository specialtyRepository,
                                  RoomRepository roomRepository,
                                  ServiceItemRepository serviceItemRepository,
                                  ServicePriceRepository servicePriceRepository,
                                  ClinicRepository clinicRepository,
                                  AuditLogRepository auditLogRepository) {
        this.specialtyRepository = specialtyRepository;
        this.roomRepository = roomRepository;
        this.serviceItemRepository = serviceItemRepository;
        this.servicePriceRepository = servicePriceRepository;
        this.clinicRepository = clinicRepository;
        this.auditLogRepository = auditLogRepository;
    }

    // ==================== 1. CHUYÊN KHOA (SPECIALTIES) ====================
    @Transactional(readOnly = true)
    public List<Specialty> getAllSpecialties() {
        return specialtyRepository.findAll();
    }

    @Transactional
    public Specialty createSpecialty(CreateSpecialtyRequest req, String adminUsername) {
        if (specialtyRepository.findByCode(req.code().trim().toUpperCase()).isPresent()) {
            throw new BusinessException(ErrorCode.CONFLICT, "Mã chuyên khoa [" + req.code() + "] đã tồn tại");
        }

        Specialty sp = new Specialty();
        sp.setCode(req.code().trim().toUpperCase());
        sp.setName(req.name().trim());
        sp.setDescription(req.description() != null ? req.description().trim() : null);
        sp.setActive(req.active() != null ? req.active() : true);
        Specialty saved = specialtyRepository.save(sp);

        recordAudit(adminUsername, "CREATE", "specialties", saved.getId(), "Tạo chuyên khoa: " + saved.getName());
        return saved;
    }

    @Transactional
    public Specialty updateSpecialty(String id, UpdateSpecialtyRequest req, String adminUsername) {
        Specialty sp = specialtyRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy chuyên khoa"));

        sp.setName(req.name().trim());
        sp.setDescription(req.description() != null ? req.description().trim() : null);
        if (req.active() != null) {
            sp.setActive(req.active());
        }
        Specialty saved = specialtyRepository.save(sp);
        recordAudit(adminUsername, "UPDATE", "specialties", saved.getId(), "Cập nhật chuyên khoa: " + saved.getName());
        return saved;
    }

    @Transactional
    public Specialty toggleSpecialty(String id, String adminUsername) {
        Specialty sp = specialtyRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy chuyên khoa"));
        sp.setActive(!sp.isActive());
        Specialty saved = specialtyRepository.save(sp);
        recordAudit(adminUsername, "UPDATE", "specialties", saved.getId(), "Đổi trạng thái chuyên khoa: " + (saved.isActive() ? "Kích hoạt" : "Ngưng"));
        return saved;
    }

    // ==================== 2. PHÒNG KHÁM (ROOMS) ====================
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAllRooms() {
        List<Room> rooms = roomRepository.findAll();
        Map<String, String> specNames = specialtyRepository.findAll().stream()
                .collect(Collectors.toMap(Specialty::getId, Specialty::getName, (a, b) -> a));

        return rooms.stream().map(r -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", r.getId());
            map.put("code", r.getCode());
            map.put("name", r.getName());
            map.put("roomType", r.getRoomType());
            map.put("active", r.isActive());
            map.put("specialtyId", r.getSpecialtyId());
            map.put("specialtyName", r.getSpecialtyId() != null ? specNames.getOrDefault(r.getSpecialtyId(), "—") : "—");
            map.put("createdAt", r.getCreatedAt());
            return map;
        }).collect(Collectors.toList());
    }

    @Transactional
    public Room createRoom(CreateRoomRequest req, String adminUsername) {
        if (roomRepository.findByCode(req.code().trim().toUpperCase()).isPresent()) {
            throw new BusinessException(ErrorCode.CONFLICT, "Mã phòng [" + req.code() + "] đã tồn tại");
        }

        String clinicId = clinicRepository.findAll().stream().findFirst()
                .map(c -> c.getId())
                .orElse("00000000-0000-0000-0003-000000000001");

        Room room = new Room();
        room.setClinicId(clinicId);
        room.setCode(req.code().trim().toUpperCase());
        room.setName(req.name().trim());
        room.setRoomType(req.roomType().trim().toUpperCase());
        room.setSpecialtyId(req.specialtyId() != null && !req.specialtyId().isBlank() ? req.specialtyId() : null);
        room.setActive(req.active() != null ? req.active() : true);
        Room saved = roomRepository.save(room);

        recordAudit(adminUsername, "CREATE", "rooms", saved.getId(), "Tạo phòng: " + saved.getName());
        return saved;
    }

    @Transactional
    public Room updateRoom(String id, UpdateRoomRequest req, String adminUsername) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy phòng"));

        room.setName(req.name().trim());
        room.setRoomType(req.roomType().trim().toUpperCase());
        room.setSpecialtyId(req.specialtyId() != null && !req.specialtyId().isBlank() ? req.specialtyId() : null);
        if (req.active() != null) {
            room.setActive(req.active());
        }
        Room saved = roomRepository.save(room);
        recordAudit(adminUsername, "UPDATE", "rooms", saved.getId(), "Cập nhật phòng: " + saved.getName());
        return saved;
    }

    @Transactional
    public Room toggleRoom(String id, String adminUsername) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy phòng"));
        room.setActive(!room.isActive());
        Room saved = roomRepository.save(room);
        recordAudit(adminUsername, "UPDATE", "rooms", saved.getId(), "Đổi trạng thái phòng: " + (saved.isActive() ? "Kích hoạt" : "Ngưng"));
        return saved;
    }

    // ==================== 3. DỊCH VỤ & BẢNG GIÁ (SERVICES & PRICES) ====================
    @Transactional(readOnly = true)
    public List<AdminServiceItemDto> getAllServices() {
        List<ServiceItem> services = serviceItemRepository.findAll();
        Map<String, String> specNames = specialtyRepository.findAll().stream()
                .collect(Collectors.toMap(Specialty::getId, Specialty::getName, (a, b) -> a));

        List<ServicePrice> allPrices = servicePriceRepository.findAll();

        return services.stream().map(s -> {
            BigDecimal price = allPrices.stream()
                    .filter(p -> p.getServiceId().equals(s.getId()) && p.isActive())
                    .max(Comparator.comparing(ServicePrice::getEffectiveFrom))
                    .map(ServicePrice::getPrice)
                    .orElse(BigDecimal.ZERO);

            String specName = s.getSpecialtyId() != null ? specNames.getOrDefault(s.getSpecialtyId(), "—") : "Đa khoa";

            return new AdminServiceItemDto(
                    s.getId(),
                    s.getCode(),
                    s.getName(),
                    s.getServiceType(),
                    s.getDescription(),
                    s.isActive(),
                    s.getSpecialtyId(),
                    specName,
                    price
            );
        }).collect(Collectors.toList());
    }

    @Transactional
    public AdminServiceItemDto createService(CreateServiceItemRequest req, String adminUsername) {
        if (serviceItemRepository.findByCode(req.code().trim().toUpperCase()).isPresent()) {
            throw new BusinessException(ErrorCode.CONFLICT, "Mã dịch vụ [" + req.code() + "] đã tồn tại");
        }

        ServiceItem item = new ServiceItem();
        item.setCode(req.code().trim().toUpperCase());
        item.setName(req.name().trim());
        item.setServiceType(req.serviceType().trim().toUpperCase());
        item.setSpecialtyId(req.specialtyId() != null && !req.specialtyId().isBlank() ? req.specialtyId() : null);
        item.setDescription(req.description() != null ? req.description().trim() : null);
        item.setActive(req.active() != null ? req.active() : true);
        ServiceItem savedItem = serviceItemRepository.save(item);

        // Lưu bảng giá có hiệu lực
        ServicePrice price = new ServicePrice();
        price.setServiceId(savedItem.getId());
        price.setPrice(req.price());
        price.setEffectiveFrom(Instant.now());
        price.setActive(true);
        price.setNotes("Bảng giá khởi tạo ban đầu");
        servicePriceRepository.save(price);

        recordAudit(adminUsername, "CREATE", "services", savedItem.getId(), "Tạo dịch vụ: " + savedItem.getName() + " - Giá: " + req.price());

        String specName = savedItem.getSpecialtyId() != null
                ? specialtyRepository.findById(savedItem.getSpecialtyId()).map(Specialty::getName).orElse("—")
                : "Đa khoa";

        return new AdminServiceItemDto(
                savedItem.getId(),
                savedItem.getCode(),
                savedItem.getName(),
                savedItem.getServiceType(),
                savedItem.getDescription(),
                savedItem.isActive(),
                savedItem.getSpecialtyId(),
                specName,
                req.price()
        );
    }

    @Transactional
    public AdminServiceItemDto updateService(String id, UpdateServiceItemRequest req, String adminUsername) {
        ServiceItem item = serviceItemRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy dịch vụ"));

        item.setName(req.name().trim());
        item.setServiceType(req.serviceType().trim().toUpperCase());
        item.setSpecialtyId(req.specialtyId() != null && !req.specialtyId().isBlank() ? req.specialtyId() : null);
        item.setDescription(req.description() != null ? req.description().trim() : null);
        if (req.active() != null) {
            item.setActive(req.active());
        }
        ServiceItem savedItem = serviceItemRepository.save(item);

        // Kiểm tra xem đơn giá có thay đổi không
        Optional<ServicePrice> latestPriceOpt = servicePriceRepository.findAll().stream()
                .filter(p -> p.getServiceId().equals(id) && p.isActive())
                .max(Comparator.comparing(ServicePrice::getEffectiveFrom));

        if (latestPriceOpt.isEmpty() || latestPriceOpt.get().getPrice().compareTo(req.price()) != 0) {
            // Đóng bảng giá cũ
            latestPriceOpt.ifPresent(p -> {
                p.setEffectiveTo(Instant.now());
                p.setActive(false);
                servicePriceRepository.save(p);
            });

            // Tạo bảng giá mới có hiệu lực
            ServicePrice newPrice = new ServicePrice();
            newPrice.setServiceId(id);
            newPrice.setPrice(req.price());
            newPrice.setEffectiveFrom(Instant.now());
            newPrice.setActive(true);
            newPrice.setNotes("Điều chỉnh giá bởi quản trị viên");
            servicePriceRepository.save(newPrice);
        }

        recordAudit(adminUsername, "UPDATE", "services", savedItem.getId(), "Cập nhật dịch vụ: " + savedItem.getName() + " - Giá: " + req.price());

        String specName = savedItem.getSpecialtyId() != null
                ? specialtyRepository.findById(savedItem.getSpecialtyId()).map(Specialty::getName).orElse("—")
                : "Đa khoa";

        return new AdminServiceItemDto(
                savedItem.getId(),
                savedItem.getCode(),
                savedItem.getName(),
                savedItem.getServiceType(),
                savedItem.getDescription(),
                savedItem.isActive(),
                savedItem.getSpecialtyId(),
                specName,
                req.price()
        );
    }

    private void recordAudit(String username, String action, String entityName, String entityId, String details) {
        try {
            AuditLog log = new AuditLog();
            log.setUsername(username != null ? username : "admin");
            log.setRoleName("ROLE_ADMIN");
            log.setAction(action);
            log.setEntityName(entityName);
            log.setEntityId(entityId);
            log.setNewValues("{\"details\":\"" + details + "\"}");
            auditLogRepository.save(log);
        } catch (Exception ignored) {}
    }
}

