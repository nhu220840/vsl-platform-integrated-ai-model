package com.capstone.vsl.service;

import com.capstone.vsl.dto.FavoriteDTO;
import com.capstone.vsl.entity.UserFavorite;
import com.capstone.vsl.repository.DictionaryRepository;
import com.capstone.vsl.repository.UserFavoriteRepository;
import com.capstone.vsl.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * FavoriteService encapsulates business logic for managing user favorites.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FavoriteService {

    private static final int DEFAULT_PAGE_SIZE = 10;
    private static final int MAX_PAGE_SIZE = 50;

    private final UserRepository userRepository;
    private final DictionaryRepository dictionaryRepository;
    private final UserFavoriteRepository userFavoriteRepository;

    /**
     * Toggle favorite status for a dictionary word.
     *
     * @param wordId   dictionary entry id
     * @param username authenticated username
     * @return true if the word was added to favorites, false if it was removed
     */
    @Transactional
    public boolean toggleFavorite(Long wordId, String username) {
        var user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));

        var dictionary = dictionaryRepository.findById(wordId)
                .orElseThrow(() -> new IllegalArgumentException("Dictionary word not found: " + wordId));

        var exists = userFavoriteRepository.existsByUserAndDictionary(user, dictionary);
        if (exists) {
            userFavoriteRepository.deleteByUserAndDictionary(user, dictionary);
            log.info("Removed favorite for user={} wordId={}", username, wordId);
            return false;
        }

        var favorite = UserFavorite.builder()
                .user(user)
                .dictionary(dictionary)
                .build();

        userFavoriteRepository.save(favorite);
        log.info("Added favorite for user={} wordId={}", username, wordId);
        return true;
    }

    /**
     * Retrieve paginated favorites for a user.
     *
     * @param username username of authenticated user
     * @param page     requested page index
     * @param size     requested page size
     * @return page of favorite dictionary entries
     */
    @Transactional(readOnly = true)
    public Page<FavoriteDTO> getFavorites(String username, int page, int size) {
        var user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));

        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                normalizePageSize(size),
                Sort.by(Sort.Direction.DESC, "savedAt")
        );

        return userFavoriteRepository.findByUserOrderBySavedAtDesc(user, pageable)
                .map(this::mapToDto);
    }

    /**
     * Check if a word is favorited by the user.
     *
     * @param wordId   dictionary entry id
     * @param username authenticated username
     * @return true if favorited, otherwise false
     */
    @Transactional(readOnly = true)
    public boolean checkStatus(Long wordId, String username) {
        var user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));

        var dictionary = dictionaryRepository.findById(wordId)
                .orElseThrow(() -> new IllegalArgumentException("Dictionary word not found: " + wordId));

        return userFavoriteRepository.existsByUserAndDictionary(user, dictionary);
    }

    private FavoriteDTO mapToDto(UserFavorite favorite) {
        var dictionary = favorite.getDictionary();
        return FavoriteDTO.builder()
                .id(favorite.getId())
                .dictionaryId(dictionary.getId())
                .word(dictionary.getWord())
                .definition(dictionary.getDefinition())
                .videoUrl(dictionary.getVideoUrl())
                .savedAt(favorite.getSavedAt())
                .build();
    }

    private int normalizePageSize(int requestedSize) {
        if (requestedSize <= 0) {
            return DEFAULT_PAGE_SIZE;
        }
        return Math.min(requestedSize, MAX_PAGE_SIZE);
    }
}

