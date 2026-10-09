package com.taskboard.notification.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.info.License;

@OpenAPIDefinition(
    info = @Info(
        title = "Notification Service API",
        version = "1.0.0",
        description = "Stores and serves notifications generated from RabbitMQ task events. "
                    + "Consumes task.assigned, task.completed, and task.status.changed events.",
        contact = @Contact(name = "Task Board Platform"),
        license = @License(name = "Internal")
    )
)
public class OpenAPIConfig {
}
