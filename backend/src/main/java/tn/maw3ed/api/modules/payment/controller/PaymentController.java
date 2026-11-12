package tn.maw3ed.api.modules.payment.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import tn.maw3ed.api.modules.payment.dto.InitiatePaymentRequest;
import tn.maw3ed.api.modules.payment.dto.PaymentReceiptDto;
import tn.maw3ed.api.modules.payment.dto.ProcessPaymentRequest;
import tn.maw3ed.api.modules.payment.model.PaymentTransaction;
import tn.maw3ed.api.modules.payment.service.PaymentService;
import tn.maw3ed.api.security.user.UserPrincipal;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@Tag(name = "Paiements & Tarification", description = "Gestion des transactions de téléconsultation, passerelles tunisiennes et reçus de paiement")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/initiate")
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Initier un paiement de téléconsultation", description = "Crée ou retourne la transaction en attente avec le montant de la consultation")
    public ResponseEntity<PaymentTransaction> initiatePayment(
            @Valid @RequestBody InitiatePaymentRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(paymentService.initiatePayment(request.getAppointmentId(), currentUser.getId(), request.getPaymentMethod()));
    }

    @PostMapping("/{paymentId}/process")
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Valider le paiement en ligne", description = "Confirme la transaction et passe le rendez-vous au statut CONFIRMED")
    public ResponseEntity<PaymentTransaction> processPayment(
            @PathVariable String paymentId,
            @Valid @RequestBody ProcessPaymentRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(paymentService.processPayment(paymentId, currentUser.getId(), request));
    }

    @GetMapping("/appointment/{appointmentId}")
    @Operation(summary = "Consulter le paiement lié à un rendez-vous")
    public ResponseEntity<PaymentTransaction> getPaymentByAppointmentId(@PathVariable String appointmentId) {
        return ResponseEntity.ok(paymentService.getPaymentByAppointmentId(appointmentId));
    }

    @GetMapping("/{paymentId}/receipt")
    @Operation(summary = "Données JSON du reçu de paiement")
    public ResponseEntity<PaymentReceiptDto> getReceipt(
            @PathVariable String paymentId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(paymentService.getReceipt(paymentId, currentUser.getId()));
    }

    @GetMapping(value = "/{paymentId}/receipt/html", produces = MediaType.TEXT_HTML_VALUE)
    @Operation(summary = "Télécharger ou imprimer le reçu officiel en PDF/HTML")
    public ResponseEntity<String> getReceiptHtml(
            @PathVariable String paymentId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        String html = paymentService.generateReceiptHtml(paymentId, currentUser.getId());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"recu-maw3ed-" + paymentId + ".html\"")
                .body(html);
    }

    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Suivi de toutes les transactions (Espace Administrateur)")
    public ResponseEntity<Page<PaymentTransaction>> getAllTransactions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        return ResponseEntity.ok(paymentService.getAllTransactions(PageRequest.of(page, size)));
    }

    @GetMapping("/admin/financial-stats")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Statistiques financières globales (Revenus, commissions 10%, volumes)")
    public ResponseEntity<Map<String, Object>> getFinancialStats() {
        return ResponseEntity.ok(paymentService.getFinancialStats());
    }
}
