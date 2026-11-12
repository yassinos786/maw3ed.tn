// Maw3ed.tn - Script d'initialisation & indexation MongoDB
// Exécution : mongosh maw3ed_db database/init-mongo.js

const dbName = "maw3ed_db";
const targetDb = db.getSiblingDB(dbName);

// Création des collections principales
const collections = [
  "users",
  "doctor_profiles",
  "availability_slots",
  "appointments",
  "payments",
  "triage_logs",
  "audit_logs"
];

collections.forEach((col) => {
  if (!targetDb.getCollectionNames().includes(col)) {
    targetDb.createCollection(col);
  }
});

// Index uniques & recherches fréquentes
targetDb.users.createIndex({ email: 1 }, { unique: true });
targetDb.doctor_profiles.createIndex({ userId: 1 }, { unique: true });
targetDb.doctor_profiles.createIndex({ specialty: 1, "clinicAddress.governorate": 1 });

// Index géospatial 2dsphere pour la recherche de cabinets à proximité
targetDb.doctor_profiles.createIndex({ "clinicAddress.coordinates": "2dsphere" });

// Index anti-collision pour les créneaux & rendez-vous
targetDb.availability_slots.createIndex({ doctorId: 1, date: 1 });
targetDb.appointments.createIndex({ doctorId: 1, slotStart: 1 });
targetDb.appointments.createIndex({ patientId: 1, slotStart: -1 });

// Audit triage, sécurité & paiements
targetDb.triage_logs.createIndex({ createdAt: -1 });
targetDb.payments.createIndex({ appointmentId: 1 });
targetDb.audit_logs.createIndex({ timestamp: -1 });

print("Base MongoDB maw3ed_db initialisée avec succès (collections et index 2dsphere créés).");
