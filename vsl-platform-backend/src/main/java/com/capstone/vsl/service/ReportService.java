package com.capstone.vsl.service;

import com.capstone.vsl.dto.ReportDTO;
import com.capstone.vsl.dto.ReportRequest;
import com.capstone.vsl.entity.Report;
import com.capstone.vsl.entity.ReportStatus;
import com.capstone.vsl.repository.DictionaryRepository;
import com.capstone.vsl.repository.ReportRepository;
import com.capstone.vsl.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Report Service
 * Handles user reports for dictionary entries with errors or issues
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ReportService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final DictionaryRepository dictionaryRepository;

    /**
     * Create a new report for a dictionary word
     *
     * @param request Report request with wordId and reason
     * @param username Username of the user submitting the report
     * @return Created report DTO
     * @throws IllegalArgumentException if user or word not found
     */
    @Transactional
    public ReportDTO createReport(ReportRequest request, String username) {
        log.info("Creating report for word ID: {} by user: {}", request.getWordId(), username);

        // Find user
        var user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));

        // Find dictionary word
        var dictionary = dictionaryRepository.findById(request.getWordId())
                .orElseThrow(() -> new IllegalArgumentException("Dictionary word not found: " + request.getWordId()));

        // Create report
        var report = Report.builder()
                .user(user)
                .dictionary(dictionary)
                .reason(request.getReason())
                .status(ReportStatus.OPEN)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        var savedReport = reportRepository.save(report);
        log.info("Report created successfully: id={}, word={}, user={}", 
                 savedReport.getId(), dictionary.getWord(), username);

        return reportToDTO(savedReport);
    }

    /**
     * Get all open reports (for admin)
     *
     * @return List of open reports
     */
    @Transactional(readOnly = true)
    public List<ReportDTO> getOpenReports() {
        var reports = reportRepository.findByStatus(ReportStatus.OPEN);
        log.info("Retrieved {} open reports", reports.size());
        return reports.stream()
                .map(this::reportToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get all reports (for admin, including resolved)
     *
     * @return List of all reports
     */
    @Transactional(readOnly = true)
    public List<ReportDTO> getAllReports() {
        var reports = reportRepository.findAll();
        log.info("Retrieved {} total reports", reports.size());
        return reports.stream()
                .map(this::reportToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get single report by ID
     *
     * @param id Report ID
     * @return Report DTO
     */
    @Transactional(readOnly = true)
    public ReportDTO getReportById(Long id) {
        var report = reportRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Report not found: " + id));
        return reportToDTO(report);
    }

    /**
     * Resolve a report (mark as RESOLVED)
     * Admin use this after reviewing and handling the reported issue
     *
     * @param id Report ID
     */
    @Transactional
    public ReportDTO resolveReport(Long id) {
        log.info("Resolving report: {}", id);

        var report = reportRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Report not found: " + id));

        report.setStatus(ReportStatus.RESOLVED);
        report.setUpdatedAt(LocalDateTime.now());
        reportRepository.save(report);

        log.info("Report resolved: id={}, word={}", id, report.getDictionary().getWord());
        
        return reportToDTO(report);
    }

    /**
     * Delete a report
     *
     * @param id Report ID
     */
    @Transactional
    public void deleteReport(Long id) {
        log.info("Deleting report: {}", id);

        var report = reportRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Report not found: " + id));

        reportRepository.delete(report);
        log.info("Report deleted: id={}", id);
    }

    /**
     * Convert Report entity to DTO
     */
    private ReportDTO reportToDTO(Report report) {
        return ReportDTO.builder()
                .id(report.getId())
                .dictionaryId(report.getDictionary().getId())
                .word(report.getDictionary().getWord())
                .reason(report.getReason())
                .status(report.getStatus())
                .createdAt(report.getCreatedAt())
                .updatedAt(report.getUpdatedAt())
                .build();
    }
}
