# Configuration Base de Données - MongoDB

Ce répertoire contient les scripts d'initialisation de la base MongoDB **`maw3ed_db`**.

## Collections principales

| Collection | Rôle |
| :--- | :--- |
| `users` | Comptes utilisateurs (Patient, Médecin, Administrateur) et rôles RBAC |
| `doctor_profiles` | Profils praticiens, spécialités, tarifs et coordonnées géospatiales (`2dsphere`) |
| `availability_slots` | Créneaux horaires de consultation ouverts par chaque médecin |
| `appointments` | Réservations de rendez-vous (Présentiel au Cabinet & Téléconsultation Jitsi/WebRTC) |
| `payments` | Suivi des règlements (Espèces sur place & paiements en ligne) |
| `triage_logs` | Historique d'analyse des symptômes et détections d'urgences SAMU 198 |
| `audit_logs` | Journal d'audit administratif et traçabilité de sécurité |

## Initialisation manuelle

Spring Boot (`spring.data.mongodb.auto-index-creation=true`) crée automatiquement les index au démarrage.  
Pour initialiser manuellement les collections et l'index géospatial `2dsphere` via `mongosh` :

```bash
mongosh maw3ed_db database/init-mongo.js
```
