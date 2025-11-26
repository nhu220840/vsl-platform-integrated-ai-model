package com.capstone.vsl.service;

import com.capstone.vsl.dto.ContributionDTO;
import com.capstone.vsl.dto.ContributionRequest;
import com.capstone.vsl.entity.Contribution;
import com.capstone.vsl.entity.ContributionStatus;
import com.capstone.vsl.repository.ContributionRepository;
import com.capstone.vsl.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Contribution Service
 * Handles user contributions for new dictionary words
 * Contributions are created with PENDING status and require admin approval
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ContributionService {

    private final ContributionRepository contributionRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    /**
     * Create a new contribution
     * Stores the contribution data as JSON in stagingData field with PENDING status
     *
     * @param request Contribution request with word, definition, and videoUrl
     * @param username Username of the authenticated user creating the contribution
     * @return Created contribution DTO
     * @throws IllegalArgumentException if user not found or invalid data
     */
    @Transactional
    public ContributionDTO createContribution(ContributionRequest request, String username) {
        log.info("Creating contribution for user: {}, word: {}", username, request.getWord());

        // Find user by username
        var user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));

        // Convert request to JSON string for stagingData
        String stagingData;
        try {
            stagingData = objectMapper.writeValueAsString(request);
            log.debug("Staging data JSON: {}", stagingData);
        } catch (Exception e) {
            log.error("Failed to serialize contribution request to JSON: {}", e.getMessage(), e);
            throw new IllegalArgumentException("Failed to process contribution data: " + e.getMessage());
        }

        // Create contribution entity with PENDING status
        var contribution = Contribution.builder()
                .user(user)
                .stagingData(stagingData)
                .status(ContributionStatus.PENDING)
                .build();

        // Save to repository
        contribution = contributionRepository.save(contribution);
        log.info("Created contribution: id={}, word={}, status={}", 
                contribution.getId(), request.getWord(), contribution.getStatus());

        // Convert to DTO and return
        return contributionToDTO(contribution);
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
}

