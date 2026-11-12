package tn.maw3ed.api.modules.admin.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
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
public class AdminUpdateUserRequest {

    @NotBlank(message = "Le prénom est obligatoire")
    private String firstName;

    @NotBlank(message = "Le nom est obligatoire")
    private String lastName;

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "Format d'email invalide")
    private String email;

    @NotBlank(message = "Le numéro de téléphone est obligatoire")
    @Pattern(regexp = "^[\\+]?[0-9\\s\\-]{8,20}$", message = "Format de numéro de téléphone invalide")
    private String phoneNumber;

    @NotNull(message = "Le rôle est obligatoire")
    private Role role;

    @NotNull(message = "Le statut est obligatoire")
    private UserStatus status;

    private boolean emailVerified;

    // Nouveau mot de passe (optionnel, pour réinitialisation)
    private String newPassword;
}
