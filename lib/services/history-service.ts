import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
  serverTimestamp,
  limit,
} from "firebase/firestore"
import { db } from "../firebase"

export interface HistoryRecord {
  id?: string
  userID: string
  Partner: string
  timeStamp: Timestamp
  duration: number
}

export const historyService = {
  // Add a history record
  async addHistoryRecord(record: Omit<HistoryRecord, "id" | "timeStamp">): Promise<string> {
    try {
      const historyRef = collection(db, "history")

      const historyData = {
        ...record,
        timeStamp: serverTimestamp(),
      }

      const docRef = await addDoc(historyRef, historyData)
      return docRef.id
    } catch (error) {
      console.error("Error adding history record:", error)
      throw error
    }
  },

  // Get history records for a user
  async getUserHistory(userId: string, limitCount = 20): Promise<HistoryRecord[]> {
    try {
      const historyRef = collection(db, "history")

      // Query for records where the user is either the user or the partner
      const q1 = query(historyRef, where("userID", "==", userId), orderBy("timeStamp", "desc"), limit(limitCount))

      const q2 = query(historyRef, where("Partner", "==", userId), orderBy("timeStamp", "desc"), limit(limitCount))

      const [snapshot1, snapshot2] = await Promise.all([getDocs(q1), getDocs(q2)])

      const history: HistoryRecord[] = []

      snapshot1.forEach((doc) => {
        history.push({ id: doc.id, ...doc.data() } as HistoryRecord)
      })

      snapshot2.forEach((doc) => {
        history.push({ id: doc.id, ...doc.data() } as HistoryRecord)
      })

      // Sort by timestamp descending
      history.sort((a, b) => {
        const timeA = a.timeStamp instanceof Timestamp ? a.timeStamp.toMillis() : a.timeStamp
        const timeB = b.timeStamp instanceof Timestamp ? b.timeStamp.toMillis() : b.timeStamp
        return timeB - timeA
      })

      // Limit to the requested number of records
      return history.slice(0, limitCount)
    } catch (error) {
      console.error("Error getting user history:", error)
      throw error
    }
  },

  // Get history between two users
  async getHistoryBetweenUsers(userId1: string, userId2: string): Promise<HistoryRecord[]> {
    try {
      const historyRef = collection(db, "history")

      // Query for records where userId1 is the user and userId2 is the partner
      const q1 = query(
        historyRef,
        where("userID", "==", userId1),
        where("Partner", "==", userId2),
        orderBy("timeStamp", "desc"),
      )

      // Query for records where userId2 is the user and userId1 is the partner
      const q2 = query(
        historyRef,
        where("userID", "==", userId2),
        where("Partner", "==", userId1),
        orderBy("timeStamp", "desc"),
      )

      const [snapshot1, snapshot2] = await Promise.all([getDocs(q1), getDocs(q2)])

      const history: HistoryRecord[] = []

      snapshot1.forEach((doc) => {
        history.push({ id: doc.id, ...doc.data() } as HistoryRecord)
      })

      snapshot2.forEach((doc) => {
        history.push({ id: doc.id, ...doc.data() } as HistoryRecord)
      })

      // Sort by timestamp descending
      history.sort((a, b) => {
        const timeA = a.timeStamp instanceof Timestamp ? a.timeStamp.toMillis() : a.timeStamp
        const timeB = b.timeStamp instanceof Timestamp ? b.timeStamp.toMillis() : b.timeStamp
        return timeB - timeA
      })

      return history
    } catch (error) {
      console.error("Error getting history between users:", error)
      throw error
    }
  },

  // Calculate total interaction time between two users
  async getTotalInteractionTime(userId1: string, userId2: string): Promise<number> {
    try {
      const history = await this.getHistoryBetweenUsers(userId1, userId2)

      // Sum up the duration of all interactions
      const totalDuration = history.reduce((sum, record) => sum + record.duration, 0)

      return totalDuration
    } catch (error) {
      console.error("Error calculating total interaction time:", error)
      throw error
    }
  },
}

