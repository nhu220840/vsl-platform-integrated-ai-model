package com.capstone.vsl.config;

import com.capstone.vsl.security.JwtAuthenticationFilter;
import com.capstone.vsl.security.RateLimitingFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Security Configuration
 * Defines security rules, authentication, and authorization for the application.
 * Configured for Spring Boot 3.3 with Next.js frontend and stateless JWT authentication.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final UserDetailsService userDetailsService;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final RateLimitingFilter rateLimitingFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        var authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    /**
     * CORS Configuration Source
     * Configures CORS for Next.js Frontend (and Vite as backup)
     * 
     * Allowed Origins:
     * - http://localhost:3000 (Primary - Next.js)
     * - http://localhost:5173 (Backup - Vite)
     * - http://localhost:8080 (Self - Backend)
     * 
     * Important: When allowCredentials is true, you cannot use "*" for allowedOrigins.
     * Must specify exact origins.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        var corsConfig = new CorsConfiguration();
        
        // Allow specific frontend origins
        corsConfig.setAllowedOrigins(Arrays.asList(
                "http://localhost:3000",  // Primary - Next.js
                "http://localhost:5173",  // Backup - Vite
                "http://localhost:8080"   // Self - Backend
        ));
        
        // Allow specific HTTP methods
        corsConfig.setAllowedMethods(Arrays.asList(
                "GET", "POST", "PUT", "DELETE", "OPTIONS"
        ));
        
        // Allow specific headers (including Authorization for Bearer token and CORS preflight headers)
        corsConfig.setAllowedHeaders(Arrays.asList(
                "Authorization",
                "Content-Type",
                "X-Requested-With",
                "Accept",
                "Origin",
                "Access-Control-Request-Method",
                "Access-Control-Request-Headers"
        ));
        
        // Allow credentials (cookies, authorization headers)
        corsConfig.setAllowCredentials(true);
        
        // Expose Authorization header to frontend
        corsConfig.setExposedHeaders(List.of("Authorization"));
        
        // Apply CORS configuration to all paths
        var source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", corsConfig);
        
        return source;
    }

    /**
     * Security Filter Chain
     * Configures the security filter chain using Lambda DSL (Spring Security 6 standard)
     * 
     * Security Rules:
     * - CSRF disabled (not needed for stateless REST API)
     * - CORS enabled with custom configuration
     * - Stateless session management (JWT-based)
     * - Public endpoints: auth, dictionary search, VSL endpoints (recognize/spell), Swagger UI
     * - User endpoints require authentication
     * - Admin endpoints require ROLE_ADMIN
     * - All other requests require authentication
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // Disable CSRF for stateless JWT authentication (REST API)
            .csrf(csrf -> csrf.disable())
            
            // Enable CORS with custom configuration source
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            
            // Set session creation policy to STATELESS (JWT-based)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            
            // Configure authorization rules
            .authorizeHttpRequests(auth -> auth
                // Public endpoints (no authentication required)
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/vsl/**").permitAll()  // Gesture recognition and spelling (public)
                .requestMatchers("/api/dictionary/search/**").permitAll()
                .requestMatchers("/api/dictionary/detail/**").permitAll()
                
                // Swagger UI endpoints (public for development)
                .requestMatchers("/v3/api-docs/**").permitAll()
                .requestMatchers("/swagger-ui/**").permitAll()
                .requestMatchers("/swagger-ui.html").permitAll()
                
                // User endpoints (require authenticated user/admin)
                .requestMatchers("/api/user/favorites/**").hasAnyRole("USER", "ADMIN")
                .requestMatchers("/api/user/contributions/**").hasAnyRole("USER", "ADMIN")
                .requestMatchers("/api/user/reports/**").hasAnyRole("USER", "ADMIN")
                .requestMatchers("/api/user/profile/**").hasAnyRole("USER", "ADMIN")
                .requestMatchers("/api/user/history/**").hasAnyRole("USER", "ADMIN")

                // Admin endpoints (strictly ROLE_ADMIN)
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                
                // All other requests require authentication
                .anyRequest().authenticated()
            )
            
            // Set authentication provider
            .authenticationProvider(authenticationProvider())
            
            // Add filters before the standard UsernamePasswordAuthenticationFilter
            .addFilterBefore(rateLimitingFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
