package tn.maw3ed.api.modules.triage.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TriageRequest {

    @NotBlank(message = "Veuillez décrire vos symptômes")
    @Size(min = 5, max = 2000, message = "La description des symptômes doit comporter entre 5 et 2000 caractères")
    private String symptoms;

    @Builder.Default
    private String language = "fr";
}
