package com.capstone.vsl.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for User Favorite
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FavoriteDTO {
    private Long id;
    private Long dictionaryId;
    private String word;
    private String definition;
    private String videoUrl;
    private LocalDateTime savedAt;
}

