package tn.maw3ed.api.modules.appointment.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.maw3ed.api.core.exception.BusinessException;
import tn.maw3ed.api.core.exception.ResourceNotFoundException;
import tn.maw3ed.api.core.exception.SlotAlreadyBookedException;
import tn.maw3ed.api.modules.appointment.dto.BookAppointmentRequest;
import tn.maw3ed.api.modules.appointment.dto.GenerateSlotsRequest;
import tn.maw3ed.api.modules.appointment.dto.UpdateSlotRequest;
import tn.maw3ed.api.modules.appointment.model.*;
import tn.maw3ed.api.modules.appointment.repository.AppointmentRepository;
import tn.maw3ed.api.modules.appointment.repository.AvailabilitySlotRepository;
import tn.maw3ed.api.modules.doctor.model.DoctorProfile;
import tn.maw3ed.api.modules.doctor.repository.DoctorProfileRepository;
import tn.maw3ed.api.modules.iam.model.User;
import tn.maw3ed.api.modules.iam.repository.UserRepository;
import tn.maw3ed.api.modules.payment.model.PaymentMethod;
import tn.maw3ed.api.modules.payment.model.PaymentStatus;
import tn.maw3ed.api.modules.payment.model.PaymentTransaction;
import tn.maw3ed.api.modules.payment.repository.PaymentTransactionRepository;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AppointmentBookingService {

    private final MongoTemplate mongoTemplate;
    private final AvailabilitySlotRepository slotRepository;
    private final AppointmentRepository appointmentRepository;
    private final DoctorProfileRepository doctorProfileRepository;
    private final UserRepository userRepository;
    private final PaymentTransactionRepository paymentRepository;

    public List<AvailabilitySlot> getAvailableSlots(String doctorId, Instant start, Instant end) {
        return slotRepository.findByDoctorIdAndStartTimeBetweenAndStatusOrderByStartTimeAsc(
                doctorId, start, end, SlotStatus.AVAILABLE);
    }

    public List<AvailabilitySlot> getDoctorAllSlots(String doctorId, Instant start, Instant end) {
        return slotRepository.findByDoctorIdAndStartTimeBetweenOrderByStartTimeAsc(doctorId, start, end);
    }

    @Transactional
    public void deleteSlot(String doctorId, String slotId) {
        AvailabilitySlot slot = slotRepository.findById(slotId)
                .orElseThrow(() -> new ResourceNotFoundException("Créneau introuvable"));

        if (!slot.getDoctorId().equals(doctorId)) {
            throw new BusinessException("Vous n'êtes pas autorisé à supprimer ce créneau.");
        }

        if (slot.getStatus() == SlotStatus.BOOKED) {
            throw new BusinessException("Impossible de supprimer un créneau déjà réservé par un patient.");
        }

        slotRepository.delete(slot);
    }

    @Transactional
    public AvailabilitySlot updateSlot(String doctorId, String slotId, UpdateSlotRequest request) {
        AvailabilitySlot slot = slotRepository.findById(slotId)
                .orElseThrow(() -> new ResourceNotFoundException("Créneau introuvable"));

        if (!slot.getDoctorId().equals(doctorId)) {
            throw new BusinessException("Vous n'êtes pas autorisé à modifier ce créneau.");
        }

        if (slot.getStatus() == SlotStatus.BOOKED) {
            throw new BusinessException("Impossible de modifier les horaires d'un créneau déjà réservé par un patient.");
        }

        if (!request.getStartTime().isBefore(request.getEndTime())) {
            throw new BusinessException("L'heure de début doit précéder l'heure de fin.");
        }

        slot.setStartTime(request.getStartTime());
        slot.setEndTime(request.getEndTime());
        slot.setConsultationType(request.getConsultationType());

        return slotRepository.save(slot);
    }

    public List<AvailabilitySlot> generateSlots(String doctorId, GenerateSlotsRequest request) {
        DoctorProfile doctor = doctorProfileRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Médecin non trouvé"));

        List<AvailabilitySlot> generated = new ArrayList<>();
        Instant current = request.getStartDateTime();
        Duration step = Duration.ofMinutes(request.getDurationMinutes());

        while (current.plus(step).isBefore(request.getEndDateTime()) || current.plus(step).equals(request.getEndDateTime())) {
            Instant next = current.plus(step);
            AvailabilitySlot slot = AvailabilitySlot.builder()
                    .doctorId(doctor.getId())
                    .startTime(current)
                    .endTime(next)
                    .status(SlotStatus.AVAILABLE)
                    .consultationType(request.getConsultationType())
                    .build();
            generated.add(slot);
            current = next;
        }

        return slotRepository.saveAll(generated);
    }

    @Transactional
    public Appointment bookSlotAtomically(String patientId, BookAppointmentRequest request) {
        // 1. Verrouillage atomique du créneau dans MongoDB
        Query query = new Query(Criteria.where("_id").is(request.getSlotId())
                .and("status").is(SlotStatus.AVAILABLE));

        Update update = new Update()
                .set("status", SlotStatus.BOOKED)
                .set("bookedByPatientId", patientId);

        AvailabilitySlot slot = mongoTemplate.findAndModify(
                query, update,
                FindAndModifyOptions.options().returnNew(true),
                AvailabilitySlot.class
        );

        if (slot == null) {
            throw new SlotAlreadyBookedException("Ce créneau n'est plus disponible ou a été réservé à l'instant.");
        }

        // 2. Récupération des snapshots immuables
        DoctorProfile doctor = doctorProfileRepository.findById(slot.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Médecin introuvable"));
        User doctorUser = userRepository.findById(doctor.getUserId()).orElse(null);
        User patientUser = userRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient introuvable"));

        String doctorName = doctorUser != null ? "Dr. " + doctorUser.getFirstName() + " " + doctorUser.getLastName() : "Médecin";
        String primarySpecialty = doctor.getSpecialties().isEmpty() ? "Généraliste" : doctor.getSpecialties().get(0);
        Double fee = request.getType() == ConsultationType.TELECONSULTATION
                ? doctor.getConsultationFee().getTeleconsultation()
                : doctor.getConsultationFee().getInPerson();

        String cabinetAddress = "";
        Double latitude = null;
        Double longitude = null;
        if (doctor.getAddress() != null) {
            java.util.List<String> addrParts = new java.util.ArrayList<>();
            if (doctor.getAddress().getStreet() != null && !doctor.getAddress().getStreet().isBlank()) {
                addrParts.add(doctor.getAddress().getStreet().trim());
            }
            if (doctor.getAddress().getCity() != null && !doctor.getAddress().getCity().isBlank()) {
                addrParts.add(doctor.getAddress().getCity().trim());
            }
            if (doctor.getAddress().getGovernorate() != null && !doctor.getAddress().getGovernorate().isBlank()) {
                addrParts.add(doctor.getAddress().getGovernorate().trim());
            }
            cabinetAddress = String.join(", ", addrParts);

            if (doctor.getAddress().getLocation() != null && doctor.getAddress().getLocation().getCoordinates() != null
                    && doctor.getAddress().getLocation().getCoordinates().size() >= 2) {
                longitude = doctor.getAddress().getLocation().getCoordinates().get(0);
                latitude = doctor.getAddress().getLocation().getCoordinates().get(1);
            }
        }

        Appointment.DoctorSnapshot doctorSnapshot = Appointment.DoctorSnapshot.builder()
                .fullName(doctorName)
                .specialty(primarySpecialty)
                .cabinetAddress(cabinetAddress)
                .latitude(latitude)
                .longitude(longitude)
                .fee(fee)
                .build();

        Appointment.PatientSnapshot patientSnapshot = Appointment.PatientSnapshot.builder()
                .fullName(patientUser.getFirstName() + " " + patientUser.getLastName())
                .phoneNumber(patientUser.getPhoneNumber())
                .email(patientUser.getEmail())
                .build();

        Appointment.TeleconsultationSession session = null;
        if (request.getType() == ConsultationType.TELECONSULTATION) {
            session = Appointment.TeleconsultationSession.builder()
                    .roomName("maw3ed-" + UUID.randomUUID())
                    .build();
        }

        // 3. Statut initial et règle de paiement :
        // - Téléconsultation -> Paiement obligatoirement en ligne (Statut PENDING_PAYMENT jusqu'au règlement CB/Konnect)
        // - Consultation en Cabinet -> Paiement direct en espèces sur place au cabinet médical
        boolean isTeleconsultation = request.getType() == ConsultationType.TELECONSULTATION;
        AppointmentStatus initialStatus = isTeleconsultation ? AppointmentStatus.PENDING_PAYMENT : AppointmentStatus.CONFIRMED;
        PaymentStatus initialPaymentStatus = isTeleconsultation ? PaymentStatus.PENDING : PaymentStatus.PENDING;
        PaymentMethod initialPaymentMethod = isTeleconsultation ? null : PaymentMethod.CASH_AT_CABINET;

        Appointment appointment = Appointment.builder()
                .slotId(slot.getId())
                .doctorId(doctor.getId())
                .patientId(patientId)
                .type(request.getType())
                .status(initialStatus)
                .paymentStatus(initialPaymentStatus)
                .paymentMethod(initialPaymentMethod)
                .scheduledStartTime(slot.getStartTime())
                .scheduledEndTime(slot.getEndTime())
                .doctorSnapshot(doctorSnapshot)
                .patientSnapshot(patientSnapshot)
                .teleconsultationSession(session)
                .build();

        Appointment savedAppointment = appointmentRepository.save(appointment);

        // Si téléconsultation, pré-générer la transaction de paiement en attente
        if (isTeleconsultation) {
            double commission = Math.round((fee * 0.10) * 100.0) / 100.0;
            double netDoctor = Math.round((fee - commission) * 100.0) / 100.0;

            PaymentTransaction tx = PaymentTransaction.builder()
                    .appointmentId(savedAppointment.getId())
                    .patientId(patientId)
                    .doctorId(doctor.getId())
                    .amount(fee)
                    .currency("TND")
                    .platformCommission(commission)
                    .doctorNetRevenue(netDoctor)
                    .paymentMethod(null)
                    .status(PaymentStatus.PENDING)
                    .transactionReference("MWD-TX-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                    .build();

            PaymentTransaction savedTx = paymentRepository.save(tx);
            savedAppointment.setPaymentId(savedTx.getId());
            savedAppointment = appointmentRepository.save(savedAppointment);
        }

        log.info("Rendez-vous {} créé avec statut {} et statut paiement {}",
                savedAppointment.getId(), initialStatus, initialPaymentStatus);
        return savedAppointment;
    }

    @Transactional
    public Appointment cancelAppointment(String appointmentId, String userId, String reason) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Rendez-vous non trouvé"));

        if (!appointment.getPatientId().equals(userId)) {
            DoctorProfile doctorProfile = doctorProfileRepository.findByUserId(userId).orElse(null);
            if (doctorProfile == null || !doctorProfile.getId().equals(appointment.getDoctorId())) {
                throw new BusinessException("Vous n'êtes pas autorisé à annuler ce rendez-vous.");
            }
        }

        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new BusinessException("Ce rendez-vous est déjà annulé.");
        }

        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointment.setCancellationReason(reason);
        if (appointment.getPaymentStatus() == PaymentStatus.PENDING) {
            appointment.setPaymentStatus(PaymentStatus.FAILED);
        }
        appointmentRepository.save(appointment);

        if (appointment.getPaymentId() != null) {
            paymentRepository.findById(appointment.getPaymentId()).ifPresent(tx -> {
                if (tx.getStatus() == PaymentStatus.PENDING) {
                    tx.setStatus(PaymentStatus.FAILED);
                    paymentRepository.save(tx);
                }
            });
        }

        // Libération du créneau
        Query query = new Query(Criteria.where("_id").is(appointment.getSlotId()));
        Update update = new Update()
                .set("status", SlotStatus.AVAILABLE)
                .set("bookedByPatientId", null);
        mongoTemplate.updateFirst(query, update, AvailabilitySlot.class);

        return appointment;
    }

    @Transactional
    public Appointment completeAppointment(String appointmentId, String doctorUserId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Rendez-vous introuvable"));

        DoctorProfile doctorProfile = doctorProfileRepository.findByUserId(doctorUserId)
                .orElseThrow(() -> new BusinessException("Profil praticien introuvable"));

        if (!doctorProfile.getId().equals(appointment.getDoctorId())) {
            throw new BusinessException("Vous n'êtes pas autorisé à modifier ce rendez-vous.");
        }

        appointment.setStatus(AppointmentStatus.COMPLETED);
        // Si consultation en cabinet, le médecin valide l'encaissement en espèces sur place
        if (appointment.getType() == ConsultationType.IN_PERSON) {
            appointment.setPaymentStatus(PaymentStatus.PAID);
            appointment.setPaymentMethod(PaymentMethod.CASH_AT_CABINET);
            if (appointment.getDoctorSnapshot() != null && appointment.getDoctorSnapshot().getFee() != null) {
                appointment.setAmountPaid(appointment.getDoctorSnapshot().getFee());
            }
        }
        return appointmentRepository.save(appointment);
    }

    public Page<Appointment> getPatientAppointments(String patientId, Pageable pageable) {
        return appointmentRepository.findByPatientIdOrderByScheduledStartTimeDesc(patientId, pageable);
    }

    public Page<Appointment> getDoctorAppointments(String doctorId, Pageable pageable) {
        return appointmentRepository.findByDoctorIdOrderByScheduledStartTimeDesc(doctorId, pageable);
    }
}
