"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Send, Paperclip, File, X, Image, FileText, FileArchive, Film } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/lib/context/auth-context"
import { chatService } from "@/lib/services/chat-service"
import { matchingService } from "@/lib/services/matching-service"

interface FileInfo {
  name: string
  type: string
  size: number
  url: string
}

interface Message {
  id: string
  text: string
  senderId: string
  createdAt: Date
  file?: FileInfo
  read?: boolean
}

interface ChatProps {
  uid: string
  recipientId: string | null
  recipientUsername?: string
}

export default function Chat({ uid, recipientId, recipientUsername = "User" }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [chatId, setChatId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [sendButtonClicked, setSendButtonClicked] = useState(false)
  const { user } = useAuth()

  // Get or create chat when recipient changes
  useEffect(() => {
    if (!recipientId || !user) {
      setChatId(null)
      setMessages([])
      return
    }

    const getOrCreateChat = async () => {
      try {
        // For sample users, create a simulated chat experience
        if (recipientId.startsWith("sample-user")) {
          // Create a sample chat ID
          const newChatId = `sample_${user.uid}_${recipientId}`
          setChatId(newChatId)

          // Create sample messages
          const sampleMessages = [
            {
              id: `msg1_${newChatId}`,
              text: `Hi there! I'm interested in exchanging skills with you.`,
              senderId: recipientId,
              createdAt: new Date(Date.now() - 3600000), // 1 hour ago
              read: true,
            },
            {
              id: `msg2_${newChatId}`,
              text: `I noticed you're interested in learning some of the skills I can teach. Would you like to schedule a session?`,
              senderId: recipientId,
              createdAt: new Date(Date.now() - 3000000), // 50 minutes ago
              read: true,
            },
          ]

          setMessages(sampleMessages as unknown as Message[])
          return
        }

        // For real users, check if there's a mutual match
        const isMutualMatch = await matchingService.checkMutualMatch(user.uid, recipientId)

        if (isMutualMatch) {
          // Get chat ID (sorted user IDs joined with underscore)
          const sortedUserIds = [user.uid, recipientId].sort()
          const newChatId = sortedUserIds.join("_")
          setChatId(newChatId)

          // Load messages
          const chatMessages = await chatService.getChatMessages(newChatId)
          setMessages(chatMessages as unknown as Message[])

          // Mark messages as read
          await chatService.markMessagesAsRead(newChatId, user.uid)
        } else {
          // No mutual match, can't chat yet
          setChatId(null)
          setMessages([])
        }
      } catch (error) {
        console.error("Error getting or creating chat:", error)
      }
    }

    getOrCreateChat()
  }, [recipientId, user])

  // Subscribe to messages when chat ID changes
  useEffect(() => {
    if (!chatId || !user) return

    const unsubscribe = chatService.subscribeToMessages(chatId, (newMessages) => {
      setMessages(newMessages as unknown as Message[])

      // Mark messages as read
      chatService.markMessagesAsRead(chatId, user.uid)
    })

    return () => unsubscribe()
  }, [chatId, user])

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [chatId]) //Corrected dependency

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleFileClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const simulateFileUpload = async (file: File): Promise<string> => {
    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Simulate upload progress
      const totalSteps = 10
      for (let i = 1; i <= totalSteps; i++) {
        await new Promise((resolve) => setTimeout(resolve, 200))
        setUploadProgress((i / totalSteps) * 100)
      }

      // In a real app, this would be the uploaded file URL from Firebase Storage
      // For now, we'll just return a placeholder
      return "#"
    } finally {
      setIsUploading(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!newMessage.trim() && !selectedFile) || !recipientId || !chatId || !user || sendButtonClicked) return

    setSendButtonClicked(true)
    setLoading(true)

    try {
      // For sample users, simulate sending a message
      if (recipientId.startsWith("sample-user")) {
        // Add user's message
        const userMessage = {
          id: `msg_user_${Date.now()}`,
          text: newMessage,
          senderId: user.uid,
          createdAt: new Date(),
          read: true,
        }

        setMessages((prev) => [...prev, userMessage as unknown as Message])

        // Simulate a response after a short delay
        setTimeout(() => {
          const responseMessage = {
            id: `msg_sample_${Date.now()}`,
            text: getAutoResponse(newMessage, recipientId),
            senderId: recipientId,
            createdAt: new Date(),
            read: true,
          }

          setMessages((prev) => [...prev, responseMessage as unknown as Message])
        }, 2000)
      } else {
        // Normal message sending for real users
        if (selectedFile) {
          // Upload file and send message with file
          await chatService.uploadFileAndSendMessage(chatId, user.uid, newMessage, selectedFile)
        } else {
          // Send text message only
          await chatService.sendMessage(chatId, {
            senderId: user.uid,
            text: newMessage,
            createdAt: new Date(),
            read: false,
          })
        }
      }

      // Clear input
      setNewMessage("")
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setLoading(false)
      setSendButtonClicked(false)
    }
  }

  const cancelFileSelection = () => {
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <Image className="h-4 w-4" />
    if (fileType.startsWith("video/")) return <Film className="h-4 w-4" />
    if (fileType.startsWith("application/pdf")) return <FileText className="h-4 w-4" />
    if (fileType.includes("zip") || fileType.includes("compressed")) return <FileArchive className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  const getAutoResponse = (message: string, userId: string): string => {
    // Get username based on userId
    const username = userId === "sample-user-1" ? "John" : userId === "sample-user-2" ? "Jane" : "Mike"

    // Simple keyword-based responses
    if (message.toLowerCase().includes("hello") || message.toLowerCase().includes("hi")) {
      return `Hi there! Nice to meet you. I'm ${username}. How can I help you today?`
    }

    if (message.toLowerCase().includes("teach") || message.toLowerCase().includes("learn")) {
      return `I'd be happy to exchange skills with you! When would you like to schedule our first session?`
    }

    if (
      message.toLowerCase().includes("time") ||
      message.toLowerCase().includes("when") ||
      message.toLowerCase().includes("schedule")
    ) {
      return `I'm usually available on weekdays after 6 PM. Does that work for you?`
    }

    if (
      message.toLowerCase().includes("yes") ||
      message.toLowerCase().includes("sure") ||
      message.toLowerCase().includes("ok")
    ) {
      return `Great! Let's set it up. Would you prefer to start with a video call to discuss our skill exchange?`
    }

    // Default response
    return `Thanks for your message! I'm interested in exchanging skills with you. Let me know what you'd like to learn first.`
  }

  return (
    <Card className="h-full flex flex-col shadow-md animate-fade-in">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">
          {recipientId ? `Chat with ${recipientUsername}` : "Select a match to chat"}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-auto p-3" style={{ height: "300px" }}>
        {recipientId ? (
          <>
            {chatId ? (
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === user?.uid ? "justify-end" : "justify-start"} animate-slide-up`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 shadow-sm ${
                        message.senderId === user?.uid
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      <div>{message.text}</div>
                      {message.file && (
                        <div className="mt-2 p-2 bg-background/20 rounded flex items-center text-sm">
                          <div className="flex items-center gap-2">
                            {getFileIcon(message.file.type)}
                            <div className="flex flex-col">
                              <a
                                href={message.file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline hover:text-white/90 transition-colors"
                              >
                                {message.file.name}
                              </a>
                              <span className="text-xs opacity-70">{formatFileSize(message.file.size)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                You need to match with this user before you can chat.
              </div>
            )}
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Select a match to start chatting
          </div>
        )}
      </CardContent>

      {isUploading && (
        <div className="px-4 py-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm">Uploading {selectedFile?.name}</span>
            <span className="text-sm">{uploadProgress.toFixed(0)}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {selectedFile && !isUploading && (
        <div className="px-4 py-2 flex items-center justify-between bg-secondary/30 rounded mx-3">
          <div className="flex items-center gap-2">
            {getFileIcon(selectedFile.type)}
            <span className="text-sm truncate max-w-[200px]">{selectedFile.name}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={cancelFileSelection}
            className="h-6 w-6 rounded-full hover:bg-secondary"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <CardFooter className="pt-2">
        <form onSubmit={handleSendMessage} className="flex w-full gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*,application/pdf,video/*,audio/*,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleFileClick}
            disabled={!recipientId || !chatId || loading || isUploading}
            className="flex-shrink-0 transition-all hover:bg-primary/10"
          >
            <Paperclip className="h-4 w-4" />
            <span className="sr-only">Attach file</span>
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={selectedFile ? "Add a message (optional)" : "Type your message..."}
            disabled={!recipientId || !chatId || loading || isUploading}
            className="flex-grow transition-all"
          />
          <Button
            type="submit"
            disabled={
              (!newMessage.trim() && !selectedFile) ||
              !recipientId ||
              !chatId ||
              loading ||
              isUploading ||
              sendButtonClicked
            }
            className="bg-primary hover:bg-primary/80 flex-shrink-0 transition-all"
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}

