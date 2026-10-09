package com.taskboard.task.dto;

import jakarta.validation.constraints.NotNull;

public class AssignTaskRequest {

    @NotNull(message = "Assignee ID is required")
    private Long assigneeId;

    public Long getAssigneeId() { return assigneeId; }
    public void setAssigneeId(Long assigneeId) { this.assigneeId = assigneeId; }
}
