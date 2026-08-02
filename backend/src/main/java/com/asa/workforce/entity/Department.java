package com.asa.workforce.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "departments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Department {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /** English name — maps to the legacy `name` column */
    @Column(name = "name", nullable = false, length = 150)
    private String nameEn;

    @Column(name = "name_ar", nullable = false, length = 150)
    private String nameAr;

    @Column(nullable = false, length = 20, unique = true)
    private String code;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    /**
     * When true, the department manager gets cross-department privileges:
     *   • can assign any employee (from any department) to this department's shifts
     *   • can read leave/vacation records for any employee in the system
     * Used exclusively by the Weekend Duty department (code = 'WKD').
     */
    @Column(name = "is_cross_department", nullable = false)
    @Builder.Default
    private Boolean isCrossDepartment = false;

    /**
     * Designated manager for this department (DEPARTMENT_MANAGER or MAIN_MANAGER role).
     * Nullable — a department can exist before a manager is assigned.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private Employee manager;

    @OneToMany(mappedBy = "department", fetch = FetchType.LAZY)
    private List<Employee> employees;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
