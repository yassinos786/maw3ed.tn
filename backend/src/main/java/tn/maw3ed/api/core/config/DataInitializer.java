package tn.maw3ed.api.core.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import tn.maw3ed.api.modules.iam.model.Role;
import tn.maw3ed.api.modules.iam.model.User;
import tn.maw3ed.api.modules.iam.model.UserStatus;
import tn.maw3ed.api.modules.iam.repository.UserRepository;

import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.findByEmail("admin@maw3ed.tn").isEmpty()) {
            User admin = User.builder()
                    .firstName("Super")
                    .lastName("Admin")
                    .email("admin@maw3ed.tn")
                    .passwordHash(passwordEncoder.encode("Admin123!"))
                    .phoneNumber("+21671000000")
                    .roles(Set.of(Role.ROLE_ADMIN))
                    .status(UserStatus.ACTIVE)
                    .emailVerified(true)
                    .build();
            userRepository.save(admin);
            log.info("Compte Super Administrateur initialisé : admin@maw3ed.tn");
        }
    }
}
