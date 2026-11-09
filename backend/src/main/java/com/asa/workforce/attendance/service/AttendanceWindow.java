package com.asa.workforce.attendance.service;
import com.asa.workforce.entity.WeeklySchedule;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Value;
import java.time.*;
@Component
public class AttendanceWindow {
 @Value("${app.attendance.timezone:Asia/Riyadh}") private String timezone="Asia/Riyadh";
 @Value("${app.attendance.early-minutes:10}") private int earlyMinutes=10;
 public ZonedDateTime now() { return ZonedDateTime.now(ZoneId.of(timezone)); }
 public boolean isOpen(WeeklySchedule schedule, ZonedDateTime time) {
   if(schedule==null || !schedule.parsedWorkDays().contains(time.getDayOfWeek())) return false;
   if(time.toLocalDate().isBefore(schedule.getWeekStart()) || !time.toLocalDate().isBefore(schedule.getWeekStart().plusDays(7))) return false;
   var start=time.toLocalDate().atTime(schedule.getShiftStart()).atZone(time.getZone());
   var end=time.toLocalDate().atTime(schedule.getShiftEnd()).atZone(time.getZone());
   return !time.isBefore(start.minusMinutes(earlyMinutes)) && !time.isAfter(end);
 }
}
