package com.capstone.vsl.controller;

import com.capstone.vsl.dto.AdminPasswordResetRequest;
import com.capstone.vsl.dto.ApiResponse;
import com.capstone.vsl.dto.ContributionDTO;
import com.capstone.vsl.dto.DashboardStatsDTO;
import com.capstone.vsl.dto.DictionaryDTO;
import com.capstone.vsl.dto.RoleUpdateRequest;
import com.capstone.vsl.dto.UserDTO;
import com.capstone.vsl.entity.ContributionStatus;
import com.capstone.vsl.security.UserPrincipal;
import com.capstone.vsl.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Admin Controller
 * Handles administrative operations
 * All endpoints require ADMIN role
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    // ==================== User Management ====================

    /**
     * GET /api/admin/users
     * List users with pagination.
     *
     * @param page page index (0-based)
     * @param size page size (max 50)
     * @return paginated users
     */
    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<UserDTO>>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            var users = adminService.getUsers(page, size);
            return ResponseEntity.ok(ApiResponse.success("Users retrieved", users));
        } catch (Exception e) {
            log.error("Failed to get users: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to retrieve users: " + e.getMessage()));
        }
    }

    /**
     * PUT /api/admin/users/{userId}/role
     * Change a user's role
     * Request Body: {"role": "ADMIN"} or {"role": "USER"}
     * 
     * Prevents the admin from changing their own role
     *
     * @param userId ID of user to update
     * @param request Role update request
     * @param authentication Current authentication (to get current admin ID)
     * @return Updated user DTO
     */
    @PutMapping("/users/{userId}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserDTO>> updateUserRole(
            @PathVariable Long userId,
            @Valid @RequestBody RoleUpdateRequest request,
            Authentication authentication) {
        try {
            // Get current admin ID from authentication
            var userPrincipal = (UserPrincipal) authentication.getPrincipal();
            var currentAdminId = userPrincipal.getId();

            var updatedUser = adminService.updateUserRole(userId, request.getRole(), currentAdminId);
            return ResponseEntity.ok(ApiResponse.success(
                    "User role updated successfully",
                    updatedUser
            ));
        } catch (IllegalArgumentException e) {
            log.warn("Invalid request to update user role {}: {}", userId, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Failed to update user role {}: {}", userId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to update user role: " + e.getMessage()));
        }
    }

    /**
     * PUT /api/admin/users/{userId}/reset-password
     * Force resets the user's password without old password requirement.
     *
     * @param userId  target user id
     * @param request new password payload
     * @return success acknowledgment
     */
    @PutMapping("/users/{userId}/reset-password")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> resetUserPassword(
            @PathVariable Long userId,
            @Valid @RequestBody AdminPasswordResetRequest request) {
        try {
            adminService.resetUserPassword(userId, request.getNewPassword());
            return ResponseEntity.ok(ApiResponse.success("Password reset successfully", "ok"));
        } catch (IllegalArgumentException e) {
            log.warn("Failed to reset password for user {}: {}", userId, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error resetting password for user {}: {}", userId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to reset password: " + e.getMessage()));
        }
    }

    // ==================== Contribution Management ====================

    /**
     * GET /api/admin/contributions?status=PENDING
     * View contributions by status
     *
     * @param status Contribution status (PENDING, APPROVED, REJECTED). Defaults to PENDING
     * @return List of contributions with the specified status
     */
    @GetMapping("/contributions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<ContributionDTO>>> getContributions(
            @RequestParam(defaultValue = "PENDING") ContributionStatus status) {
        try {
            var contributions = adminService.getContributionsByStatus(status);
            return ResponseEntity.ok(ApiResponse.success(
                    String.format("Retrieved %d %s contributions", contributions.size(), status),
                    contributions
            ));
        } catch (Exception e) {
            log.error("Failed to get contributions: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to retrieve contributions: " + e.getMessage()));
        }
    }

    /**
     * POST /api/admin/contributions/{id}/approve
     * Approve a contribution and move it to the dictionary
     * 
     * Process:
     * 1. Move data from Contribution table to Dictionary table
     * 2. Sync new word to Elasticsearch
     * 3. Mark contribution as APPROVED
     *
     * @param id ID of the contribution to approve
     * @return Created dictionary entry
     */
    @PostMapping("/contributions/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<DictionaryDTO>> approveContribution(
            @PathVariable Long id) {
        try {
            log.info("Admin approving contribution: {}", id);
            var dictionary = adminService.approveContribution(id);
            
            return ResponseEntity.ok(ApiResponse.success(
                    "Contribution approved and added to dictionary",
                    dictionary
            ));
        } catch (IllegalArgumentException e) {
            log.warn("Invalid request to approve contribution {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Failed to approve contribution {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to approve contribution: " + e.getMessage()));
        }
    }

    /**
     * POST /api/admin/contributions/{id}/reject
     * Reject a contribution
     * Marks contribution as REJECTED
     *
     * @param id ID of the contribution to reject
     * @return Success message
     */
    @PostMapping("/contributions/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> rejectContribution(
            @PathVariable Long id) {
        try {
            log.info("Admin rejecting contribution: {}", id);
            adminService.rejectContribution(id);
            
            return ResponseEntity.ok(ApiResponse.success(
                    "Contribution rejected successfully",
                    "Contribution " + id + " has been rejected"
            ));
        } catch (IllegalArgumentException e) {
            log.warn("Invalid request to reject contribution {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Failed to reject contribution {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to reject contribution: " + e.getMessage()));
        }
    }

    // ==================== Statistics ====================

    /**
     * GET /api/admin/stats
     * Get dashboard statistics
     * Returns count of Users, Total Words, Pending Contributions for dashboard widgets
     *
     * @return Dashboard statistics
     */
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<DashboardStatsDTO>> getStats() {
        try {
            var stats = adminService.getDashboardStats();
            return ResponseEntity.ok(ApiResponse.success("Dashboard statistics retrieved", stats));
        } catch (Exception e) {
            log.error("Failed to get dashboard stats: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to retrieve dashboard statistics: " + e.getMessage()));
        }
    }
}
