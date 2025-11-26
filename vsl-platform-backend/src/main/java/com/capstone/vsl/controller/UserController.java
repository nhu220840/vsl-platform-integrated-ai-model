package com.capstone.vsl.controller;

import com.capstone.vsl.dto.ApiResponse;
import com.capstone.vsl.dto.PasswordChangeRequest;
import com.capstone.vsl.security.UserPrincipal;
import com.capstone.vsl.service.UserProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoints for authenticated user profile management.
 */
@RestController
@RequestMapping("/api/user/profile")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("isAuthenticated()")
public class UserController {

    private final UserProfileService userProfileService;

    @PutMapping("/password")
    public ResponseEntity<ApiResponse<String>> updatePassword(
            @Valid @RequestBody PasswordChangeRequest request,
            Authentication authentication) {
        try {
            var username = ((UserPrincipal) authentication.getPrincipal()).getUsername();
            userProfileService.changePassword(username, request.getOldPassword(), request.getNewPassword());

            return ResponseEntity.ok(ApiResponse.success("Password updated successfully", "ok"));
        } catch (IllegalArgumentException e) {
            log.warn("Password update failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error updating password", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to update password: " + e.getMessage()));
        }
    }
}

