"use client"

import { useState, useEffect, useCallback } from "react"
import { chatService, type Message, type Chat } from "../services/chat-service"
import { useAuth } from "../context/auth-context"

export function useChat(chatId?: string) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [chat, setChat] = useState<Chat | null>(null)

  // Load chat and messages
  useEffect(() => {
    if (!chatId || !user) return

    const loadChat = async () => {
      setLoading(true)
      setError(null)

      try {
        // Get chat
        const chatData = await chatService.getChat(chatId)
        setChat(chatData)

        // Get messages
        const messagesData = await chatService.getChatMessages(chatId)
        setMessages(messagesData)

        // Mark messages as read
        await chatService.markMessagesAsRead(chatId, user.uid)
      } catch (err) {
        console.error("Error loading chat:", err)
        setError("Failed to load chat")
      } finally {
        setLoading(false)
      }
    }

    loadChat()
  }, [chatId, user])

  // Subscribe to new messages
  useEffect(() => {
    if (!chatId || !user) return

    const unsubscribe = chatService.subscribeToMessages(chatId, (newMessages) => {
      setMessages(newMessages)

      // Mark messages as read
      chatService.markMessagesAsRead(chatId, user.uid)
    })

    return () => unsubscribe()
  }, [chatId, user])

  // Send message function
  const sendMessage = useCallback(
    async (text: string) => {
      if (!chatId || !user) {
        setError("Cannot send message: not authenticated or no chat selected")
        return
      }

      try {
        await chatService.sendMessage(chatId, {
          senderId: user.uid,
          text,
          createdAt: new Date(),
          read: false,
        })
      } catch (err) {
        console.error("Error sending message:", err)
        setError("Failed to send message")
      }
    },
    [chatId, user],
  )

  // Send file function
  const sendFile = useCallback(
    async (file: File, text = "") => {
      if (!chatId || !user) {
        setError("Cannot send file: not authenticated or no chat selected")
        return
      }

      try {
        await chatService.uploadFileAndSendMessage(chatId, user.uid, text, file)
      } catch (err) {
        console.error("Error sending file:", err)
        setError("Failed to send file")
      }
    },
    [chatId, user],
  )

  // Create or get chat with user
  const createOrGetChat = useCallback(
    async (otherUserId: string) => {
      if (!user) {
        setError("Cannot create chat: not authenticated")
        return null
      }

      try {
        const newChatId = await chatService.createChat([user.uid, otherUserId])
        return newChatId
      } catch (err) {
        console.error("Error creating chat:", err)
        setError("Failed to create chat")
        return null
      }
    },
    [user],
  )

  return {
    messages,
    loading,
    error,
    chat,
    sendMessage,
    sendFile,
    createOrGetChat,
  }
}

