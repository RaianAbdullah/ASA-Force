package com.asa.workforce.config;
import com.asa.workforce.entity.Employee;
import com.asa.workforce.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.util.Set;

@Component @RequiredArgsConstructor
@ConditionalOnProperty(name="app.bootstrap.enabled",havingValue="true")
public class BootstrapAdmin implements ApplicationRunner {
 private final EmployeeRepository employees;
 private final BCryptPasswordEncoder passwords;
 private final Environment env;
 @Override @Transactional public void run(ApplicationArguments args) {
   if (!employees.findActiveByRole(Employee.Role.SYSTEM_ADMIN).isEmpty())
     throw new IllegalStateException("Disable bootstrap: an active system administrator already exists");
   String id=env.getRequiredProperty("BOOTSTRAP_NATIONAL_ID"), password=env.getRequiredProperty("BOOTSTRAP_PASSWORD");
   String phone=env.getRequiredProperty("BOOTSTRAP_PHONE");
   if (!id.matches("[0-9]{10}") || password.length()<16 || password.contains(id))
     throw new IllegalStateException("Bootstrap requires a valid identifier and a unique password of at least 16 characters");
   Employee e=employees.findByNationalId(id).orElseGet(Employee::new);
   e.setNationalId(id);e.setPhoneNumber(phone);
   e.setFirstNameAr(env.getRequiredProperty("BOOTSTRAP_FIRST_NAME"));
   e.setLastNameAr(env.getRequiredProperty("BOOTSTRAP_LAST_NAME"));
   e.setPasswordHash(passwords.encode(password));e.setRole(Employee.Role.SYSTEM_ADMIN);
   e.setRoles(Set.of(Employee.Role.SYSTEM_ADMIN));e.setStatus(Employee.Status.ACTIVE);
   e.setMustChangePassword(true);e.setPasswordChangedAt(java.time.OffsetDateTime.now());
   e.setLoginAttempts((short)0);e.setOtpAttempts((short)0);e.setLoginLockedUntil(null);
   employees.save(e);
 }
}
