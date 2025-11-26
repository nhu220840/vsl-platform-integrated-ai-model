package com.capstone.vsl.service;

import com.capstone.vsl.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Encapsulates user self-service profile functionality.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserProfileService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Change the password for the authenticated user after verifying old password.
     *
     * @param username    current username
     * @param oldPassword submitted current password
     * @param newPassword new password to set
     */
    @Transactional
    public void changePassword(String username, String oldPassword, String newPassword) {
        var user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));

        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new IllegalArgumentException("Incorrect old password");
        }

        if (oldPassword != null && oldPassword.equals(newPassword)) {
            throw new IllegalArgumentException("New password must be different from the old password");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        log.info("User {} updated password", username);
    }
}

