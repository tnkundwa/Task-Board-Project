package com.taskboard.notification.service;

import com.taskboard.notification.dto.NotificationResponse;
import com.taskboard.notification.entity.NotificationEntity;
import com.taskboard.notification.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    private final NotificationRepository repository;

    public NotificationService(NotificationRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public void createNotification(String eventType, Long taskId, String taskTitle, Long teamId) {
        NotificationEntity entity = new NotificationEntity(taskId, taskTitle, eventType, teamId);
        repository.save(entity);
    }

    public List<NotificationResponse> getAllNotifications() {
        return repository.findAllByOrderByCreatedAtDesc().stream()
                .map(NotificationResponse::from)
                .collect(Collectors.toList());
    }

    public long getUnreadCount() {
        return repository.countByReadFalse();
    }

    @Transactional
    public void markAsRead(Long id) {
        NotificationEntity entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found with id: " + id));
        entity.setRead(true);
        repository.save(entity);
    }

    @Transactional
    public void deleteNotification(Long id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("Notification not found with id: " + id);
        }
        repository.deleteById(id);
    }
}
