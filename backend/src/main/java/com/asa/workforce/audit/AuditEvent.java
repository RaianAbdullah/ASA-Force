package com.asa.workforce.audit;
import java.util.*;
public record AuditEvent(String action, UUID actorId, String resourceType, UUID resourceId,
                         Map<String,Object> details, String ip, String userAgent) {}
