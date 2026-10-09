package com.taskboard.task.exception;

/**
 * Thrown when Team Service cannot be reached (timeout, connection refused, unexpected error)
 * while verifying team membership. Deliberately distinct from a normal "member not in team"
 * result: that answer means Team Service was reached and gave a definite "no". This one means
 * we never got an answer at all, and the caller should be told that plainly rather than being
 * given a misleading "member not in team" response.
 */
public class TeamServiceUnavailableException extends RuntimeException {
    public TeamServiceUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
