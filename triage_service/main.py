"""
Maw3ed.tn - Medical Triage & Emergency Detection Microservice
Framework: FastAPI (Asynchronous REST API)
Architecture: Microservice REST découplé pour le triage médical
Port: 8000
"""

import time
import re
from datetime import datetime, timezone
from typing import List, Dict, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(
    title="Maw3ed.tn Medical Triage Service",
    description="Microservice d'orientation médicale et de détection d'urgence vitale (FastAPI)",
    version="2.0.0"
)

# Configuration CORS pour autoriser Spring Boot et les clients web
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modèles Pydantic (Request / Response)

class TriageInput(BaseModel):
    symptoms: str = Field(..., min_length=3, max_length=3000, description="Description textuelle des symptômes")
    language: Optional[str] = Field("fr", description="Langue de l'utilisateur (fr, ar, en)")

class TriageOutput(BaseModel):
    emergency: bool
    urgencyLevel: str  # "CRITICAL", "HIGH", "MODERATE", "LOW"
    recommendedSpecialty: str
    confidenceScore: float
    redFlagsDetected: List[str]
    advice: str
    emergencyNumbers: List[str]
    processingTimeMs: float
    modelVersion: str
    analyzedAt: str

# Base de connaissances médicale & lexique multilingue (FR / AR / EN)

# Urgences vitales critiques (SAMU 198)
CRITICAL_EMERGENCY_RULES = [
    {
        "pattern": r"(douleur\s+thoracique|mal\s+au\s+coeur|bras\s+gauche|infarctus|sedri\s+youja3|wji3a\s+fi\s+(sedri|9albi)|9albi\s+ye7bes|chest\s+pain)",
        "label": "Suspicion de syndrome coronarien aigu (Infarctus du myocarde)",
        "red_flag": "Douleur thoracique / Précordialgie irradiant au bras gauche"
    },
    {
        "pattern": r"(avc|paralysie|3wej\s+fi\s+fomi|visage\s+d[eé]form[eé]|perte\s+de\s+la\s+parole|ma3adech\s+najem\s+n[eé]tkalem|stroke|facial\s+droop)",
        "label": "Signes évocateurs d'Accident Vasculaire Cérébral (AVC)",
        "red_flag": "Déficit neurologique brutal / Asymétrie faciale"
    },
    {
        "pattern": r"(d[eé]tresse\s+respiratoire|[eé]touffement|faddit\s+nefsi|ma3adech\s+najem\s+netnaffas|suffocation|severe\s+dyspnea)",
        "label": "Détresse respiratoire aiguë",
        "red_flag": "Asphyxie ou dyspnée aiguë sévère"
    },
    {
        "pattern": r"(perte\s+de\s+connaissance|coma|inconscient|t3ada\s+fartas|ghaybouba|fainted|unconscious)",
        "label": "Perte de connaissance prolongée / Coma",
        "red_flag": "Altération brutale de l'état de conscience"
    },
    {
        "pattern": r"(convulsion|crise\s+[eé]pilepsie|tetkhadhedh|convulsions)",
        "label": "Crise convulsive inaugurale ou prolongée",
        "red_flag": "Mouvements convulsifs tonico-cloniques"
    },
    {
        "pattern": r"(h[eé]morragie|saignement\s+massif|dam\s+barcha|profuse\s+bleeding)",
        "label": "Hémorragie active non contrôlée",
        "red_flag": "Saignement profus"
    }
]

