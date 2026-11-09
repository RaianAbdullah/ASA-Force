package com.asa.workforce.security;
import com.asa.workforce.auth.service.AuthService;
import com.asa.workforce.auth.dto.*;
import com.asa.workforce.entity.*;
import com.asa.workforce.repository.*;
import com.asa.workforce.message.service.*;
import com.asa.workforce.message.repository.MessageRepository;
import com.asa.workforce.message.dto.CreateMessageRequest;
import com.asa.workforce.attendance.service.AttendanceService;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.mock.web.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import java.time.*;
import java.util.*;
import static org.assertj.core.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class SecurityRegressionTest {
 @Autowired EmployeeRepository employees;
 @Autowired DepartmentRepository departments;
 @Autowired RefreshTokenRepository tokens;
 @Autowired MessageRepository messages;
 @Autowired AuthService auth;
 @Autowired RefreshTokenService refresh;
 @Autowired MessageService chat;
 @Autowired AttendanceService attendance;
 @Autowired com.asa.workforce.admin.service.AdminService admin;
 @Autowired BCryptPasswordEncoder encoder;
 @Autowired AttachmentValidator validator;
 Employee employee(Department dept, Employee.Role role) {
   String suffix = UUID.randomUUID().toString().replace("-", "");
   return employees.save(Employee.builder().nationalId(suffix.substring(0,10))
     .firstNameAr("Test").lastNameAr("Only").phoneNumber(suffix.substring(0,15))
     .passwordHash(encoder.encode("ValidPassword!234")).status(Employee.Status.ACTIVE)
     .department(dept).role(role).roles(Set.of(role)).build());
 }
 Department department() {
   return departments.save(Department.builder().nameEn("Test").nameAr("Test")
       .code(UUID.randomUUID().toString().substring(0,8)).build());
 }
 @Test void failedLoginAttemptsCommitAndLockAccount() {
   Employee e=employee(null, Employee.Role.EMPLOYEE);
   LoginRequest req=new LoginRequest();req.setNationalId(e.getNationalId());req.setPassword("wrong");
   for(int i=0;i<5;i++) assertThatThrownBy(()->auth.login(req,new MockHttpServletRequest())).isInstanceOf(IllegalArgumentException.class);
   assertThat(employees.findById(e.getId()).orElseThrow().getLoginLockedUntil()).isAfter(OffsetDateTime.now());
   req.setPassword("ValidPassword!234");
   assertThatThrownBy(()->auth.login(req,new MockHttpServletRequest())).isInstanceOf(IllegalStateException.class);
 }
 @Test void failedOtpAttemptsCommit() {
   Employee e=employee(null,Employee.Role.EMPLOYEE);e.setStatus(Employee.Status.PENDING_VERIFICATION);
   e.setOtpCode(encoder.encode("123456"));e.setOtpExpiresAt(OffsetDateTime.now().plusMinutes(5));employees.save(e);
   VerifyOtpRequest req=new VerifyOtpRequest();req.setNationalId(e.getNationalId());req.setOtpCode("999999");
   assertThatThrownBy(()->auth.verifyOtp(req,new MockHttpServletRequest())).isInstanceOf(IllegalArgumentException.class);
   assertThat(employees.findById(e.getId()).orElseThrow().getOtpAttempts()).isEqualTo((short)1);
 }
 @Test void refreshReuseRevokesReplacementEvenWhenOuterServiceThrows() {
   Employee e=employee(null,Employee.Role.EMPLOYEE);String raw=refresh.createForEmployee(e,"test");
   RefreshRequest req=new RefreshRequest();req.setRefreshToken(raw);
   LoginResponse replacement=auth.refresh(req,new MockHttpServletRequest());
   assertThatThrownBy(()->auth.refresh(req,new MockHttpServletRequest())).isInstanceOf(IllegalStateException.class);
   req.setRefreshToken(replacement.getRefreshToken());
   assertThatThrownBy(()->auth.refresh(req,new MockHttpServletRequest())).isInstanceOf(IllegalStateException.class);
   assertThat(tokens.findActiveByEmployeeId(e.getId(),OffsetDateTime.now())).isEmpty();
 }
 @Test void inactiveAccountCannotRefresh() {
   Employee e=employee(null,Employee.Role.EMPLOYEE);String raw=refresh.createForEmployee(e,"test");
   e.setStatus(Employee.Status.SUSPENDED);employees.save(e);
   RefreshRequest req=new RefreshRequest();req.setRefreshToken(raw);
   assertThatThrownBy(()->auth.refresh(req,new MockHttpServletRequest())).isInstanceOf(IllegalStateException.class);
   assertThat(tokens.findActiveByEmployeeId(e.getId(),OffsetDateTime.now())).isEmpty();
 }
 @Test void departmentManagerCannotReadOtherDepartmentOrUnscopedAttendance() {
   Department a=department(), b=department();Employee manager=employee(a,Employee.Role.DEPARTMENT_MANAGER);
   a.setManager(manager);departments.save(a);
   Employee foreign=employee(b,Employee.Role.EMPLOYEE);
   assertThat(admin.listAllEmployees(manager.getNationalId())).noneMatch(dto->dto.getId().equals(foreign.getId()));
   assertThatThrownBy(()->attendance.getDaySummary(manager.getNationalId(),LocalDate.now(),b.getId())).isInstanceOf(SecurityException.class);
   assertThat(attendance.getDaySummary(manager.getNationalId(),LocalDate.now(),null).getTotalActive()).isEqualTo(1);
 }
 @Test void messagesAndAttachmentsStayInTheirOriginalDepartment() throws Exception {
   Department a=department(),b=department();Employee sender=employee(a,Employee.Role.EMPLOYEE),same=employee(a,Employee.Role.EMPLOYEE),other=employee(b,Employee.Role.EMPLOYEE);
   var created=chat.send(sender.getNationalId(),new CreateMessageRequest("Private department content"));
   assertThat(chat.listRecent(same.getNationalId())).anyMatch(m->m.id().equals(created.id()));
   assertThat(chat.listRecent(other.getNationalId())).noneMatch(m->m.id().equals(created.id()));
   var uploaded=chat.sendWithAttachment(sender.getNationalId(),null,new MockMultipartFile("file","note.txt","text/plain","Hello".getBytes()));
   String filename=uploaded.attachmentUrl().substring(uploaded.attachmentUrl().lastIndexOf('/')+1);
   assertThat(chat.resolveAttachment(same.getNationalId(),filename).getContentAsByteArray()).isEqualTo("Hello".getBytes());
   assertThatThrownBy(()->chat.resolveAttachment(other.getNationalId(),filename)).isInstanceOf(NoSuchElementException.class);
   assertThatThrownBy(()->chat.delete(other.getNationalId(),created.id())).isInstanceOf(NoSuchElementException.class);
   sender.setDepartment(b);employees.save(sender);
   assertThat(chat.listRecent(other.getNationalId())).noneMatch(m->m.id().equals(created.id()));
 }
 @Test void rejectsDisguisedExecutableAndAllowsPlainText() throws Exception {
   assertThatThrownBy(()->validator.validate(new MockMultipartFile("file","fake.png","image/png","MZ fake executable".getBytes()),"png")).isInstanceOf(IllegalArgumentException.class);
   validator.validate(new MockMultipartFile("file","note.txt","text/plain","Hello".getBytes()),"txt");
   assertThatThrownBy(()->validator.validate(new MockMultipartFile("file","old.doc","application/msword",new byte[]{1,2}),"doc")).isInstanceOf(IllegalArgumentException.class);
 }
 @Test void rejectsMalformedRefreshToken() {
   assertThatThrownBy(()->refresh.rotate("invalid")).isInstanceOf(SecurityException.class);
 }
}
