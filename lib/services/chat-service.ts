import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  type Timestamp,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage } from "../firebase"

export interface Message {
  id: string
  chatId: string
  senderId: string
  text: string
  createdAt: Timestamp | Date
  read: boolean
  file?: FileInfo
}

export interface FileInfo {
  name: string
  type: string
  size: number
  url: string
}

export interface Chat {
  id: string
  participants: string[]
  lastMessage?: {
    text: string
    senderId: string
    timestamp: Timestamp | Date
  }
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
}

export const chatService = {
  // Create a new chat between users
  async createChat(userIds: string[]): Promise<string> {
    try {
      // Sort user IDs to ensure consistent chat ID
      const sortedUserIds = [...userIds].sort()

      // Check if chat already exists
      const chatsRef = collection(db, "chats")
      const q = query(chatsRef, where("participants", "==", sortedUserIds))
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].id
      }

      // Create new chat
      const chatData: Omit<Chat, "id"> = {
        participants: sortedUserIds,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      const chatRef = await addDoc(chatsRef, chatData)
      return chatRef.id
    } catch (error) {
      console.error("Error creating chat:", error)
      throw error
    }
  },

  // Get chat by ID
  async getChat(chatId: string): Promise<Chat | null> {
    try {
      const chatRef = doc(db, "chats", chatId)
      const chatSnap = await getDoc(chatRef)

      if (chatSnap.exists()) {
        return { id: chatSnap.id, ...chatSnap.data() } as Chat
      }

      return null
    } catch (error) {
      console.error("Error getting chat:", error)
      throw error
    }
  },

  // Get all chats for a user
  async getUserChats(userId: string): Promise<Chat[]> {
    try {
      const chatsRef = collection(db, "chats")
      const q = query(chatsRef, where("participants", "array-contains", userId), orderBy("updatedAt", "desc"))

      const querySnapshot = await getDocs(q)
      const chats: Chat[] = []

      querySnapshot.forEach((doc) => {
        chats.push({ id: doc.id, ...doc.data() } as Chat)
      })

      return chats
    } catch (error) {
      console.error("Error getting user chats:", error)
      throw error
    }
  },

  // Send a message
  async sendMessage(chatId: string, message: Omit<Message, "id" | "chatId">): Promise<string> {
    try {
      const messagesRef = collection(db, "messages")

      const messageData = {
        ...message,
        chatId,
        createdAt: serverTimestamp(),
        read: false,
      }

      const messageRef = await addDoc(messagesRef, messageData)

      // Update the chat's last message
      const chatRef = doc(db, "chats", chatId)
      await updateDoc(chatRef, {
        lastMessage: {
          text: message.text,
          senderId: message.senderId,
          timestamp: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      })

      return messageRef.id
    } catch (error) {
      console.error("Error sending message:", error)
      throw error
    }
  },

  // Upload a file and send a message with the file
  async uploadFileAndSendMessage(chatId: string, senderId: string, text: string, file: File): Promise<string> {
    try {
      // Upload file to storage
      const fileRef = ref(storage, `chat-files/${chatId}/${Date.now()}_${file.name}`)
      await uploadBytes(fileRef, file)

      // Get download URL
      const downloadUrl = await getDownloadURL(fileRef)

      // Create file info
      const fileInfo: FileInfo = {
        name: file.name,
        type: file.type,
        size: file.size,
        url: downloadUrl,
      }

      // Send message with file
      return this.sendMessage(chatId, {
        senderId,
        text,
        file: fileInfo,
        createdAt: new Date(),
        read: false,
      })
    } catch (error) {
      console.error("Error uploading file and sending message:", error)
      throw error
    }
  },

  // Get messages for a chat
  async getChatMessages(chatId: string): Promise<Message[]> {
    try {
      const messagesRef = collection(db, "messages")
      const q = query(messagesRef, where("chatId", "==", chatId), orderBy("createdAt", "asc"))

      const querySnapshot = await getDocs(q)
      const messages: Message[] = []

      querySnapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() } as Message)
      })

      return messages
    } catch (error) {
      console.error("Error getting chat messages:", error)
      throw error
    }
  },

  // Mark messages as read
  async markMessagesAsRead(chatId: string, userId: string): Promise<void> {
    try {
      const messagesRef = collection(db, "messages")
      const q = query(
        messagesRef,
        where("chatId", "==", chatId),
        where("senderId", "!=", userId),
        where("read", "==", false),
      )

      const querySnapshot = await getDocs(q)

      const batch = db.batch()
      querySnapshot.forEach((doc) => {
        batch.update(doc.ref, { read: true })
      })

      await batch.commit()
    } catch (error) {
      console.error("Error marking messages as read:", error)
      throw error
    }
  },

  // Subscribe to messages for a chat
  subscribeToMessages(chatId: string, callback: (messages: Message[]) => void): () => void {
    try {
      const messagesRef = collection(db, "messages")
      const q = query(messagesRef, where("chatId", "==", chatId), orderBy("createdAt", "asc"))

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const messages: Message[] = []

        querySnapshot.forEach((doc) => {
          messages.push({ id: doc.id, ...doc.data() } as Message)
        })

        callback(messages)
      })

      return unsubscribe
    } catch (error) {
      console.error("Error subscribing to messages:", error)
      throw error
    }
  },

  // Subscribe to user chats
  subscribeToUserChats(userId: string, callback: (chats: Chat[]) => void): () => void {
    try {
      const chatsRef = collection(db, "chats")
      const q = query(chatsRef, where("participants", "array-contains", userId), orderBy("updatedAt", "desc"))

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const chats: Chat[] = []

        querySnapshot.forEach((doc) => {
          chats.push({ id: doc.id, ...doc.data() } as Chat)
        })

        callback(chats)
      })

      return unsubscribe
    } catch (error) {
      console.error("Error subscribing to user chats:", error)
      throw error
    }
  },
}

