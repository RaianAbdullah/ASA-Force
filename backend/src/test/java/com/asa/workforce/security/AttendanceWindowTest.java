package com.asa.workforce.security;
import com.asa.workforce.attendance.service.AttendanceWindow;
import com.asa.workforce.entity.WeeklySchedule;
import org.junit.jupiter.api.Test;
import java.time.*;
import static org.assertj.core.api.Assertions.*;
class AttendanceWindowTest {
 @Test void checksExactBoundariesAndAssignedDays() {
   var window=new AttendanceWindow();var date=LocalDate.of(2026,11,8);
   var schedule=WeeklySchedule.builder().weekStart(date).workDays("SUN,MON,TUE,WED,THU")
     .shiftStart(LocalTime.of(8,0)).shiftEnd(LocalTime.of(16,0)).build();
   var opening=date.atTime(7,50).atZone(ZoneId.of("Asia/Riyadh"));
   assertThat(window.isOpen(schedule,opening.minusNanos(1))).isFalse();
   assertThat(window.isOpen(schedule,opening)).isTrue();
   assertThat(window.isOpen(schedule,date.atTime(16,0).atZone(opening.getZone()))).isTrue();
   assertThat(window.isOpen(schedule,date.atTime(16,0,1).atZone(opening.getZone()))).isFalse();
   assertThat(window.isOpen(schedule,opening.plusDays(5))).isFalse();
   assertThat(window.isOpen(null,opening)).isFalse();
 }
}
