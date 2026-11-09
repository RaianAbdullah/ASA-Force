package com.asa.workforce.security;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.beans.factory.annotation.Value;
@Component @RequiredArgsConstructor
public class SharedRateLimitStore {
 private final JdbcTemplate jdbc;
 @Value("${app.rate-limit.shared:false}") private boolean enabled;
 public boolean allowed(String key,int max,long windowMs) {
   Integer count=jdbc.queryForObject("""
     INSERT INTO rate_limit_buckets(bucket_key, events, expires_at)
     VALUES (?, 1, CURRENT_TIMESTAMP + (? * interval '1 millisecond'))
     ON CONFLICT(bucket_key) DO UPDATE SET
       events = CASE WHEN rate_limit_buckets.expires_at <= CURRENT_TIMESTAMP THEN 1
                     ELSE LEAST(rate_limit_buckets.events + 1, ?) END,
       expires_at = CASE WHEN rate_limit_buckets.expires_at <= CURRENT_TIMESTAMP
                     THEN CURRENT_TIMESTAMP + (? * interval '1 millisecond')
                     ELSE rate_limit_buckets.expires_at END
     RETURNING events
     """,Integer.class,key,windowMs,max+1,windowMs);
   return count != null && count<=max;
 }
 public int remaining(String key,int max) {
   var counts=jdbc.queryForList("SELECT events FROM rate_limit_buckets WHERE bucket_key=? AND expires_at>CURRENT_TIMESTAMP",Integer.class,key);
   return counts.isEmpty()?max:Math.max(0,max-counts.get(0));
 }
 @Scheduled(fixedDelay=300000) public void clean() {
   if(enabled) jdbc.update("DELETE FROM rate_limit_buckets WHERE expires_at < CURRENT_TIMESTAMP");
 }
}
