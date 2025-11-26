package com.capstone.vsl.repository;

import com.capstone.vsl.entity.Dictionary;
import com.capstone.vsl.entity.User;
import com.capstone.vsl.entity.UserFavorite;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserFavoriteRepository extends JpaRepository<UserFavorite, Long> {

    boolean existsByUserAndDictionary(User user, Dictionary dictionary);

    void deleteByUserAndDictionary(User user, Dictionary dictionary);

    Page<UserFavorite> findByUserOrderBySavedAtDesc(User user, Pageable pageable);
}

