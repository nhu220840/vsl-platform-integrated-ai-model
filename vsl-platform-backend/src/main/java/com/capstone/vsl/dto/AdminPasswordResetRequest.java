package com.capstone.vsl.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request body for admin-forced password resets.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminPasswordResetRequest {

    @NotBlank(message = "New password is required")
    private String newPassword;
}

