package com.taskboard.task.dto;

import java.time.LocalDateTime;

public class TaskEvent {

    private String eventType;
    private Long taskId;
    private String taskTitle;
    private Long teamId;
    private Long assigneeId;
    private String assignedBy;
    private LocalDateTime timestamp;

    public TaskEvent() {}

    public TaskEvent(String eventType, Long taskId, String taskTitle, Long teamId, Long assigneeId, String assignedBy) {
        this.eventType = eventType;
        this.taskId = taskId;
        this.taskTitle = taskTitle;
        this.teamId = teamId;
        this.assigneeId = assigneeId;
        this.assignedBy = assignedBy;
        this.timestamp = LocalDateTime.now();
    }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }
    public Long getTaskId() { return taskId; }
    public void setTaskId(Long taskId) { this.taskId = taskId; }
    public String getTaskTitle() { return taskTitle; }
    public void setTaskTitle(String taskTitle) { this.taskTitle = taskTitle; }
    public Long getTeamId() { return teamId; }
    public void setTeamId(Long teamId) { this.teamId = teamId; }
    public Long getAssigneeId() { return assigneeId; }
    public void setAssigneeId(Long assigneeId) { this.assigneeId = assigneeId; }
    public String getAssignedBy() { return assignedBy; }
    public void setAssignedBy(String assignedBy) { this.assignedBy = assignedBy; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
