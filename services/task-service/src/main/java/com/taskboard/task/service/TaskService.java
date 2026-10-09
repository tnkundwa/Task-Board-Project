package com.taskboard.task.service;

import com.taskboard.task.client.TeamServiceClient;
import com.taskboard.task.dto.*;
import com.taskboard.task.entity.Task;
import com.taskboard.task.entity.TaskStatus;
import com.taskboard.task.repository.TaskRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final TeamServiceClient teamServiceClient;
    private final TaskEventPublisher eventPublisher;

    public TaskService(TaskRepository taskRepository,
                       TeamServiceClient teamServiceClient,
                       TaskEventPublisher eventPublisher) {
        this.taskRepository = taskRepository;
        this.teamServiceClient = teamServiceClient;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public TaskResponse createTask(CreateTaskRequest request) {
        Task task = new Task(request.getTitle(), request.getDescription(), request.getTeamId());
        task = taskRepository.save(task);
        return TaskResponse.from(task);
    }

    public List<TaskResponse> getAllTasks(Long teamId, TaskStatus status, Long assigneeId) {
        List<Task> tasks;
        if (teamId != null && status != null && assigneeId != null) {
            tasks = taskRepository.findByTeamIdAndAssigneeId(teamId, assigneeId).stream()
                    .filter(t -> t.getStatus() == status)
                    .collect(Collectors.toList());
        } else if (teamId != null && status != null) {
            tasks = taskRepository.findByTeamIdAndStatus(teamId, status);
        } else if (teamId != null) {
            tasks = taskRepository.findByTeamId(teamId);
        } else if (assigneeId != null) {
            tasks = taskRepository.findByAssigneeId(assigneeId);
        } else {
            tasks = taskRepository.findAll();
        }
        return tasks.stream().map(TaskResponse::from).collect(Collectors.toList());
    }

    public TaskResponse getTask(Long id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found with id: " + id));
        return TaskResponse.from(task);
    }

    @Transactional
    public TaskResponse updateTask(Long id, CreateTaskRequest request) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found with id: " + id));
        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setTeamId(request.getTeamId());
        task = taskRepository.save(task);
        return TaskResponse.from(task);
    }

    @Transactional
    public void deleteTask(Long id) {
        if (!taskRepository.existsById(id)) {
            throw new RuntimeException("Task not found with id: " + id);
        }
        taskRepository.deleteById(id);
    }

    @Transactional
    public TaskResponse assignTask(Long id, AssignTaskRequest request) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found with id: " + id));
        if (!teamServiceClient.memberExistsInTeam(task.getTeamId(), request.getAssigneeId())) {
            throw new RuntimeException("Member " + request.getAssigneeId() + " does not belong to team " + task.getTeamId());
        }
        task.setAssigneeId(request.getAssigneeId());
        task = taskRepository.save(task);
        eventPublisher.publishTaskAssigned(new TaskEvent(
                "task.assigned", task.getId(), task.getTitle(),
                task.getTeamId(), task.getAssigneeId(), "system"
        ));
        return TaskResponse.from(task);
    }

    @Transactional
    public TaskResponse updateTaskStatus(Long id, UpdateTaskStatusRequest request) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found with id: " + id));
        TaskStatus previousStatus = task.getStatus();
        task.setStatus(request.getStatus());
        task = taskRepository.save(task);
        if (request.getStatus() == TaskStatus.DONE && previousStatus != TaskStatus.DONE) {
            eventPublisher.publishTaskCompleted(new TaskEvent(
                    "task.completed", task.getId(), task.getTitle(),
                    task.getTeamId(), task.getAssigneeId(), "system"
            ));
        } else if (previousStatus == TaskStatus.DONE && request.getStatus() != TaskStatus.DONE) {
            eventPublisher.publishTaskStatusChanged(new TaskEvent(
                    "task.status.changed", task.getId(), task.getTitle(),
                    task.getTeamId(), task.getAssigneeId(), "system"
            ));
        }
        return TaskResponse.from(task);
    }
}
