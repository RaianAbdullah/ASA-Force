package com.asa.workforce.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class CreateEmployeeNoteRequest {

    @NotBlank(message = "Note is required")
    @Size(max = 2000, message = "Note must not exceed 2000 characters")
    private String note;

    @NotBlank(message = "Category is required")
    @Pattern(regexp = "GENERAL|PERFORMANCE|CONDUCT|COMMENDATION",
             message = "Invalid note category")
    private String category;
}

