package com.taskboard.team.service;

import com.taskboard.team.dto.*;
import com.taskboard.team.entity.Team;
import com.taskboard.team.entity.TeamMember;
import com.taskboard.team.repository.TeamMemberRepository;
import com.taskboard.team.repository.TeamRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TeamService {

    private final TeamRepository teamRepository;
    private final TeamMemberRepository memberRepository;

    public TeamService(TeamRepository teamRepository, TeamMemberRepository memberRepository) {
        this.teamRepository = teamRepository;
        this.memberRepository = memberRepository;
    }

    @Transactional
    public TeamResponse createTeam(CreateTeamRequest request) {
        Team team = new Team(request.getName(), request.getDescription());
        if (request.getColor() != null) {
            team.setColor(request.getColor());
        }
        team = teamRepository.save(team);
        return TeamResponse.from(team);
    }

    public List<TeamResponse> getAllTeams() {
        return teamRepository.findAll().stream()
                .map(TeamResponse::from)
                .collect(Collectors.toList());
    }

    public TeamResponse getTeam(Long id) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Team not found with id: " + id));
        return TeamResponse.from(team);
    }

    @Transactional
    public TeamResponse updateTeam(Long id, CreateTeamRequest request) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Team not found with id: " + id));
        team.setName(request.getName());
        team.setDescription(request.getDescription());
        if (request.getColor() != null) {
            team.setColor(request.getColor());
        }
        team = teamRepository.save(team);
        return TeamResponse.from(team);
    }

    @Transactional
    public void deleteTeam(Long id) {
        if (!teamRepository.existsById(id)) {
            throw new RuntimeException("Team not found with id: " + id);
        }
        teamRepository.deleteById(id);
    }

    @Transactional
    public MemberResponse addMember(Long teamId, AddMemberRequest request) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found with id: " + teamId));
        TeamMember member = new TeamMember(request.getName(), request.getEmail(), request.getRole());
        team.addMember(member);
        team = teamRepository.save(team);
        TeamMember savedMember = team.getMembers().get(team.getMembers().size() - 1);
        return MemberResponse.from(savedMember);
    }

    @Transactional
    public void removeMember(Long teamId, Long memberId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found with id: " + teamId));
        TeamMember member = memberRepository.findByIdAndTeamId(memberId, teamId)
                .orElseThrow(() -> new RuntimeException("Member not found with id: " + memberId + " in team: " + teamId));
        team.removeMember(member);
        teamRepository.save(team);
    }

    public List<MemberResponse> getMembers(Long teamId) {
        if (!teamRepository.existsById(teamId)) {
            throw new RuntimeException("Team not found with id: " + teamId);
        }
        return memberRepository.findByTeamId(teamId).stream()
                .map(MemberResponse::from)
                .collect(Collectors.toList());
    }

    public MemberResponse getMember(Long teamId, Long memberId) {
        TeamMember member = memberRepository.findByIdAndTeamId(memberId, teamId)
                .orElseThrow(() -> new RuntimeException("Member not found with id: " + memberId + " in team: " + teamId));
        return MemberResponse.from(member);
    }

    public boolean memberExistsInTeam(Long teamId, Long memberId) {
        return memberRepository.existsByIdAndTeamId(memberId, teamId);
    }
}
