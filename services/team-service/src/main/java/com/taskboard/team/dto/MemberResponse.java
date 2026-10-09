package com.taskboard.team.dto;

import com.taskboard.team.entity.TeamMember;

public class MemberResponse {

    private Long id;
    private String name;
    private String email;
    private String role;
    private Long teamId;

    public static MemberResponse from(TeamMember member) {
        MemberResponse response = new MemberResponse();
        response.setId(member.getId());
        response.setName(member.getName());
        response.setEmail(member.getEmail());
        response.setRole(member.getRole());
        response.setTeamId(member.getTeam().getId());
        return response;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public Long getTeamId() { return teamId; }
    public void setTeamId(Long teamId) { this.teamId = teamId; }
}
