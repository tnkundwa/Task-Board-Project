package com.taskboard.task.dto;

import jakarta.validation.constraints.NotNull;
import com.taskboard.task.entity.TaskStatus;

public class UpdateTaskStatusRequest {

    @NotNull(message = "Status is required")
    private TaskStatus status;

    public TaskStatus getStatus() { return status; }
    public void setStatus(TaskStatus status) { this.status = status; }
}
