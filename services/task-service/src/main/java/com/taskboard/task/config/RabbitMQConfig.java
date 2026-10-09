package com.taskboard.task.config;

import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String TASK_EXCHANGE = "task.exchange";
    public static final String TASK_ASSIGNED_QUEUE = "task.assigned.queue";
    public static final String TASK_COMPLETED_QUEUE = "task.completed.queue";
    public static final String TASK_STATUS_CHANGED_QUEUE = "task.status.changed.queue";
    public static final String TASK_ASSIGNED_ROUTING_KEY = "task.assigned";
    public static final String TASK_COMPLETED_ROUTING_KEY = "task.completed";
    public static final String TASK_STATUS_CHANGED_ROUTING_KEY = "task.status.changed";

    @Bean
    public TopicExchange taskExchange() {
        return new TopicExchange(TASK_EXCHANGE);
    }

    @Bean
    public Queue taskAssignedQueue() {
        return new Queue(TASK_ASSIGNED_QUEUE, true);
    }

    @Bean
    public Queue taskCompletedQueue() {
        return new Queue(TASK_COMPLETED_QUEUE, true);
    }

    @Bean
    public Queue taskStatusChangedQueue() {
        return new Queue(TASK_STATUS_CHANGED_QUEUE, true);
    }

    @Bean
    public Binding taskAssignedBinding(@Qualifier("taskAssignedQueue") Queue taskAssignedQueue, TopicExchange taskExchange) {
        return BindingBuilder.bind(taskAssignedQueue).to(taskExchange).with(TASK_ASSIGNED_ROUTING_KEY);
    }

    @Bean
    public Binding taskCompletedBinding(@Qualifier("taskCompletedQueue") Queue taskCompletedQueue, TopicExchange taskExchange) {
        return BindingBuilder.bind(taskCompletedQueue).to(taskExchange).with(TASK_COMPLETED_ROUTING_KEY);
    }

    @Bean
    public Binding taskStatusChangedBinding(@Qualifier("taskStatusChangedQueue") Queue taskStatusChangedQueue, TopicExchange taskExchange) {
        return BindingBuilder.bind(taskStatusChangedQueue).to(taskExchange).with(TASK_STATUS_CHANGED_ROUTING_KEY);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
