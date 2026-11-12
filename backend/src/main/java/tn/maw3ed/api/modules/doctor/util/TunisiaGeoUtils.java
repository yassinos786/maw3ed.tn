package tn.maw3ed.api.modules.doctor.util;

import java.util.Map;

/**
 * Référentiel de géocodage GPS WGS84 de haute précision pour la Tunisie.
 * Prend en charge les hôpitaux nationaux (Kassab, Charles Nicolle, Rabta, etc.),
 * les cliniques privées, les délégations médicales et les 24 gouvernorats.
 */
public final class TunisiaGeoUtils {

    private TunisiaGeoUtils() {}

    private static final Map<String, double[]> GOVERNORATE_COORDS = Map.ofEntries(
            Map.entry("Tunis", new double[]{10.1815, 36.8065}),
            Map.entry("Ariana", new double[]{10.1647, 36.8665}),
            Map.entry("Ben Arous", new double[]{10.2189, 36.7531}),
            Map.entry("Manouba", new double[]{10.0972, 36.8080}),
            Map.entry("Nabeul", new double[]{10.7376, 36.4561}),
            Map.entry("Zaghouan", new double[]{10.1429, 36.4029}),
            Map.entry("Bizerte", new double[]{9.8739, 37.2744}),
            Map.entry("Béja", new double[]{9.1817, 36.7256}),
            Map.entry("Jendouba", new double[]{8.7802, 36.5011}),
            Map.entry("Le Kef", new double[]{8.7149, 36.1822}),
            Map.entry("Siliana", new double[]{9.3708, 36.0848}),
            Map.entry("Sousse", new double[]{10.6084, 35.8256}),
            Map.entry("Monastir", new double[]{10.8262, 35.7780}),
            Map.entry("Mahdia", new double[]{11.0622, 35.5047}),
            Map.entry("Sfax", new double[]{10.7603, 34.7406}),
            Map.entry("Kairouan", new double[]{10.0963, 35.6781}),
            Map.entry("Kasserine", new double[]{8.8365, 35.1676}),
            Map.entry("Sidi Bouzid", new double[]{9.4849, 35.0382}),
            Map.entry("Gabès", new double[]{10.0982, 33.8815}),
            Map.entry("Médenine", new double[]{10.5055, 33.3549}),
            Map.entry("Tataouine", new double[]{10.4518, 32.9297}),
            Map.entry("Gafsa", new double[]{8.7842, 34.4250}),
            Map.entry("Tozeur", new double[]{8.1335, 33.9197}),
            Map.entry("Kébili", new double[]{8.9690, 33.7044})
    );

