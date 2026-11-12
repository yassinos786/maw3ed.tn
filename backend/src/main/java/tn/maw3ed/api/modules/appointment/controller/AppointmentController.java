package tn.maw3ed.api.modules.appointment.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import tn.maw3ed.api.modules.appointment.dto.BookAppointmentRequest;
import tn.maw3ed.api.modules.appointment.dto.GenerateSlotsRequest;
import tn.maw3ed.api.modules.appointment.dto.UpdateSlotRequest;
import tn.maw3ed.api.modules.appointment.model.Appointment;
import tn.maw3ed.api.modules.appointment.model.AvailabilitySlot;
import tn.maw3ed.api.modules.appointment.service.AppointmentBookingService;
import tn.maw3ed.api.modules.doctor.model.DoctorProfile;
import tn.maw3ed.api.modules.doctor.service.DoctorProfileService;
import tn.maw3ed.api.security.user.UserPrincipal;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/v1/appointments")
@RequiredArgsConstructor
@Tag(name = "Rendez-vous & Disponibilités", description = "Gestion des créneaux, réservation atomique et annulation de consultations")
public class AppointmentController {

    private final AppointmentBookingService appointmentBookingService;
    private final DoctorProfileService doctorProfileService;

    @GetMapping("/doctors/{doctorId}/slots")
    @Operation(summary = "Consulter les créneaux disponibles d'un médecin")
    public ResponseEntity<List<AvailabilitySlot>> getDoctorSlots(
            @PathVariable String doctorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant end) {
        return ResponseEntity.ok(appointmentBookingService.getAvailableSlots(doctorId, start, end));
    }

    @GetMapping("/doctors/me/slots")
    @PreAuthorize("hasRole('DOCTOR')")
    @Operation(summary = "Consulter l'ensemble de ses créneaux de consultation")
    public ResponseEntity<List<AvailabilitySlot>> getMySlots(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant end) {
        DoctorProfile doctor = doctorProfileService.getProfileByUserId(currentUser.getId());
        Instant s = start != null ? start : Instant.now().minus(java.time.Duration.ofDays(1));
        Instant e = end != null ? end : Instant.now().plus(java.time.Duration.ofDays(30));
        return ResponseEntity.ok(appointmentBookingService.getDoctorAllSlots(doctor.getId(), s, e));
    }

    @DeleteMapping("/doctors/me/slots/{slotId}")
    @PreAuthorize("hasRole('DOCTOR')")
    @Operation(summary = "Supprimer un créneau non réservé")
    public ResponseEntity<Void> deleteMySlot(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable String slotId) {
        DoctorProfile doctor = doctorProfileService.getProfileByUserId(currentUser.getId());
        appointmentBookingService.deleteSlot(doctor.getId(), slotId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/doctors/me/slots/{slotId}")
    @PreAuthorize("hasRole('DOCTOR')")
    @Operation(summary = "Modifier les horaires ou le type d'un créneau")
    public ResponseEntity<AvailabilitySlot> updateMySlot(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable String slotId,
            @Valid @RequestBody UpdateSlotRequest request) {
        DoctorProfile doctor = doctorProfileService.getProfileByUserId(currentUser.getId());
        return ResponseEntity.ok(appointmentBookingService.updateSlot(doctor.getId(), slotId, request));
    }

    @PostMapping("/doctors/me/slots/bulk")
    @PreAuthorize("hasRole('DOCTOR')")
    @Operation(summary = "Générer une grille de créneaux de consultation")
    public ResponseEntity<List<AvailabilitySlot>> generateSlots(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody GenerateSlotsRequest request) {
        DoctorProfile doctor = doctorProfileService.getProfileByUserId(currentUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(appointmentBookingService.generateSlots(doctor.getId(), request));
    }

    @PatchMapping("/{id}/complete")
    @PreAuthorize("hasRole('DOCTOR')")
    @Operation(summary = "Marquer une consultation comme terminée")
    public ResponseEntity<Appointment> completeAppointment(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable String id) {
        return ResponseEntity.ok(appointmentBookingService.completeAppointment(id, currentUser.getId()));
    }

    @PostMapping("/book")
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Réserver un créneau de consultation (Verrouillage atomique)")
    public ResponseEntity<Appointment> bookSlot(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody BookAppointmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(appointmentBookingService.bookSlotAtomically(currentUser.getId(), request));
    }

    @GetMapping("/me")
    @Operation(summary = "Historique et rendez-vous de l'utilisateur connecté")
    public ResponseEntity<Page<Appointment>> getMyAppointments(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageRequest pageRequest = PageRequest.of(page, size);
        boolean isDoctor = currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_DOCTOR"));

        if (isDoctor) {
            DoctorProfile doctor = doctorProfileService.getProfileByUserId(currentUser.getId());
            return ResponseEntity.ok(appointmentBookingService.getDoctorAppointments(doctor.getId(), pageRequest));
        }
        return ResponseEntity.ok(appointmentBookingService.getPatientAppointments(currentUser.getId(), pageRequest));
    }

    @PatchMapping("/{id}/cancel")
    @Operation(summary = "Annuler un rendez-vous et libérer le créneau")
    public ResponseEntity<Appointment> cancelAppointment(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable String id,
            @RequestParam(defaultValue = "Annulé par l'utilisateur") String reason) {
        return ResponseEntity.ok(appointmentBookingService.cancelAppointment(id, currentUser.getId(), reason));
    }
}
