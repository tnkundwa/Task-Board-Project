package com.taskboard.task.client;

import com.taskboard.task.exception.TeamServiceUnavailableException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@Component
public class TeamServiceClient {

    private static final Logger log = LoggerFactory.getLogger(TeamServiceClient.class);

    private final RestTemplate restTemplate;
    private final String teamServiceUrl;

    public TeamServiceClient(RestTemplate restTemplate,
                              @Value("${team-service.url:http://localhost:8082}") String teamServiceUrl) {
        this.restTemplate = restTemplate;
        this.teamServiceUrl = teamServiceUrl;
    }

    /**
     * @return whether {@code memberId} belongs to {@code teamId}, according to Team Service.
     * @throws TeamServiceUnavailableException if Team Service could not be reached or returned
     *         an unexpected error -- this is NOT the same as a {@code false} answer, which means
     *         Team Service was reached and confirmed the member does not belong to the team.
     *         Callers must not treat the two the same way (see docs/decisions.md).
     */
    public boolean memberExistsInTeam(Long teamId, Long memberId) {
        String url = String.format("%s/api/teams/%d/members/%d/exists", teamServiceUrl, teamId, memberId);
        try {
            Boolean exists = restTemplate.getForObject(url, Boolean.class);
            return Boolean.TRUE.equals(exists);
        } catch (RestClientException e) {
            // Covers connect/read timeout, connection refused, DNS failure, and non-2xx
            // responses -- the /exists endpoint always answers 200 true/false for a team or
            // member it doesn't recognise, so any exception here means Team Service itself is
            // the problem, not the membership question.
            log.warn("Team Service unreachable while checking membership (team={}, member={}): {}",
                    teamId, memberId, e.getMessage());
            throw new TeamServiceUnavailableException(
                    "Team Service is unavailable; cannot verify team membership", e);
        }
    }
}
