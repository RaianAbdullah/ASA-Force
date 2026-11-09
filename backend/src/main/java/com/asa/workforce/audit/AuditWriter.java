package com.asa.workforce.audit;
import com.asa.workforce.entity.AuditLog;
import com.asa.workforce.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.*;
import org.springframework.transaction.event.*;
@Component @RequiredArgsConstructor @Slf4j
public class AuditWriter {
 private final AuditLogRepository audits;
 private final EmployeeRepository employees;
 // Runs after the business transaction commits, so newly registered actors exist.
 @TransactionalEventListener(phase=TransactionPhase.AFTER_COMMIT, fallbackExecution=true)
 @Transactional(propagation=Propagation.REQUIRES_NEW)
 public void append(AuditEvent event) {
   try {
     audits.save(AuditLog.builder().action(event.action())
       .actor(event.actorId()==null?null:employees.findById(event.actorId()).orElse(null))
       .resourceType(event.resourceType()).resourceId(event.resourceId()).details(event.details())
       .ipAddress(event.ip()).userAgent(event.userAgent()).build());
   } catch (Exception ex) { log.error("Audit persistence failed for action={}",event.action(),ex); }
 }
}
