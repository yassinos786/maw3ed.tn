package tn.maw3ed.api.modules.payment.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import tn.maw3ed.api.modules.payment.model.PaymentStatus;
import tn.maw3ed.api.modules.payment.model.PaymentTransaction;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentTransactionRepository extends MongoRepository<PaymentTransaction, String> {
    Optional<PaymentTransaction> findByAppointmentId(String appointmentId);
    Page<PaymentTransaction> findByPatientIdOrderByCreatedAtDesc(String patientId, Pageable pageable);
    Page<PaymentTransaction> findByDoctorIdOrderByCreatedAtDesc(String doctorId, Pageable pageable);
    List<PaymentTransaction> findByStatus(PaymentStatus status);
    Page<PaymentTransaction> findAllByOrderByCreatedAtDesc(Pageable pageable);
    long countByStatus(PaymentStatus status);
}
