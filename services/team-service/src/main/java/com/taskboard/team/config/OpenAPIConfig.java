package com.taskboard.team.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.info.License;

@OpenAPIDefinition(
    info = @Info(
        title = "Team Service API",
        version = "1.0.0",
        description = "Team and member management. Creates teams, manages members, "
                    + "and provides member existence checks for the Task Service.",
        contact = @Contact(name = "Task Board Platform"),
        license = @License(name = "Internal")
    )
)
public class OpenAPIConfig {
}
