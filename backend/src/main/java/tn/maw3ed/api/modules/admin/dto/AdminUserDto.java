package tn.maw3ed.api.modules.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.maw3ed.api.modules.iam.model.Role;
import tn.maw3ed.api.modules.iam.model.UserStatus;

import java.time.Instant;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserDto {
    private String id;
    private String firstName;
    private String lastName;
    private String email;
    private String phoneNumber;
    private Set<Role> roles;
    private UserStatus status;
    private boolean emailVerified;
    private Instant createdAt;
}
