package tn.maw3ed.api.modules.admin.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.maw3ed.api.modules.iam.model.Role;
import tn.maw3ed.api.modules.iam.model.UserStatus;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminCreateUserRequest {

    @NotBlank(message = "Le prénom est obligatoire")
    private String firstName;

    @NotBlank(message = "Le nom est obligatoire")
    private String lastName;

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "Format d'email invalide")
    private String email;

    @NotBlank(message = "Le mot de passe est obligatoire")
    @Size(min = 6, message = "Le mot de passe doit comporter au moins 6 caractères")
    private String password;

    @NotBlank(message = "Le numéro de téléphone est obligatoire")
    @Pattern(regexp = "^[\\+]?[0-9\\s\\-]{8,20}$", message = "Format de numéro de téléphone invalide")
    private String phoneNumber;

    @NotNull(message = "Le rôle est obligatoire")
    private Role role;

    @Builder.Default
    private UserStatus status = UserStatus.ACTIVE;

    // Champs optionnels si le compte créé est un Médecin
    private String medicalCouncilId;
    private String specialty;
    private String governorate;
    private String city;
    private String street;
    private Double consultationFee;
}
