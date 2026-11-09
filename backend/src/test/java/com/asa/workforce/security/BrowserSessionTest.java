package com.asa.workforce.security;
import com.asa.workforce.entity.Employee;
import com.asa.workforce.repository.EmployeeRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import jakarta.servlet.http.Cookie;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
@SpringBootTest @AutoConfigureMockMvc @ActiveProfiles("test")
class BrowserSessionTest {
 @Autowired MockMvc mvc; @Autowired EmployeeRepository employees;
 @Autowired BCryptPasswordEncoder passwords; @Autowired ObjectMapper json;
 Employee employee() {
   String id=UUID.randomUUID().toString().replace("-", "");
   return employees.save(Employee.builder().nationalId(id.substring(0,10)).phoneNumber(id.substring(0,15))
     .firstNameAr("Test").lastNameAr("Only").status(Employee.Status.ACTIVE)
     .passwordHash(passwords.encode("BrowserPassword!234")).role(Employee.Role.EMPLOYEE).roles(Set.of(Employee.Role.EMPLOYEE)).build());
 }
 @Test void browserLoginRequiresCustomHeader() throws Exception {
   mvc.perform(post("/v1/auth/browser/login").contentType("application/json")
     .content("{\"nationalId\":\"1234567890\",\"password\":\"ValidPassword123!\"}"))
     .andExpect(status().isForbidden());
 }
 @Test void untrustedOriginIsRejected() throws Exception {
   mvc.perform(post("/v1/auth/browser/refresh").header("X-ASA-Browser","1").header("Origin","https://untrusted.invalid"))
     .andExpect(status().isForbidden());
 }
 @Test void expiredBearerReturnsUnauthorizedRatherThanForbidden() throws Exception {
   mvc.perform(get("/v1/attendance/today").header("Authorization","Bearer invalid"))
     .andExpect(status().isUnauthorized());
 }
 @Test void cookieRefreshRotatesAndLogoutRevokes() throws Exception {
   Employee e=employee();
   // LoginRequest validates identifiers; use a unique numeric fixture.
   String id="8"+String.format("%09d", Math.abs(System.nanoTime()%1000000000));
   e.setNationalId(id);employees.save(e);
   var login=mvc.perform(post("/v1/auth/browser/login").header("X-ASA-Browser","1").contentType("application/json")
     .content(json.writeValueAsString(Map.of("nationalId",id,"password","BrowserPassword!234"))))
     .andExpect(status().isOk()).andReturn().getResponse();
   String header=login.getHeader("Set-Cookie");assertThat(header).contains("HttpOnly","Secure","SameSite=Lax");
   assertThat(json.readTree(login.getContentAsString()).path("data").path("refreshToken").isNull()).isTrue();
   String raw=header.substring("asa_refresh=".length(),header.indexOf(';'));
   var renewed=mvc.perform(post("/v1/auth/browser/refresh").header("X-ASA-Browser","1").cookie(new Cookie("asa_refresh",raw)))
     .andExpect(status().isOk()).andReturn().getResponse();
   String next=renewed.getHeader("Set-Cookie");assertThat(next).doesNotStartWith("asa_refresh="+raw+";");
   String token=json.readTree(renewed.getContentAsString()).path("data").path("accessToken").asText();
   String refresh=next.substring("asa_refresh=".length(),next.indexOf(';'));
   mvc.perform(post("/v1/auth/browser/logout").header("X-ASA-Browser","1").header("Authorization","Bearer "+token)
     .cookie(new Cookie("asa_refresh",refresh))).andExpect(status().isOk());
   mvc.perform(post("/v1/auth/browser/refresh").header("X-ASA-Browser","1").cookie(new Cookie("asa_refresh",refresh)))
     .andExpect(status().isUnauthorized());
 }
}
