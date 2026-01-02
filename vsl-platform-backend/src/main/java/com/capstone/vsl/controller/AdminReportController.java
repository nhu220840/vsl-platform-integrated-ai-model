package com.capstone.vsl.controller;

import com.capstone.vsl.dto.ApiResponse;
import com.capstone.vsl.dto.ReportDTO;
import com.capstone.vsl.service.ReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Admin Report Controller
 * Handles admin operations for managing user reports about dictionary entries
 */
@RestController
@RequestMapping("/api/admin/reports")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class AdminReportController {

    private final ReportService reportService;

    /**
     * GET /api/admin/reports
     * Get all reports (ADMIN only)
     *
     * @return List of all reports
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ReportDTO>>> getAllReports() {
        try {
            log.info("Admin fetching all reports");
            var reports = reportService.getAllReports();
            return ResponseEntity.ok(ApiResponse.success(
                    String.format("Found %d report(s)", reports.size()),
                    reports
            ));
        } catch (Exception e) {
            log.error("Failed to get all reports: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to get reports: " + e.getMessage()));
        }
    }

    /**
     * GET /api/admin/reports/open
     * Get all open reports (ADMIN only)
     *
     * @return List of open reports
     */
    @GetMapping("/open")
    public ResponseEntity<ApiResponse<List<ReportDTO>>> getOpenReports() {
        try {
            log.info("Admin fetching open reports");
            var reports = reportService.getOpenReports();
            return ResponseEntity.ok(ApiResponse.success(
                    String.format("Found %d open report(s)", reports.size()),
                    reports
            ));
        } catch (Exception e) {
            log.error("Failed to get open reports: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to get open reports: " + e.getMessage()));
        }
    }

    /**
     * POST /api/admin/reports/{id}/resolve
     * Resolve a report by ID (ADMIN only)
     *
     * @param id Report ID to resolve
     * @return Resolved report DTO
     */
    @PostMapping("/{id}/resolve")
    public ResponseEntity<ApiResponse<ReportDTO>> resolveReport(@PathVariable Long id) {
        try {
            log.info("Admin resolving report with ID: {}", id);
            var report = reportService.resolveReport(id);
            return ResponseEntity.ok(ApiResponse.success("Report resolved successfully", report));
        } catch (IllegalArgumentException e) {
            log.warn("Invalid report ID: {}", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Report not found"));
        } catch (Exception e) {
            log.error("Failed to resolve report: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to resolve report: " + e.getMessage()));
        }
    }

    /**
     * DELETE /api/admin/reports/{id}
     * Delete a report by ID (ADMIN only)
     *
     * @param id Report ID to delete
     * @return Success response
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteReport(@PathVariable Long id) {
        try {
            log.info("Admin deleting report with ID: {}", id);
            reportService.deleteReport(id);
            return ResponseEntity.ok(ApiResponse.success("Report deleted successfully", null));
        } catch (IllegalArgumentException e) {
            log.warn("Invalid report ID: {}", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Report not found"));
        } catch (Exception e) {
            log.error("Failed to delete report: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to delete report: " + e.getMessage()));
        }
    }
}
