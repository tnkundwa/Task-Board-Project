package com.taskboard.notification.dto;

import com.taskboard.notification.entity.NotificationEntity;
import java.time.LocalDateTime;

public class NotificationResponse {

    private Long id;
    private String eventType;
    private Long taskId;
    private String taskTitle;
    private Long teamId;
    private boolean read;
    private LocalDateTime createdAt;

    public static NotificationResponse from(NotificationEntity entity) {
        NotificationResponse response = new NotificationResponse();
        response.setId(entity.getId());
        response.setEventType(entity.getEventType());
        response.setTaskId(entity.getTaskId());
        response.setTaskTitle(entity.getTaskTitle());
        response.setTeamId(entity.getTeamId());
        response.setRead(entity.isRead());
        response.setCreatedAt(entity.getCreatedAt());
        return response;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }
    public Long getTaskId() { return taskId; }
    public void setTaskId(Long taskId) { this.taskId = taskId; }
    public String getTaskTitle() { return taskTitle; }
    public void setTaskTitle(String taskTitle) { this.taskTitle = taskTitle; }
    public Long getTeamId() { return teamId; }
    public void setTeamId(Long teamId) { this.teamId = teamId; }
    public boolean isRead() { return read; }
    public void setRead(boolean read) { this.read = read; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
