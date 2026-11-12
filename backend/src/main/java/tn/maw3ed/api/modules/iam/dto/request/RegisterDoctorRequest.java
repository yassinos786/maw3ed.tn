package tn.maw3ed.api.modules.iam.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterDoctorRequest {

    @NotBlank(message = "Le prénom est obligatoire")
    private String firstName;

    @NotBlank(message = "Le nom est obligatoire")
    private String lastName;

    @NotBlank(message = "L'email professionnel est obligatoire")
    @Email(message = "Format d'email invalide")
    private String email;

    @NotBlank(message = "Le mot de passe est obligatoire")
    @Size(min = 6, max = 100, message = "Le mot de passe doit comporter au moins 6 caractères")
    private String password;

    @NotBlank(message = "Le numéro de téléphone professionnel est obligatoire")
    @Pattern(regexp = "^[\\+]?[0-9\\s\\-]{8,20}$", message = "Format de numéro de téléphone invalide (ex: +216 20 123 456 ou 20123456)")
    private String phoneNumber;

    @NotBlank(message = "Le numéro d'inscription au Conseil de l'Ordre des Médecins est obligatoire")
    private String medicalCouncilId;

    @NotEmpty(message = "Au moins une spécialité médicale doit être renseignée")
    private List<String> specialties;

    private String street;

    @NotBlank(message = "La ville ou quartier du cabinet est obligatoire")
    private String city;

    @NotBlank(message = "Le gouvernorat est obligatoire")
    private String governorate;

    private Double latitude;
    private Double longitude;

    @Builder.Default
    private Double consultationFee = 60.0;
}
