package com.asa.workforce.notification;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Service;
import jakarta.annotation.PostConstruct;
import java.net.*;
import java.net.http.*;
import java.time.Duration;
import java.util.Map;

/** Adapter for an organisation-controlled HTTPS SMS gateway. No production console fallback. */
@Service @RequiredArgsConstructor @Slf4j
public class CredentialDeliveryService {
 private final ObjectMapper json;
 private final Environment environment;
 @Value("${app.delivery.url:}") private String url;
 @Value("${app.delivery.token:}") private String token;
 @Value("${app.otp.log-to-console:false}") private boolean console;
 private final HttpClient client=HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
 @PostConstruct void validate() {
   if(environment.acceptsProfiles(Profiles.of("production")) && (console || url.isBlank() || token.isBlank()))
     throw new IllegalStateException("Production requires a configured credential delivery gateway; console delivery is forbidden");
   if(!url.isBlank() && !"https".equals(URI.create(url).getScheme())) throw new IllegalStateException("Credential gateway must use HTTPS");
 }
 public void send(String phone,String message) {
   if(console && !environment.acceptsProfiles(Profiles.of("production"))) {
     log.info("[DEV CREDENTIAL DELIVERY] {}",message);return;
   }
   if(url.isBlank() || token.isBlank()) throw new IllegalStateException("Credential delivery is not configured");
   try {
     var request=HttpRequest.newBuilder(URI.create(url)).timeout(Duration.ofSeconds(15))
       .header("Authorization","Bearer "+token).header("Content-Type","application/json")
       .POST(HttpRequest.BodyPublishers.ofString(json.writeValueAsString(Map.of("to",phone,"message",message)))).build();
     var response=client.send(request,HttpResponse.BodyHandlers.discarding());
     if(response.statusCode()<200 || response.statusCode()>=300) throw new IllegalStateException("Credential delivery failed");
   } catch(InterruptedException ex) {
     Thread.currentThread().interrupt();throw new IllegalStateException("Credential delivery interrupted");
   } catch(java.io.IOException ex) { throw new IllegalStateException("Credential delivery unavailable"); }
 }
}
