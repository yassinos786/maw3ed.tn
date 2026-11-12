package tn.maw3ed.api.modules.payment;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tn.maw3ed.api.core.exception.BusinessException;
import tn.maw3ed.api.modules.appointment.model.Appointment;
import tn.maw3ed.api.modules.appointment.model.AppointmentStatus;
import tn.maw3ed.api.modules.appointment.model.ConsultationType;
import tn.maw3ed.api.modules.appointment.repository.AppointmentRepository;
import tn.maw3ed.api.modules.doctor.repository.DoctorProfileRepository;
import tn.maw3ed.api.modules.payment.dto.PaymentReceiptDto;
import tn.maw3ed.api.modules.payment.model.PaymentMethod;
import tn.maw3ed.api.modules.payment.model.PaymentStatus;
import tn.maw3ed.api.modules.payment.model.PaymentTransaction;
import tn.maw3ed.api.modules.payment.repository.PaymentTransactionRepository;
import tn.maw3ed.api.modules.payment.service.PaymentService;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentTransactionRepository paymentRepository;

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private DoctorProfileRepository doctorProfileRepository;

    private PaymentService paymentService;

    @BeforeEach
    void setUp() {
        paymentService = new PaymentService(paymentRepository, appointmentRepository, doctorProfileRepository);
    }

    @Test
    @DisplayName("Ne doit pas générer de reçu officiel pour une transaction en attente")
    void shouldRejectReceiptForUnpaidTransaction() {
        PaymentTransaction pendingTx = PaymentTransaction.builder()
                .id("tx-1")
                .appointmentId("apt-1")
                .patientId("pat-1")
                .doctorId("doc-1")
                .amount(80.0)
                .status(PaymentStatus.PENDING)
                .transactionReference("MWD-TX-TEST1")
                .build();

        when(paymentRepository.findById("tx-1")).thenReturn(Optional.of(pendingTx));

        assertThrows(BusinessException.class, () -> paymentService.getReceipt("tx-1", "pat-1"));
        assertThrows(BusinessException.class, () -> paymentService.generateReceiptHtml("tx-1", "pat-1"));
    }

    @Test
    @DisplayName("Doit générer le reçu HTML pour une transaction réglée")
    void shouldGenerateReceiptHtmlWhenPaid() {
        PaymentTransaction paidTx = PaymentTransaction.builder()
                .id("tx-2")
                .appointmentId("apt-2")
                .patientId("pat-1")
                .doctorId("doc-1")
                .amount(50.0)
                .currency("TND")
                .paymentMethod(PaymentMethod.CARTE_BANCAIRE)
                .status(PaymentStatus.PAID)
                .paidAt(Instant.now())
                .transactionReference("MWD-TX-TEST2")
                .build();

        Appointment apt = Appointment.builder()
                .id("apt-2")
                .type(ConsultationType.TELECONSULTATION)
                .status(AppointmentStatus.CONFIRMED)
                .doctorSnapshot(Appointment.DoctorSnapshot.builder()
                        .fullName("Dr. Test")
                        .specialty("Cardiologie")
                        .build())
                .patientSnapshot(Appointment.PatientSnapshot.builder()
                        .fullName("Patient Test")
                        .email("patient@test.tn")
                        .build())
                .build();

        when(paymentRepository.findById("tx-2")).thenReturn(Optional.of(paidTx));
        when(appointmentRepository.findById("apt-2")).thenReturn(Optional.of(apt));

        PaymentReceiptDto receipt = paymentService.getReceipt("tx-2", "pat-1");
        assertEquals(PaymentStatus.PAID, receipt.getStatus());

        String html = paymentService.generateReceiptHtml("tx-2", "pat-1");
        assertTrue(html.contains("MWD-TX-TEST2"));
        assertTrue(html.contains("Carte bancaire"));
        assertTrue(html.contains("Téléconsultation vidéo"));
    }

    @Test
    @DisplayName("Doit calculer les statistiques uniquement sur les transactions réglées")
    void shouldComputeFinancialStatsOnlyFromPaidTransactions() {
        PaymentTransaction paidTx = PaymentTransaction.builder()
                .amount(50.0)
                .platformCommission(5.0)
                .doctorNetRevenue(45.0)
                .status(PaymentStatus.PAID)
                .build();

        when(paymentRepository.findByStatus(PaymentStatus.PAID)).thenReturn(List.of(paidTx));
        when(paymentRepository.countByStatus(PaymentStatus.PENDING)).thenReturn(1L);

        Map<String, Object> stats = paymentService.getFinancialStats();
        assertEquals(50.0, stats.get("totalVolumeTND"));
        assertEquals(5.0, stats.get("platformCommissionsTND"));
        assertEquals(45.0, stats.get("doctorPayoutsTND"));
        assertEquals(1, stats.get("totalPaidTransactions"));
        assertEquals(1L, stats.get("totalPendingTransactions"));
    }

    @Test
    @DisplayName("Une nouvelle transaction initialisée sans méthode conserve paymentMethod à null")
    void shouldKeepNullPaymentMethodWhenNotProvided() {
        Appointment apt = Appointment.builder()
                .id("apt-3")
                .patientId("pat-1")
                .doctorId("doc-1")
                .status(AppointmentStatus.PENDING_PAYMENT)
                .paymentStatus(PaymentStatus.PENDING)
                .build();

        when(appointmentRepository.findById("apt-3")).thenReturn(Optional.of(apt));
        when(paymentRepository.findByAppointmentId("apt-3")).thenReturn(Optional.empty());
        when(paymentRepository.save(any(PaymentTransaction.class))).thenAnswer(inv -> inv.getArgument(0));
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(inv -> inv.getArgument(0));

        PaymentTransaction tx = paymentService.initiatePayment("apt-3", "pat-1", null);
        assertNull(tx.getPaymentMethod());
        assertEquals(PaymentStatus.PENDING, tx.getStatus());
    }
}
