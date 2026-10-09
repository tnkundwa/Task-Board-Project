package com.taskboard.notification.listener;

import com.taskboard.notification.dto.TaskEvent;
import com.taskboard.notification.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class TaskEventListener {

    private static final Logger log = LoggerFactory.getLogger(TaskEventListener.class);

    private final NotificationService notificationService;

    public TaskEventListener(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @RabbitListener(queues = "task.assigned.queue")
    public void handleTaskAssigned(TaskEvent event) {
        log.info("NOTIFICATION: Task '{}' (ID: {}) has been assigned to member {} in team {}",
                event.getTaskTitle(), event.getTaskId(), event.getAssigneeId(), event.getTeamId());
        notificationService.createNotification(
                "TASK_ASSIGNED", event.getTaskId(), event.getTaskTitle(), event.getTeamId());
    }

    @RabbitListener(queues = "task.completed.queue")
    public void handleTaskCompleted(TaskEvent event) {
        log.info("NOTIFICATION: Task '{}' (ID: {}) has been completed by member {} in team {}",
                event.getTaskTitle(), event.getTaskId(), event.getAssigneeId(), event.getTeamId());
        notificationService.createNotification(
                "TASK_COMPLETED", event.getTaskId(), event.getTaskTitle(), event.getTeamId());
    }

    @RabbitListener(queues = "task.status.changed.queue")
    public void handleTaskStatusChanged(TaskEvent event) {
        log.info("NOTIFICATION: Task '{}' (ID: {}) status changed in team {}",
                event.getTaskTitle(), event.getTaskId(), event.getTeamId());
        notificationService.createNotification(
                "TASK_STATUS_CHANGED", event.getTaskId(), event.getTaskTitle(), event.getTeamId());
    }
}