# Spécialités médicales et dictionnaire sémantique
# Spécialités médicales et dictionnaire sémantique clinique exhaustif (FR / AR / EN / Derja)
SPECIALTY_KNOWLEDGE_BASE: Dict[str, Dict] = {
    "Urologie": {
        "keywords": [
            "testicule", "testicules", "douleur testiculaire", "bourses", "scrotum", "prostate",
            "prostatite", "adénome", "pénis", "verge", "érection", "troubles érectiles",
            "urinaire", "urines", "miction", "brûlure en urinant", "brûlures urinaires", "brûlure urinaire",
            "difficulté à uriner", "sang dans les urines", "hématurie", "infection urinaire", "cystite",
            "rein", "reins", "calcul rénal", "calculs rénaux", "colique néphrétique", "mal aux reins",
            "incontinence urinaire", "fuite urinaire", "khsayet", "9alwa", "7ar9an fil boula",
            "boula feha dam", "youja3ni el boula", "klaoui", "kelyi"
        ],
        "weight": 1.25,
        "default_advice": "Consultation urologique recommandée pour bilan uro-génital, échographie scrotale/rénale ou ECBU."
    },
    "Pneumologie": {
        "keywords": [
            "poumon", "poumons", "toux", "toux persistante", "toux grasse", "toux sèche", "crachat",
            "expectoration", "glaires", "bronche", "bronches", "bronchite", "asthme", "crise d'asthme",
            "sifflement", "râles", "essoufflement", "dyspnée", "pneumonie", "gêne respiratoire",
            "difficulté à respirer", "ka77a", "koffa", "nefsi dhyyeq", "sedri yzaffer", "khankatni"
        ],
        "weight": 1.2,
        "default_advice": "Avis pneumologique conseillé pour radiographie pulmonaire, spirométrie et exploration respiratoire."
    },
    "Psychiatrie": {
        "keywords": [
            "dépression", "déprime", "tristesse", "anxiété", "angoisse", "crise d'angoisse", "panique",
            "crise de panique", "insomnie", "troubles du sommeil", "sommeil agité", "stress",
            "burnout", "burn out", "surmenage", "idées noires", "phobie", "bipolaire", "hallucinations",
            "perte d'envie", "manor9odech", "khayef", "fobya", "weswes", "nefssiti te3ba", "9la9"
        ],
        "weight": 1.15,
        "default_advice": "Consultation psychiatrique ou psychologique recommandée pour évaluation diagnostique et prise en charge bienveillante."
    },
    "Endocrinologie-Diabétologie": {
        "keywords": [
            "diabète", "diabétique", "sucre", "glycémie", "hyperglycémie", "hypoglycémie", "soif excessive",
            "polyurie", "envie fréquente d'uriner", "thyroïde", "hypothyroïdie", "hyperthyroïdie", "goitre",
            "tsh", "prise de poids inexpliquée", "perte de poids brutale", "fatigue hormonale",
            "sokker", "dha5t sokker", "ghodda", "ghodad"
        ],
        "weight": 1.15,
        "default_advice": "Bilan endocrinologique conseillé avec dosage hormonal et surveillance métabolique."
    },
    "Rhumatologie": {
        "keywords": [
            "arthrose", "arthrite", "polyarthrite", "goutte", "acide urique", "raideur articulaire",
            "articulations douloureuses", "gonflement articulaire", "mal de dos chronique", "colonne vertébrale",
            "rhumatismes", "douleurs articulaires", "mfaçel", "mfasli youj3ou", "berd fel 3dham", "3dhami youj3ou"
        ],
        "weight": 1.15,
        "default_advice": "Consultation rhumatologique recommandée pour bilan inflammatoire et radiologique articulaire."
    },
    "Cardiologie": {
        "keywords": [
            "palpitation", "palpitations", "coeur", "tachycardie", "bradycardie", "tension", "hypertension",
            "hypotension", "arythmie", "dha5t", "9alb", "souffle au coeur", "battements rapides", "cardio",
            "pouls rapide", "9albi", "tension tla3et", "9albi ydeg", "sedri yothreb"
        ],
        "weight": 1.2,
        "default_advice": "Consultation cardiologique conseillée pour bilan cardiovasculaire et électrocardiogramme (ECG)."
    },
    "Dermatologie": {
        "keywords": [
            "bouton", "boutons", "démangeaison", "démangeaisons", "acné", "rougeur", "rougeurs", "peau",
            "eczéma", "tache", "7ka", "grain de beauté", "psoriasis", "allergie cutanée", "rash",
            "brûlure superficielle", "jeld", "chute de cheveux", "alopécie", "pelade", "ongles",
            "mycose", "champignon", "tache brune", "furoncle", "zona", "verrue", "haboub", "hab", "b9a3"
        ],
        "weight": 1.1,
        "default_advice": "Consultation dermatologique recommandée pour examen lésionnel et dermoscopie."
    },
    "Chirurgie Dentaire": {
        "keywords": [
            "dent", "dents", "mâchoire", "gencive", "gencives", "carie", "dharsa", "dharsi", "seni",
            "plombage", "abcès dentaire", "dent de sagesse", "rage de dents", "saignement gencives",
            "fomi", "dharsi touja3", "dam fel lethra", "toothache", "bleeding gums"
        ],
        "weight": 1.15,
        "default_advice": "Examen bucco-dentaire préconisé auprès d'un chirurgien-dentiste."
    },
    "Ophtalmologie": {
        "keywords": [
            "yeux", "vision", "flou", "oeil", "conjonctivite", "3in", "3iniya", "myopie",
            "baisse de vue", "sécheresse oculaire", "lentilles", "yeux rouges", "picotements yeux",
            "corps flottants", "orgelet", "chouf dhi3if", "dam3a", "eye"
        ],
        "weight": 1.1,
        "default_advice": "Consultation ophtalmologique indiquée avec mesure de l'acuité visuelle et fond d'œil."
    },
    "Oto-Rhino-Laryngologie (ORL)": {
        "keywords": [
            "gorge", "mal de gorge", "oreille", "oreilles", "sinusite", "acouphène", "acouphènes",
            "otite", "angine", "nez bouché", "rhume", "enrouement", "perte de voix", "perte d'odorat",
            "amygdales", "gorjouma", "gorjoumti touja3", "wadhni", "wadhni tsaffer", "khachmi msakker",
            "sowti mcha", "sinus", "vertige"
        ],
        "weight": 1.1,
        "default_advice": "Consultation ORL recommandée pour endoscopie nasale ou examen tympanique."
    },
    "Gastro-entérologie": {
        "keywords": [
            "estomac", "ventre", "mal au ventre", "douleur abdominale", "maux de ventre", "vomissement",
            "vomissements", "nausée", "nausées", "diarrhée", "constipation", "foie", "vésicule",
            "brûlure d'estomac", "reflux", "acidité", "ballonnement", "gaz", "hémorroïdes", "sang dans les selles",
            "kerchi", "ma3da", "kerchi touja3", "reddan", "wji3a fi kerchi", "7ar9an ma3da", "colite"
        ],
        "weight": 1.1,
        "default_advice": "Avis gastro-entérologique conseillé pour exploration digestive adaptée et échographie abdominale."
    },
    "Neurologie": {
        "keywords": [
            "migraine", "mal de tête", "maux de tête", "céphalée", "céphalées", "vertiges chroniques",
            "engourdissement", "fourmillement", "tremblement", "tremblements", "perte d'équilibre",
            "troubles de mémoire", "névralgie", "sciatique", "rasi", "rasi youja3", "sodda3",
            "dwaykha", "tanmil", "tmanmil"
        ],
        "weight": 1.1,
        "default_advice": "Avis neurologique recommandé pour diagnostic précis et bilan spécialisé."
    },
    "Pédiatrie": {
        "keywords": [
            "bébé", "nourrisson", "enfant", "enfants", "croissance", "vaccin bébé", "s5ana sghir",
            "weldi", "benti", "pédiatre", "reflux bébé", "dents bébé", "coliques nourrisson",
            "radhi3", "weldi mridh"
        ],
        "weight": 1.2,
        "default_advice": "Consultation pédiatrique recommandée pour suivi et examen clinique de l'enfant."
    },
    "Gynécologie-Obstétrique": {
        "keywords": [
            "grossesse", "enceinte", "retard règles", "cycle", "cycle menstruel", "douleur bas ventre femme",
            "contraception", "fœtus", "échographie pelvienne", "accouchement", "règles douloureuses",
            "pertes blanches", "ménopause", "kyste ovarien", "7ebla", "dourra chahriya"
        ],
        "weight": 1.2,
        "default_advice": "Consultation avec un gynécologue-obstétricien recommandée pour bilan et échographie."
    },
    "Orthopédie & Traumatologie": {
        "keywords": [
            "fracture", "entorse", "genou", "cheville", "épaule", "articulation", "dos",
            "lombalgie", "sciatique", "dharba fi rokba", "kaser", "ligament", "tendon",
            "tendinite", "hanche", "traumatisme", "rokba", "rokbti touja3", "te7t", "sdfa3"
        ],
        "weight": 1.1,
        "default_advice": "Consultation orthopédique conseillée avec radiographie osseuse ou IRM articulaire."
    },
    "Médecine Générale": {
        "keywords": [
            "fièvre", "frissons", "fatigue", "fatigue générale", "asthénie", "grippe", "syndrome grippal",
            "courbatures", "malaise général", "checkup", "bilan de santé", "s5ana", "fachel", "ta3eb",
            "r3ida", "fashla"
        ],
        "weight": 0.95,
        "default_advice": "Consultation en Médecine Générale recommandée pour diagnostic initial et bilan biologique."
    }
}

