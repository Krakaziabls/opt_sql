package com.example.backend.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.model.dto.ChatDto;
import com.example.backend.model.dto.MessageDto;
import com.example.backend.model.entity.Chat;
import com.example.backend.model.entity.Message;
import com.example.backend.model.entity.User;
import com.example.backend.repository.ChatRepository;
import com.example.backend.repository.MessageRepository;
import com.example.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final ChatRepository chatRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final DatabaseConnectionService databaseConnectionService;
    private final SimpMessagingTemplate messagingTemplate;

    public List<ChatDto> getUserChats(Long userId) {
        log.debug("Fetching chats for userId={}", userId);
        List<Chat> chats = chatRepository.findByUserIdOrderByUpdatedAtDesc(userId);
        return chats.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public ChatDto createChat(Long userId, ChatDto chatDto) {
        log.debug("Creating chat for userId={}, title={}", userId, chatDto.getTitle());
        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    log.error("User not found: userId={}", userId);
                    return new ResourceNotFoundException("User not found");
                });

        Chat chat = Chat.builder()
                .user(user)
                .title(chatDto.getTitle())
                .messages(new ArrayList<>())
                .build();

        Chat savedChat = chatRepository.save(chat);
        log.info("Created chat: id={}, title={}", savedChat.getId(), savedChat.getTitle());
        return mapToDto(savedChat);
    }

    public ChatDto getChat(Long chatId, Long userId) {
        log.debug("Fetching chat: chatId={}, userId={}", chatId, userId);
        Chat chat = chatRepository.findByIdAndUserId(chatId, userId)
                .orElseThrow(() -> {
                    log.error("Chat not found: chatId={}, userId={}", chatId, userId);
                    return new ResourceNotFoundException("Chat not found");
                });

        return mapToDto(chat);
    }

    public List<MessageDto> getChatMessages(Long chatId, Long userId) {
        log.debug("Fetching messages for chatId={}, userId={}", chatId, userId);
        chatRepository.findByIdAndUserId(chatId, userId)
                .orElseThrow(() -> {
                    log.error("Chat not found: chatId={}, userId={}", chatId, userId);
                    return new ResourceNotFoundException("Chat not found");
                });

        List<Message> messages = messageRepository.findByChatIdOrderByCreatedAtAsc(chatId);
        return messages.stream()
                .map(this::mapToMessageDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public MessageDto sendMessage(Long chatId, Long userId, MessageDto messageDto) {
        log.info("Processing sendMessage: chatId={}, userId={}, content={}", chatId, userId, messageDto.getContent());

        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat not found with id: " + chatId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        log.debug("Found chat: id={}, title={}", chat.getId(), chat.getTitle());

        Message message = new Message();
        message.setChat(chat);
        message.setContent(messageDto.getContent());
        message.setFromUser(messageDto.getFromUser());
        message.setCreatedAt(LocalDateTime.now());

        log.debug("Saving message: content={}, fromUser={}", message.getContent(), message.isFromUser());
        message = messageRepository.save(message);
        log.info("Message saved successfully: id={}", message.getId());

        // Отправляем сообщение через WebSocket только если это не SQL-запрос
        if (!isSQLQuery(messageDto.getContent())) {
            String destination = "/topic/chat/" + chatId;
            log.debug("Sending message to destination: {}", destination);
            messagingTemplate.convertAndSend(destination, mapToMessageDto(message));
            log.info("Successfully sent message to {}: id={}", destination, message.getId());
        }

        // Обновляем время последнего обновления чата
        chat.setUpdatedAt(LocalDateTime.now());
        chatRepository.save(chat);
        log.debug("Updated chat timestamp: id={}", chat.getId());

        return mapToMessageDto(message);
    }

    private boolean isSQLQuery(String content) {
        if (content == null || content.trim().isEmpty()) {
            return false;
        }
        String upperContent = content.toUpperCase().trim();
        return upperContent.startsWith("SELECT") ||
                upperContent.startsWith("INSERT") ||
                upperContent.startsWith("UPDATE") ||
                upperContent.startsWith("DELETE") ||
                upperContent.startsWith("CREATE") ||
                upperContent.startsWith("ALTER") ||
                upperContent.startsWith("DROP");
    }

    @Transactional
    public void archiveChat(Long chatId, Long userId) {
        log.debug("Archiving chat: chatId={}, userId={}", chatId, userId);
        Chat chat = chatRepository.findByIdAndUserId(chatId, userId)
                .orElseThrow(() -> {
                    log.error("Chat not found: chatId={}, userId={}", chatId, userId);
                    return new ResourceNotFoundException("Chat not found");
                });

        chat.setArchived(true);
        chatRepository.save(chat);

        databaseConnectionService.deactivateConnectionsForChat(chatId);
        log.info("Archived chat: chatId={}", chatId);
    }

    @Transactional
    public ChatDto updateChat(Long chatId, Long userId, ChatDto chatDto) {
        log.debug("Updating chat: chatId={}, userId={}, newTitle={}", chatId, userId, chatDto.getTitle());
        Chat chat = chatRepository.findByIdAndUserId(chatId, userId)
                .orElseThrow(() -> {
                    log.error("Chat not found: chatId={}, userId={}", chatId, userId);
                    return new ResourceNotFoundException("Chat not found");
                });

        chat.setTitle(chatDto.getTitle());
        chat.setUpdatedAt(LocalDateTime.now());

        Chat updatedChat = chatRepository.save(chat);
        log.info("Updated chat: chatId={}, title={}", chatId, updatedChat.getTitle());
        return mapToDto(updatedChat);
    }

    @Transactional
    public void deleteChat(Long chatId, Long userId) {
        log.debug("Deleting chat: chatId={}, userId={}", chatId, userId);
        Chat chat = chatRepository.findByIdAndUserId(chatId, userId)
                .orElseThrow(() -> {
                    log.error("Chat not found: chatId={}, userId={}", chatId, userId);
                    return new ResourceNotFoundException("Chat not found");
                });

        databaseConnectionService.deactivateConnectionsForChat(chatId);
        chatRepository.delete(chat);
        log.info("Deleted chat: chatId={}", chatId);
    }

    private ChatDto mapToDto(Chat chat) {
        return ChatDto.builder()
                .id(chat.getId())
                .title(chat.getTitle())
                .createdAt(chat.getCreatedAt())
                .updatedAt(chat.getUpdatedAt())
                .archived(chat.isArchived())
                .build();
    }

    private MessageDto mapToMessageDto(Message message) {
        return MessageDto.builder()
                .id(message.getId())
                .content(message.getContent())
                .fromUser(message.isFromUser())
                .createdAt(message.getCreatedAt())
                .build();
    }
}
