package tn.maw3ed.api.modules.payment.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.maw3ed.api.core.exception.BusinessException;
import tn.maw3ed.api.core.exception.ResourceNotFoundException;
import tn.maw3ed.api.modules.appointment.model.Appointment;
import tn.maw3ed.api.modules.appointment.model.AppointmentStatus;
import tn.maw3ed.api.modules.appointment.repository.AppointmentRepository;
import tn.maw3ed.api.modules.doctor.model.DoctorProfile;
import tn.maw3ed.api.modules.doctor.repository.DoctorProfileRepository;
import tn.maw3ed.api.modules.payment.dto.PaymentReceiptDto;
import tn.maw3ed.api.modules.payment.dto.ProcessPaymentRequest;
import tn.maw3ed.api.modules.payment.model.PaymentMethod;
import tn.maw3ed.api.modules.payment.model.PaymentStatus;
import tn.maw3ed.api.modules.payment.model.PaymentTransaction;
import tn.maw3ed.api.modules.payment.repository.PaymentTransactionRepository;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentTransactionRepository paymentRepository;
    private final AppointmentRepository appointmentRepository;
    private final DoctorProfileRepository doctorProfileRepository;

    private static final double COMMISSION_RATE = 0.10; // 10% de commission plateforme

    @Transactional
    public PaymentTransaction initiatePayment(String appointmentId, String patientId, PaymentMethod method) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Rendez-vous non trouvé"));

        if (!appointment.getPatientId().equals(patientId)) {
            throw new BusinessException("Vous n'êtes pas autorisé à régler ce rendez-vous.");
        }

        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new BusinessException("Impossible de régler un rendez-vous annulé.");
        }

        if (appointment.getPaymentStatus() == PaymentStatus.PAID) {
            return paymentRepository.findByAppointmentId(appointmentId)
                    .orElseThrow(() -> new BusinessException("Ce rendez-vous est déjà réglé."));
        }

        // Vérifier si une transaction PENDING existe déjà
        PaymentTransaction existingTx = paymentRepository.findByAppointmentId(appointmentId).orElse(null);
        if (existingTx != null && existingTx.getStatus() == PaymentStatus.PENDING) {
            existingTx.setPaymentMethod(method != null ? method : existingTx.getPaymentMethod());
            return paymentRepository.save(existingTx);
        }

        Double fee = appointment.getDoctorSnapshot() != null && appointment.getDoctorSnapshot().getFee() != null
                ? appointment.getDoctorSnapshot().getFee()
                : 50.0;

        double commission = Math.round((fee * COMMISSION_RATE) * 100.0) / 100.0;
        double netDoctor = Math.round((fee - commission) * 100.0) / 100.0;

        PaymentTransaction tx = PaymentTransaction.builder()
                .appointmentId(appointment.getId())
                .patientId(patientId)
                .doctorId(appointment.getDoctorId())
                .amount(fee)
                .currency("TND")
                .platformCommission(commission)
                .doctorNetRevenue(netDoctor)
                .paymentMethod(method)
                .status(PaymentStatus.PENDING)
                .transactionReference("MWD-TX-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .build();

        PaymentTransaction savedTx = paymentRepository.save(tx);
        appointment.setPaymentId(savedTx.getId());
        appointmentRepository.save(appointment);

        log.info("Paiement initialisé pour RDV {} - Montant : {} TND (Réf: {})",
                appointmentId, fee, savedTx.getTransactionReference());
        return savedTx;
    }

    @Transactional
    public PaymentTransaction processPayment(String paymentId, String patientId, ProcessPaymentRequest request) {
        PaymentTransaction tx = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction de paiement non trouvée"));

        if (!tx.getPatientId().equals(patientId)) {
            throw new BusinessException("Action non autorisée sur cette transaction.");
        }

        Appointment associatedApt = appointmentRepository.findById(tx.getAppointmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Rendez-vous associé introuvable"));

        if (associatedApt.getStatus() == AppointmentStatus.CANCELLED) {
            throw new BusinessException("Ce rendez-vous a été annulé.");
        }

        if (tx.getStatus() == PaymentStatus.PAID) {
            return tx;
        }

        // Enregistrement des métadonnées de paiement
        tx.setPaymentMethod(request.getPaymentMethod());
        tx.setStatus(PaymentStatus.PAID);
        tx.setPaidAt(Instant.now());

        if (request.getCardNumber() != null && request.getCardNumber().length() >= 4) {
            String cleanNumber = request.getCardNumber().replaceAll("\\s+", "");
            tx.setCardLast4(cleanNumber.substring(cleanNumber.length() - 4));
        } else {
            tx.setCardLast4(null);
        }

        PaymentTransaction savedTx = paymentRepository.save(tx);

        // Validation et confirmation finale du rendez-vous
        Appointment appointment = appointmentRepository.findById(tx.getAppointmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Rendez-vous associé introuvable"));

        appointment.setStatus(AppointmentStatus.CONFIRMED);
        appointment.setPaymentStatus(PaymentStatus.PAID);
        appointment.setAmountPaid(tx.getAmount());
        appointment.setPaymentMethod(tx.getPaymentMethod());
        appointmentRepository.save(appointment);

        log.info("Paiement validé avec succès pour RDV {} - Réf: {}",
                appointment.getId(), tx.getTransactionReference());
        return savedTx;
    }

    public PaymentTransaction getPaymentByAppointmentId(String appointmentId) {
        return paymentRepository.findByAppointmentId(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Aucune transaction trouvée pour ce rendez-vous"));
    }

    public PaymentReceiptDto getReceipt(String paymentId, String userId) {
        PaymentTransaction tx = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction introuvable"));

        if (tx.getStatus() != PaymentStatus.PAID) {
            throw new BusinessException("Le reçu officiel n'est disponible que pour les transactions réglées.");
        }

        Appointment appointment = appointmentRepository.findById(tx.getAppointmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Rendez-vous associé introuvable"));

        return PaymentReceiptDto.builder()
                .paymentId(tx.getId())
                .transactionReference(tx.getTransactionReference())
                .appointmentId(appointment.getId())
                .patientName(appointment.getPatientSnapshot() != null ? appointment.getPatientSnapshot().getFullName() : "Patient")
                .patientEmail(appointment.getPatientSnapshot() != null ? appointment.getPatientSnapshot().getEmail() : "")
                .doctorName(appointment.getDoctorSnapshot() != null ? appointment.getDoctorSnapshot().getFullName() : "Médecin")
                .doctorSpecialty(appointment.getDoctorSnapshot() != null ? appointment.getDoctorSnapshot().getSpecialty() : "")
                .cabinetAddress(appointment.getDoctorSnapshot() != null ? appointment.getDoctorSnapshot().getCabinetAddress() : "")
                .consultationType(appointment.getType())
                .scheduledStartTime(appointment.getScheduledStartTime())
                .amount(tx.getAmount())
                .currency(tx.getCurrency())
                .paymentMethod(tx.getPaymentMethod())
                .status(tx.getStatus())
                .paidAt(tx.getPaidAt() != null ? tx.getPaidAt() : tx.getCreatedAt())
                .issuedBy("maw3ed.tn SARL - Plateforme Médicale Agréée")
                .build();
    }

    public String generateReceiptHtml(String paymentId, String userId) {
        PaymentReceiptDto receipt = getReceipt(paymentId, userId);

        return """
            <!DOCTYPE html>
            <html lang="fr">
            <head>
              <meta charset="utf-8">
              <title>Reçu de Paiement - %s</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 40px; color: #1e293b; background: #fff; }
                .receipt-container { max-width: 650px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
                .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0284c7; padding-bottom: 15px; margin-bottom: 25px; }
                .brand { font-size: 24px; font-weight: 800; color: #0284c7; }
                .badge-paid { background: #dcfce7; color: #166534; font-weight: 700; font-size: 13px; padding: 4px 10px; border-radius: 9999px; }
                .details-table { width: 100%%; border-collapse: collapse; margin-top: 20px; }
                .details-table td { padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
                .label { color: #64748b; font-size: 14px; width: 40%%; }
                .value { font-weight: 600; font-size: 15px; text-align: right; }
                .total-row td { border-top: 2px solid #cbd5e1; border-bottom: none; font-size: 18px; padding-top: 15px; color: #0f172a; }
                .footer { margin-top: 35px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 15px; }
                @media print { body { margin: 0; } .receipt-container { border: none; box-shadow: none; } .no-print { display: none; } }
              </style>
            </head>
            <body>
              <div class="receipt-container">
                <div class="header">
                  <div>
                    <div class="brand">maw3ed.tn</div>
                    <div style="font-size: 12px; color: #64748b;">Reçu officiel de consultation</div>
                  </div>
                  <div>
                    <span class="badge-paid">PAIEMENT CONFIRMÉ</span>
                  </div>
                </div>

                <table class="details-table">
                  <tr><td class="label">Référence Transaction :</td><td class="value">%s</td></tr>
                  <tr><td class="label">Date du Paiement :</td><td class="value">%s</td></tr>
                  <tr><td class="label">Patient :</td><td class="value">%s</td></tr>
                  <tr><td class="label">Médecin Traitant :</td><td class="value">%s (%s)</td></tr>
                  <tr><td class="label">Type de Consultation :</td><td class="value">%s</td></tr>
                  <tr><td class="label">Mode de Paiement :</td><td class="value">%s</td></tr>
                  <tr class="total-row"><td class="label" style="font-weight: 700;">Montant Total TTC :</td><td class="value" style="color: #0284c7;">%.2f %s</td></tr>
                </table>

                <div class="footer">
                  <p>%s - Document certifié électronique délivré pour servir et valoir ce que de droit.</p>
                </div>
              </div>
              <script>window.print();</script>
            </body>
            </html>
            """.formatted(
                receipt.getTransactionReference(),
                receipt.getTransactionReference(),
                receipt.getPaidAt(),
                receipt.getPatientName(),
                receipt.getDoctorName(),
                receipt.getDoctorSpecialty(),
                formatConsultationType(receipt.getConsultationType()),
                formatPaymentMethod(receipt.getPaymentMethod()),
                receipt.getAmount(),
                receipt.getCurrency(),
                receipt.getIssuedBy()
        );
    }

    private String formatConsultationType(tn.maw3ed.api.modules.appointment.model.ConsultationType type) {
        if (type == null) return "Consultation";
        return switch (type) {
            case TELECONSULTATION -> "Téléconsultation vidéo";
            case IN_PERSON -> "Consultation au cabinet";
            case BOTH -> "Cabinet / Téléconsultation";
        };
    }

    private String formatPaymentMethod(PaymentMethod method) {
        if (method == null) return "Paiement en ligne";
        return switch (method) {
            case CARTE_BANCAIRE -> "Carte bancaire";
            case KONNECT -> "Konnect";
            case FLOUCI -> "Flouci";
            case CASH_AT_CABINET -> "Espèces au cabinet";
            case ONLINE_PAYMENT -> "Paiement en ligne";
        };
    }

    public Page<PaymentTransaction> getAllTransactions(Pageable pageable) {
        return paymentRepository.findAllByOrderByCreatedAtDesc(pageable);
    }

    public Map<String, Object> getFinancialStats() {
        List<PaymentTransaction> paidTransactions = paymentRepository.findByStatus(PaymentStatus.PAID);

        double totalVolume = 0.0;
        double totalCommissions = 0.0;
        double totalDoctorPayouts = 0.0;

        for (PaymentTransaction tx : paidTransactions) {
            if (tx.getAmount() != null) {
                totalVolume += tx.getAmount();
                totalCommissions += tx.getPlatformCommission() != null ? tx.getPlatformCommission() : (tx.getAmount() * COMMISSION_RATE);
                totalDoctorPayouts += tx.getDoctorNetRevenue() != null ? tx.getDoctorNetRevenue() : (tx.getAmount() * (1 - COMMISSION_RATE));
            }
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalVolumeTND", Math.round(totalVolume * 100.0) / 100.0);
        stats.put("platformCommissionsTND", Math.round(totalCommissions * 100.0) / 100.0);
        stats.put("doctorPayoutsTND", Math.round(totalDoctorPayouts * 100.0) / 100.0);
        stats.put("totalPaidTransactions", paidTransactions.size());
        stats.put("totalPendingTransactions", paymentRepository.countByStatus(PaymentStatus.PENDING));

        return stats;
    }
}
