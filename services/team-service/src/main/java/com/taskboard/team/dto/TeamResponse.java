package com.taskboard.team.dto;

import com.taskboard.team.entity.Team;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class TeamResponse {

    private Long id;
    private String name;
    private String description;
    private String color;
    private LocalDateTime createdAt;
    private List<MemberResponse> members;

    public static TeamResponse from(Team team) {
        TeamResponse response = new TeamResponse();
        response.setId(team.getId());
        response.setName(team.getName());
        response.setDescription(team.getDescription());
        response.setColor(team.getColor());
        response.setCreatedAt(team.getCreatedAt());
        if (team.getMembers() != null) {
            response.setMembers(team.getMembers().stream()
                    .map(MemberResponse::from)
                    .collect(Collectors.toList()));
        }
        return response;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public List<MemberResponse> getMembers() { return members; }
    public void setMembers(List<MemberResponse> members) { this.members = members; }
}
