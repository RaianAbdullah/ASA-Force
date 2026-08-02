package com.asa.workforce.attendance.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Validates GPS coordinates against the configured office geofence.
 *
 * Uses the Haversine formula — accurate to ~0.5% for distances < 10km,
 * well within tolerance for an office geofence check.
 *
 * Config (application.yml):
 *   app.geofence.latitude       Office latitude
 *   app.geofence.longitude      Office longitude
 *   app.geofence.radius-meters  Allowed radius (default 200m)
 */
@Service
@Slf4j
public class GeofenceService {

    private static final double EARTH_RADIUS_M = 6_371_000.0;

    @Value("${app.geofence.latitude}")
    private double officeLat;

    @Value("${app.geofence.longitude}")
    private double officeLng;

    @Value("${app.geofence.radius-meters:200}")
    private double radiusMeters;

    /**
     * Returns true if the given GPS point is within the office geofence.
     */
    public boolean isInsideGeofence(double lat, double lng) {
        double distance = haversine(officeLat, officeLng, lat, lng);
        log.debug("[GEOFENCE] Distance from office: {:.1f}m (limit: {}m)", distance, radiusMeters);
        return distance <= radiusMeters;
    }

    public double distanceMeters(double lat, double lng) {
        return haversine(officeLat, officeLng, lat, lng);
    }

    public double getRadiusMeters() { return radiusMeters; }

    // ── Haversine ─────────────────────────────────────────────────────────────

    private double haversine(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                 + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                 * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
