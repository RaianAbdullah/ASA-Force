package com.asa.workforce.auth.controller;

import com.asa.workforce.auth.dto.*;
import com.asa.workforce.auth.service.AuthService;
import com.asa.workforce.common.dto.ApiResponse;
import jakarta.servlet.http.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.time.Duration;

/** Cookie credentials are accepted only with a non-simple browser header.
 * CORS must allow only trusted, explicit origins; HTML forms cannot set this header.
 */
@RestController
@RequestMapping("/v1/auth/browser")
@RequiredArgsConstructor
public class BrowserAuthController {
    private final AuthService auth;
    @Value("${app.session.cookie-secure:true}") private boolean secure;

    private void requireBrowser(HttpServletRequest req) {
        if (!"1".equals(req.getHeader("X-ASA-Browser"))) throw new SecurityException("Browser header required");
    }
    private String cookie(String value, long days) {
        return ResponseCookie.from("asa_refresh", value).httpOnly(true).secure(secure)
                .sameSite("Lax").path("/").maxAge(Duration.ofDays(days)).build().toString();
    }
    private ResponseEntity<ApiResponse<LoginResponse>> session(LoginResponse data) {
        String header = cookie(data.getRefreshToken(), data.getRefreshExpiresInDays());
        data.setRefreshToken(null);
        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, header).body(ApiResponse.ok(data));
    }
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest body, HttpServletRequest req) {
        requireBrowser(req);
        return session(auth.login(body, req));
    }
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<LoginResponse>> refresh(@CookieValue(name="asa_refresh", required=false) String token, HttpServletRequest req) {
        requireBrowser(req);
        if (token == null || token.isBlank()) return ResponseEntity.status(401).body(ApiResponse.error("UNAUTHORIZED", "Sign in required"));
        RefreshRequest body = new RefreshRequest(); body.setRefreshToken(token);
        try { return session(auth.refresh(body, req)); }
        catch (IllegalStateException | SecurityException ex) {
            return ResponseEntity.status(401).header(HttpHeaders.SET_COOKIE, cookie("", 0))
                    .body(ApiResponse.error("UNAUTHORIZED", "Sign in required"));
        }
    }
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@RequestHeader("Authorization") String access,
            @CookieValue(name="asa_refresh", required=false) String token, HttpServletRequest req) {
        requireBrowser(req);
        LogoutRequest body = new LogoutRequest(); body.setRefreshToken(token);
        auth.logout(access, body, req);
        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, cookie("", 0)).body(ApiResponse.ok(null));
    }
}
