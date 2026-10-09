package com.taskboard.task.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.info.License;

@OpenAPIDefinition(
    info = @Info(
        title = "Task Service API",
        version = "1.0.0",
        description = "Task CRUD, assignment, and status management. "
                    + "Publishes events to RabbitMQ on task assignment and completion.",
        contact = @Contact(name = "Task Board Platform"),
        license = @License(name = "Internal")
    )
)
public class OpenAPIConfig {
}
