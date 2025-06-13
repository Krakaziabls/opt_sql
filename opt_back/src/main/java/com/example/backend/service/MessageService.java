package com.example.backend.service;

import java.time.LocalDateTime;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.model.dto.MessageDto;
import com.example.backend.model.entity.Chat;
import com.example.backend.model.entity.Message;
import com.example.backend.repository.MessageRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class MessageService {
    private final MessageRepository messageRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public MessageDto saveAndSendMessage(Chat chat, String content, boolean fromUser) {
        Message message = new Message();
        message.setChat(chat);
        message.setContent(content);
        message.setFromUser(fromUser);
        message.setCreatedAt(LocalDateTime.now());

        log.debug("Saving message: content={}, fromUser={}", message.getContent(), message.isFromUser());
        message = messageRepository.save(message);
        log.info("Message saved successfully: id={}", message.getId());

        // Отправляем сообщение через WebSocket
        String destination = "/topic/chat/" + chat.getId();
        MessageDto messageDto = mapToMessageDto(message);
        log.debug("Sending message to destination: {}", destination);
        messagingTemplate.convertAndSend(destination, messageDto);
        log.info("Successfully sent message to {}: id={}", destination, message.getId());

        return messageDto;
    }

    private MessageDto mapToMessageDto(Message message) {
        return MessageDto.builder()
                .id(message.getId())
                .chatId(String.valueOf(message.getChat().getId()))
                .content(message.getContent())
                .fromUser(message.isFromUser())
                .createdAt(message.getCreatedAt())
                .llmProvider(message.getLlmProvider())
                .build();
    }
}
