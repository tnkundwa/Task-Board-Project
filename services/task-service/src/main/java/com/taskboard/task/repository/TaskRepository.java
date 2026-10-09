package com.taskboard.task.repository;

import com.taskboard.task.entity.Task;
import com.taskboard.task.entity.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByTeamId(Long teamId);
    List<Task> findByTeamIdAndStatus(Long teamId, TaskStatus status);
    List<Task> findByAssigneeId(Long assigneeId);
    List<Task> findByTeamIdAndAssigneeId(Long teamId, Long assigneeId);
}
