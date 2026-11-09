package com.asa.workforce.security;
import org.junit.jupiter.api.Test;
import java.util.concurrent.*;
import java.util.stream.IntStream;
import static org.assertj.core.api.Assertions.*;
class RateLimitConcurrencyTest {
 @Test void concurrentRequestsCannotExceedLimit() throws Exception {
   RateLimitService limiter=new RateLimitService();ExecutorService pool=Executors.newFixedThreadPool(16);
   try {
     var tasks=IntStream.range(0,100).<Callable<Boolean>>mapToObj(i->()->limiter.isAllowed("same",10,60000)).toList();
     int allowed=0;for(var result:pool.invokeAll(tasks)) if(result.get()) allowed++;
     assertThat(allowed).isEqualTo(10);
   } finally {pool.shutdownNow();}
 }
}
