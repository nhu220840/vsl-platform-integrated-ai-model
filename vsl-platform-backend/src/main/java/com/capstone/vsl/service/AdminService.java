package com.capstone.vsl.service;

import com.capstone.vsl.dto.ContributionDTO;
import com.capstone.vsl.dto.DashboardStatsDTO;
import com.capstone.vsl.dto.DictionaryDTO;
import com.capstone.vsl.dto.UserDTO;
import com.capstone.vsl.entity.Contribution;
import com.capstone.vsl.entity.ContributionStatus;
import com.capstone.vsl.entity.Role;
import com.capstone.vsl.entity.User;
import com.capstone.vsl.repository.ContributionRepository;
import com.capstone.vsl.repository.DictionaryRepository;
import com.capstone.vsl.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Admin Service
 * Handles administrative operations:
 * - User management (listing, role updates, password resets)
 * - Approving contributions (moving to dictionary)
 * - Getting dashboard statistics
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final ContributionRepository contributionRepository;
    private final DictionaryRepository dictionaryRepository;
    private final UserRepository userRepository;
    private final DictionaryService dictionaryService;
    private final ObjectMapper objectMapper;
    private final PasswordEncoder passwordEncoder;

    /**
     * Approve a contribution
     * Process:
     * 1. Move data from Contribution table to Dictionary table
     * 2. Sync new word to Elasticsearch
     * 3. Update status in Contribution table to APPROVED
     *
     * @param contributionId ID of the contribution to approve
     * @return Created dictionary entry
     * @throws IllegalArgumentException if contribution not found or already processed
     */
    @Transactional
    public DictionaryDTO approveContribution(Long contributionId) {
        log.info("Approving contribution with ID: {}", contributionId);

        // Find contribution with PENDING status
        var contribution = contributionRepository
                .findByIdAndStatus(contributionId, ContributionStatus.PENDING)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Contribution not found or already processed: " + contributionId));

        try {
            // Parse staging data (JSON format: {"word": "...", "definition": "...", "videoUrl": "..."})
            var stagingData = parseStagingData(contribution.getStagingData());
            log.debug("Parsed staging data: word='{}', definition='{}', videoUrl='{}'",
                    stagingData.getWord(), stagingData.getDefinition(), stagingData.getVideoUrl());

            // Check if word already exists in dictionary
            if (dictionaryRepository.existsByWordIgnoreCase(stagingData.getWord())) {
                // Update contribution status to REJECTED (word already exists)
                contribution.setStatus(ContributionStatus.REJECTED);
                contributionRepository.save(contribution);
                throw new IllegalArgumentException("Word already exists in dictionary: " + stagingData.getWord());
            }

            // Step 1: Create dictionary entry from contribution data
            var dictionaryDTO = DictionaryDTO.builder()
                    .word(stagingData.getWord())
                    .definition(stagingData.getDefinition())
                    .videoUrl(stagingData.getVideoUrl())
                    .build();

            // This will save to PostgreSQL and sync to Elasticsearch asynchronously
            var createdDictionary = dictionaryService.createWord(dictionaryDTO);
            log.info("Created dictionary entry from contribution: word='{}', id={}",
                    createdDictionary.getWord(), createdDictionary.getId());

            // Step 2: Update contribution status to APPROVED
            contribution.setStatus(ContributionStatus.APPROVED);
            contributionRepository.save(contribution);
            log.info("Updated contribution status to APPROVED: contributionId={}", contributionId);

            return createdDictionary;

        } catch (IllegalArgumentException e) {
            // Re-throw validation errors
            throw e;
        } catch (Exception e) {
            log.error("Failed to approve contribution {}: {}", contributionId, e.getMessage(), e);
            // Update contribution status to REJECTED on error
            contribution.setStatus(ContributionStatus.REJECTED);
            contributionRepository.save(contribution);
            throw new RuntimeException("Failed to approve contribution: " + e.getMessage(), e);
        }
    }

    /**
     * Get dashboard statistics
     * Returns counts of:
     * - Total Users
     * - Total Words in Dictionary
     * - Pending Contributions
     *
     * @return Dashboard statistics
     */
    @Transactional(readOnly = true)
    public DashboardStatsDTO getDashboardStats() {
        var totalUsers = userRepository.count();
        var totalWords = dictionaryRepository.count();
        var pendingContributions = contributionRepository.countByStatus(ContributionStatus.PENDING);

        log.debug("Dashboard stats: users={}, words={}, pending={}",
                totalUsers, totalWords, pendingContributions);

        return DashboardStatsDTO.builder()
                .totalUsers(totalUsers)
                .totalWords(totalWords)
                .pendingContributions(pendingContributions)
                .build();
    }

    /**
     * Get all users with their details
     *
     * @return List of all users
     */
    @Transactional(readOnly = true)
    public Page<UserDTO> getUsers(int page, int size) {
        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.min(Math.max(size, 1), 50),
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        var result = userRepository.findAll(pageable)
                .map(this::userToDTO);

        log.debug("Retrieved {} users (page={}, size={})", result.getNumberOfElements(), page, size);
        return result;
    }

    /**
     * Update user role
     * Prevents admin from changing their own role
     *
     * @param userId ID of user to update
     * @param newRole New role to assign
     * @param currentAdminId ID of current admin (to prevent self-role change)
     * @return Updated user DTO
     * @throws IllegalArgumentException if user not found or trying to change own role
     */
    @Transactional
    public UserDTO updateUserRole(Long userId, Role newRole, Long currentAdminId) {
        log.info("Updating user role: userId={}, newRole={}, currentAdminId={}", userId, newRole, currentAdminId);

        // Prevent admin from changing their own role
        if (userId.equals(currentAdminId)) {
            throw new IllegalArgumentException("Cannot change your own role");
        }

        var user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        var oldRole = user.getRole();
        user.setRole(newRole);
        user = userRepository.save(user);

        log.info("Updated user role: userId={}, oldRole={}, newRole={}", userId, oldRole, newRole);
        return userToDTO(user);
    }

    /**
     * Force reset a user's password (admin action).
     *
     * @param userId     target user id
     * @param newPassword raw new password
     */
    @Transactional
    public void resetUserPassword(Long userId, String newPassword) {
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        log.info("Admin reset password for userId={}", userId);
    }

    /**
     * Get contributions by status
     *
     * @param status Contribution status (PENDING, APPROVED, REJECTED)
     * @return List of contributions with the specified status
     */
    @Transactional(readOnly = true)
    public List<ContributionDTO> getContributionsByStatus(ContributionStatus status) {
        var contributions = contributionRepository.findByStatus(status);
        log.debug("Retrieved {} contributions with status: {}", contributions.size(), status);
        return contributions.stream()
                .map(this::contributionToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Reject a contribution
     * Updates contribution status to REJECTED
     *
     * @param contributionId ID of the contribution to reject
     * @throws IllegalArgumentException if contribution not found or already processed
     */
    @Transactional
    public void rejectContribution(Long contributionId) {
        log.info("Rejecting contribution with ID: {}", contributionId);

        var contribution = contributionRepository.findById(contributionId)
                .orElseThrow(() -> new IllegalArgumentException("Contribution not found: " + contributionId));

        if (contribution.getStatus() != ContributionStatus.PENDING) {
            throw new IllegalArgumentException("Contribution is not pending: " + contributionId);
        }

        contribution.setStatus(ContributionStatus.REJECTED);
        contributionRepository.save(contribution);
        log.info("Rejected contribution: contributionId={}", contributionId);
    }

    /**
     * Convert User entity to DTO
     */
    private UserDTO userToDTO(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    /**
     * Convert Contribution entity to DTO
     */
    private ContributionDTO contributionToDTO(Contribution contribution) {
        return ContributionDTO.builder()
                .id(contribution.getId())
                .userId(contribution.getUser().getId())
                .username(contribution.getUser().getUsername())
                .stagingData(contribution.getStagingData())
                .status(contribution.getStatus())
                .createdAt(contribution.getCreatedAt())
                .updatedAt(contribution.getUpdatedAt())
                .build();
    }

    /**
     * Parse staging data JSON string to DictionaryDTO
     * Expected format: {"word": "...", "definition": "...", "videoUrl": "..."}
     *
     * @param stagingData JSON string from contribution
     * @return Parsed dictionary data
     */
    private DictionaryDTO parseStagingData(String stagingData) {
        try {
            return objectMapper.readValue(stagingData, DictionaryDTO.class);
        } catch (Exception e) {
            log.error("Failed to parse staging data: {}", stagingData, e);
            throw new IllegalArgumentException("Invalid staging data format: " + e.getMessage());
        }
    }
}

