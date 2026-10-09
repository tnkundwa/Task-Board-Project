package com.taskboard.task.service;

import com.taskboard.task.config.RabbitMQConfig;
import com.taskboard.task.dto.TaskEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.Queue;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Publishes task events to RabbitMQ.
 * <p>
 * RabbitMQ is a soft dependency here: task creation, assignment, and status changes must keep
 * working even while RabbitMQ is down (Challenge 6). So a failed publish never blocks or fails
 * the caller's request -- it is parked in {@link #pending} instead, and {@link #retryPending()}
 * keeps retrying it in the background until it gets through.
 * <p>
 * This is an in-memory buffer, not a durable outbox: if the Task Service pod itself restarts
 * while events are still pending, they are lost. That trade-off (and the alternative -- a
 * JPA-backed outbox table) is written up in docs/decisions.md. The acceptance scenario for this
 * challenge only kills the RabbitMQ pod, not Task Service, so the buffer is never asked to
 * survive a restart of its own process.
 */
@Service
public class TaskEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(TaskEventPublisher.class);

    // Bounds worst-case memory use if RabbitMQ stays down for a very long time. At that point
    // we'd rather drop the oldest events loudly (a log line ops can alert on) than let the queue
    // grow without limit.
    private static final int MAX_PENDING = 1000;

    private final RabbitTemplate rabbitTemplate;
    private final Queue<PendingEvent> pending = new ConcurrentLinkedQueue<>();
    private final AtomicInteger pendingSize = new AtomicInteger(0);

    public TaskEventPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void publishTaskAssigned(TaskEvent event) {
        publish(RabbitMQConfig.TASK_ASSIGNED_ROUTING_KEY, event);
    }

    public void publishTaskCompleted(TaskEvent event) {
        publish(RabbitMQConfig.TASK_COMPLETED_ROUTING_KEY, event);
    }

    public void publishTaskStatusChanged(TaskEvent event) {
        publish(RabbitMQConfig.TASK_STATUS_CHANGED_ROUTING_KEY, event);
    }

    private void publish(String routingKey, TaskEvent event) {
        if (trySend(routingKey, event)) {
            log.info("Published {} event for taskId={}", routingKey, event.getTaskId());
        } else {
            enqueueForRetry(routingKey, event);
        }
    }

    private boolean trySend(String routingKey, TaskEvent event) {
        try {
            rabbitTemplate.convertAndSend(RabbitMQConfig.TASK_EXCHANGE, routingKey, event);
            return true;
        } catch (Exception e) {
            log.warn("Failed to publish {} event for taskId={} ({}); queued for retry",
                    routingKey, event.getTaskId(), e.getMessage());
            return false;
        }
    }

    private void enqueueForRetry(String routingKey, TaskEvent event) {
        if (pendingSize.get() >= MAX_PENDING) {
            log.error("Retry buffer full ({} events); dropping {} event for taskId={}",
                    MAX_PENDING, routingKey, event.getTaskId());
            return;
        }
        pending.add(new PendingEvent(routingKey, event));
        pendingSize.incrementAndGet();
    }

    /**
     * Retries every buffered event once, every 5s. That cadence is cheap when the buffer is
     * empty (the common case) and comfortably beats the "delayed notifications must arrive
     * within 30 seconds of RabbitMQ recovering" requirement.
     * <p>
     * Only ever attempts the number of events present when the sweep started -- an event that
     * fails again is re-queued for the *next* sweep, not retried in a tight loop within this
     * one, so a still-down RabbitMQ can't turn this into a busy-loop.
     */
    @Scheduled(fixedDelay = 5000)
    void retryPending() {
        int attempts = pendingSize.get();
        for (int i = 0; i < attempts; i++) {
            PendingEvent next = pending.poll();
            if (next == null) {
                break;
            }
            pendingSize.decrementAndGet();
            if (trySend(next.routingKey(), next.event())) {
                log.info("Redelivered buffered {} event for taskId={} after RabbitMQ recovered",
                        next.routingKey(), next.event().getTaskId());
            } else {
                enqueueForRetry(next.routingKey(), next.event());
            }
        }
    }

    private record PendingEvent(String routingKey, TaskEvent event) {}
}
