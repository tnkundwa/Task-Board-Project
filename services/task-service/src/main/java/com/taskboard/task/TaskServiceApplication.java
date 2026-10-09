package com.taskboard.task;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

// @EnableScheduling drives TaskEventPublisher's retry sweep (Challenge 6: buffered task events
// must get redelivered once RabbitMQ recovers, without blocking the request that created them).
@EnableScheduling
@SpringBootApplication
public class TaskServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(TaskServiceApplication.class, args);
    }
}