# Compteurs métriques en mémoire (thread-safe simples)
metrics_store = {
    "total_requests": 0,
    "emergency_count": 0,
    "total_latency_ms": 0.0,
    "specialty_distribution": {},
    "started_at": datetime.now(timezone.utc).isoformat()
}

# Endpoints de l'API

@app.get("/")
def root():
    return {
        "platform": "maw3ed.tn",
        "service": "Medical Triage & Orientation Microservice",
        "status": "OPERATIONAL",
        "docs": "/docs"
    }

@app.get("/health")
def health_check():
    """
    Health check consommé par Spring Boot (TriageService)
    pour vérifier la disponibilité du service de triage Python.
    """
    return {
        "status": "UP",
        "service": "maw3ed-triage",
        "version": "2.0.0",
        "engine": "FastAPI Medical Classifier",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.get("/metrics")
def get_metrics():
    """
    Fournit les statistiques de performance du modèle pour le dashboard Admin Spring Boot.
    """
    avg_latency = 0.0
    if metrics_store["total_requests"] > 0:
        avg_latency = round(metrics_store["total_latency_ms"] / metrics_store["total_requests"], 2)

    return {
        "totalRequests": metrics_store["total_requests"],
        "emergencyCount": metrics_store["emergency_count"],
        "emergencyRatePercent": round((metrics_store["emergency_count"] / max(metrics_store["total_requests"], 1)) * 100, 2),
        "averageLatencyMs": avg_latency,
        "specialtiesDistribution": metrics_store["specialty_distribution"],
        "uptimeStartedAt": metrics_store["started_at"]
    }

@app.post("/api/v1/triage/analyze", response_model=TriageOutput)
def analyze_symptoms(payload: TriageInput):
    """
    Analyse sémantique des symptômes du patient :
    1. Détection prioritaire des urgences vitales (SAMU 198)
    2. Extraction et scoring des spécialités médicales appropriées
    3. Production de recommandations personnalisées
    """
    start_time = time.perf_counter()
    raw_text = payload.symptoms.lower().strip()
    
    # 1. Vérification des alertes d'urgence vitale
    detected_red_flags: List[str] = []
    for rule in CRITICAL_EMERGENCY_RULES:
        if re.search(rule["pattern"], raw_text, re.IGNORECASE):
            detected_red_flags.append(f"{rule['red_flag']} ({rule['label']})")

    # Mettre à jour les métriques globales
    metrics_store["total_requests"] += 1

    if detected_red_flags:
        metrics_store["emergency_count"] += 1
        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
        metrics_store["total_latency_ms"] += elapsed_ms

        return TriageOutput(
            emergency=True,
            urgencyLevel="CRITICAL",
            recommendedSpecialty="SAMU / Urgence Médicale",
            confidenceScore=0.99,
            redFlagsDetected=detected_red_flags,
            advice=(
                "ALERTE D'URGENCE VITALE : Les symptômes signalés indiquent une situation critique "
                "pouvant engager le pronostic vital. Cessez immédiatement toute activité physique et "
                "contactez le SAMU au 198 sans délai."
            ),
            emergencyNumbers=[
                "SAMU : 198 (Urgences Médicales)",
                "Protection Civile : 198",
                "Police Secours : 197"
            ],
            processingTimeMs=elapsed_ms,
            modelVersion="fastapi-medical-rules-v2",
            analyzedAt=datetime.now(timezone.utc).isoformat()
        )

    # 2. Classification sémantique de la spécialité
    scores: Dict[str, float] = {}
    matched_terms: Dict[str, List[str]] = {}

    for specialty, meta in SPECIALTY_KNOWLEDGE_BASE.items():
        score = 0.0
        matches = []
        for kw in meta["keywords"]:
            # Recherche de mot ou expression
            if kw in raw_text:
                score += (len(kw) / 4.0) * meta["weight"]
                matches.append(kw)
        if score > 0:
            scores[specialty] = score
            matched_terms[specialty] = matches

    # Détermination de la meilleure spécialité
    if scores:
        best_specialty = max(scores, key=scores.get)
        raw_score = scores[best_specialty]
        # Normalisation du score de confiance entre 0.72 et 0.96
        confidence = min(0.96, max(0.72, 0.70 + (raw_score * 0.05)))
        urgency = "MODERATE"
        advice = SPECIALTY_KNOWLEDGE_BASE[best_specialty]["default_advice"]
    else:
        best_specialty = "Médecine Générale"
        confidence = 0.65
        urgency = "LOW"
        advice = (
            "Vos symptômes ne correspondent pas à une spécialité univoque. "
            "Une consultation initiale auprès d'un Médecin Généraliste permettra d'établir un premier diagnostic."
        )

    # Mise à jour des stats par spécialité
    metrics_store["specialty_distribution"][best_specialty] = (
        metrics_store["specialty_distribution"].get(best_specialty, 0) + 1
    )

    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
    metrics_store["total_latency_ms"] += elapsed_ms

    return TriageOutput(
        emergency=False,
        urgencyLevel=urgency,
        recommendedSpecialty=best_specialty,
        confidenceScore=round(confidence, 2),
        redFlagsDetected=[],
        advice=advice,
        emergencyNumbers=[],
        processingTimeMs=elapsed_ms,
        modelVersion="fastapi-medical-rules-v2",
        analyzedAt=datetime.now(timezone.utc).isoformat()
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
