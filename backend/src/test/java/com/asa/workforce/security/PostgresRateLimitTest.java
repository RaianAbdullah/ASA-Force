package com.asa.workforce.security;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.jdbc.core.JdbcTemplate;
import java.util.UUID;
import java.util.concurrent.*;
import java.util.stream.IntStream;
import static org.assertj.core.api.Assertions.*;
@SpringBootTest @ActiveProfiles("test")
@EnabledIfSystemProperty(named="spring.datasource.driver-class-name", matches="org.postgresql.Driver")
class PostgresRateLimitTest {
 @Autowired JdbcTemplate jdbc;
 @Test void atomicLimitIsSharedByIndependentInstancesAndSurvivesNewInstance() throws Exception {
   var a=new SharedRateLimitStore(jdbc);var b=new SharedRateLimitStore(jdbc);
   String key="test:"+UUID.randomUUID();var pool=Executors.newFixedThreadPool(12);
   try {
     var tasks=IntStream.range(0,40).<Callable<Boolean>>mapToObj(i->()->(i%2==0?a:b).allowed(key,5,60000)).toList();
     int accepted=0;for(var result:pool.invokeAll(tasks)) if(result.get()) accepted++;
     assertThat(accepted).isEqualTo(5);
     assertThat(new SharedRateLimitStore(jdbc).allowed(key,5,60000)).isFalse();
     jdbc.update("UPDATE rate_limit_buckets SET expires_at=CURRENT_TIMESTAMP-interval '1 second' WHERE bucket_key=?",key);
     assertThat(b.allowed(key,5,60000)).isTrue();
   } finally { pool.shutdownNow();jdbc.update("DELETE FROM rate_limit_buckets WHERE bucket_key=?",key); }
 }
}
