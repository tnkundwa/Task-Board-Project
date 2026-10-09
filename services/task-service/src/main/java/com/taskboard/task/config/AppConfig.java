package com.taskboard.task.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.ClientHttpRequestFactories;
import org.springframework.boot.web.client.ClientHttpRequestFactorySettings;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

@Configuration
public class AppConfig {

    // Default RestTemplate has no connect/read timeout -- against a Team Service that's gone
    // (pod deleted, no route), that leaves calls hanging on the OS TCP timeout instead of
    // failing fast (Challenge 6: assignment must return an error in under 2 seconds).
    @Bean
    public RestTemplate restTemplate(
            @Value("${team-service.connect-timeout-ms:2000}") long connectTimeoutMs,
            @Value("${team-service.read-timeout-ms:2000}") long readTimeoutMs) {
        ClientHttpRequestFactorySettings settings = ClientHttpRequestFactorySettings.DEFAULTS
                .withConnectTimeout(Duration.ofMillis(connectTimeoutMs))
                .withReadTimeout(Duration.ofMillis(readTimeoutMs));
        ClientHttpRequestFactory factory = ClientHttpRequestFactories.get(settings);
        return new RestTemplate(factory);
    }
}