    /**
     * Résolution géospatiale combinant établissement/rue, ville et gouvernorat.
     */
    public static double[] getCoordinates(String governorate, String city, String street) {
        String combined = ((street != null ? street : "") + " " +
                (city != null ? city : "") + " " +
                (governorate != null ? governorate : "")).toLowerCase();

        // 1. Grands Hôpitaux Nationaux & Centres de référence
        if (combined.contains("kassab")) {
            return new double[]{10.1065, 36.8144}; // Institut Kassab d'Orthopédie (Ksar Saïd / Manouba)
        }
        if (combined.contains("charles nicolle")) {
            return new double[]{10.1587, 36.8041}; // Hôpital Charles Nicolle (Bab Saadoun / Tunis)
        }
        if (combined.contains("rabta")) {
            return new double[]{10.1517, 36.8005}; // Hôpital La Rabta (Bab Saadoun / Tunis)
        }
        if (combined.contains("habib thameur")) {
            return new double[]{10.1789, 36.7865}; // Hôpital Habib Thameur (Montfleury)
        }
        if (combined.contains("militaire")) {
            return new double[]{10.1528, 36.7936}; // Hôpital Militaire Principal d'Instruction
        }
        if (combined.contains("mongi slim")) {
            return new double[]{10.3015, 36.8621}; // Hôpital Mongi Slim (La Marsa)
        }
        if (combined.contains("mami") || combined.contains("abderrahmen mami")) {
            return new double[]{10.1652, 36.8631}; // Hôpital Abderrahmen Mami (Ariana)
        }
        if (combined.contains("razi")) {
            return new double[]{10.1005, 36.8112}; // Hôpital Razi (Manouba)
        }
        if (combined.contains("sahloul")) {
            return new double[]{10.5930, 35.8340}; // CHU Sahloul (Sousse)
        }
        if (combined.contains("farhat hached")) {
            return new double[]{10.6300, 35.8280}; // CHU Farhat Hached (Sousse)
        }
        if (combined.contains("hedi chaker")) {
            return new double[]{10.7490, 34.7390}; // CHU Hédi Chaker (Sfax)
        }
        if (combined.contains("fattouma bourguiba")) {
            return new double[]{10.8290, 35.7760}; // CHU Fattouma Bourguiba (Monastir)
        }

        // 2. Grandes Cliniques Privées & Pôles de Santé
        if (combined.contains("pasteur")) {
            return new double[]{10.1980, 36.8450}; // Clinique Pasteur (Centre Urbain Nord)
        }
        if (combined.contains("jasmins") || combined.contains("jasmin")) {
            return new double[]{10.1990, 36.8460}; // Clinique Les Jasmins (Centre Urbain Nord)
        }
        if (combined.contains("taoufik")) {
            return new double[]{10.1780, 36.8220}; // Clinique Taoufik (El Menzah)
        }
        if (combined.contains("amen")) {
            return new double[]{10.1880, 36.8350}; // Clinique Amen (Mutuelleville)
        }
        if (combined.contains("avicenne")) {
            return new double[]{10.1820, 36.8310}; // Clinique Avicenne (El Manar)
        }
        if (combined.contains("carthagene")) {
            return new double[]{10.1970, 36.8470}; // Clinique Carthagène
        }
        if (combined.contains("hannibal")) {
            return new double[]{10.2390, 36.8410}; // Clinique Hannibal (Berges du Lac 2)
        }
        if (combined.contains("myron")) {
            return new double[]{10.2410, 36.8430}; // Clinique Myron (Berges du Lac 2)
        }
        if (combined.contains("soukra")) {
            return new double[]{10.2520, 36.8830}; // Clinique de La Soukra
        }

        // 3. Délégations & Pôles Médicaux Majeurs
        if (combined.contains("centre urbain nord")) {
            return new double[]{10.1980, 36.8450};
        }
        if (combined.contains("lac 2") || combined.contains("berges du lac 2")) {
            return new double[]{10.2400, 36.8420};
        }
        if (combined.contains("lac 1") || combined.contains("berges du lac 1") || combined.contains("les berges du lac")) {
            return new double[]{10.2310, 36.8350};
        }
        if (combined.contains("ennasr 2") || combined.contains("ennasr 1") || combined.contains("ennasr") || combined.contains("nasr")) {
            return new double[]{10.1550, 36.8580};
        }
        if (combined.contains("el menzah") || combined.contains("menzah")) {
            return new double[]{10.1750, 36.8320};
        }
        if (combined.contains("el manar") || combined.contains("manar")) {
            return new double[]{10.1480, 36.8340};
        }
        if (combined.contains("bardo")) {
            return new double[]{10.1410, 36.8090};
        }
        if (combined.contains("denden")) {
            return new double[]{10.1120, 36.8050};
        }
        if (combined.contains("ksar said") || combined.contains("ksar saïd")) {
            return new double[]{10.1065, 36.8144};
        }
        if (combined.contains("manouba ville") || combined.contains("manouba") || combined.contains("mannouba")) {
            return new double[]{10.0972, 36.8080};
        }
        if (combined.contains("la marsa") || combined.contains("marsa")) {
            return new double[]{10.3250, 36.8780};
        }
        if (combined.contains("carthage")) {
            return new double[]{10.3290, 36.8530};
        }

        // 4. Repli sur le gouvernorat
        return getCoordinates(governorate);
    }

    public static double[] getCoordinates(String governorate) {
        if (governorate == null || governorate.isBlank()) {
            return new double[]{10.1815, 36.8065}; // Par défaut Centre de Tunis
        }

        String norm = governorate.trim().toLowerCase();
        if (norm.contains("manouba") || norm.contains("mannouba")) {
            return new double[]{10.0972, 36.8080}; // Manouba Ville [Lon, Lat]
        }
        if (norm.contains("ben arous") || norm.contains("benarous")) {
            return new double[]{10.2189, 36.7531}; // Ben Arous [Lon, Lat]
        }
        if (norm.contains("ariana")) {
            return new double[]{10.1647, 36.8665}; // Ariana [Lon, Lat]
        }

        for (Map.Entry<String, double[]> entry : GOVERNORATE_COORDS.entrySet()) {
            if (entry.getKey().equalsIgnoreCase(governorate.trim()) || norm.contains(entry.getKey().toLowerCase())) {
                return entry.getValue();
            }
        }
        return new double[]{10.1815, 36.8065};
    }
}
