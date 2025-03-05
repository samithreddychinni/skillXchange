import { doc, setDoc, onSnapshot, serverTimestamp, getDoc, updateDoc, type Timestamp } from "firebase/firestore"
import { onDisconnect, ref, set, onValue, serverTimestamp as rtdbServerTimestamp } from "firebase/database"
import { db } from "../firebase"
import { getDatabase } from "firebase/database"

// Initialize Realtime Database
const rtdb = getDatabase()

export interface UserPresence {
  online: boolean
  lastSeen: Timestamp | null
  status: "online" | "away" | "offline"
  inCall: boolean
  callWith: string | null
}

export const presenceService = {
  // Set user as online
  async setUserOnline(userId: string): Promise<void> {
    try {
      // Update Firestore presence
      const userPresenceRef = doc(db, "presence", userId)
      await setDoc(
        userPresenceRef,
        {
          online: true,
          lastSeen: serverTimestamp(),
          status: "online",
          inCall: false,
          callWith: null,
        },
        { merge: true },
      )

      // Update Realtime Database presence
      const rtdbPresenceRef = ref(rtdb, `presence/${userId}`)
      await set(rtdbPresenceRef, {
        online: true,
        lastSeen: rtdbServerTimestamp(),
        status: "online",
      })

      // Set up disconnect handler
      const rtdbPresenceRefOnDisconnect = onDisconnect(rtdbPresenceRef)
      await rtdbPresenceRefOnDisconnect.update({
        online: false,
        lastSeen: rtdbServerTimestamp(),
        status: "offline",
      })
    } catch (error) {
      console.error("Error setting user online:", error)
      throw error
    }
  },

  // Set user as offline
  async setUserOffline(userId: string): Promise<void> {
    try {
      // Update Firestore presence
      const userPresenceRef = doc(db, "presence", userId)
      await updateDoc(userPresenceRef, {
        online: false,
        lastSeen: serverTimestamp(),
        status: "offline",
      })

      // Update Realtime Database presence
      const rtdbPresenceRef = ref(rtdb, `presence/${userId}`)
      await set(rtdbPresenceRef, {
        online: false,
        lastSeen: rtdbServerTimestamp(),
        status: "offline",
      })
    } catch (error) {
      console.error("Error setting user offline:", error)
      throw error
    }
  },

  // Set user in call
  async setUserInCall(userId: string, callWithUserId: string): Promise<void> {
    try {
      // Update Firestore presence
      const userPresenceRef = doc(db, "presence", userId)
      await updateDoc(userPresenceRef, {
        inCall: true,
        callWith: callWithUserId,
      })

      // Update Realtime Database presence
      const rtdbPresenceRef = ref(rtdb, `presence/${userId}`)
      await set(
        rtdbPresenceRef,
        {
          inCall: true,
          callWith: callWithUserId,
        },
        { merge: true },
      )
    } catch (error) {
      console.error("Error setting user in call:", error)
      throw error
    }
  },

  // Set user not in call
  async setUserNotInCall(userId: string): Promise<void> {
    try {
      // Update Firestore presence
      const userPresenceRef = doc(db, "presence", userId)
      await updateDoc(userPresenceRef, {
        inCall: false,
        callWith: null,
      })

      // Update Realtime Database presence
      const rtdbPresenceRef = ref(rtdb, `presence/${userId}`)
      await set(
        rtdbPresenceRef,
        {
          inCall: false,
          callWith: null,
        },
        { merge: true },
      )
    } catch (error) {
      console.error("Error setting user not in call:", error)
      throw error
    }
  },

  // Get user presence
  async getUserPresence(userId: string): Promise<UserPresence | null> {
    try {
      const userPresenceRef = doc(db, "presence", userId)
      const userPresenceSnap = await getDoc(userPresenceRef)

      if (userPresenceSnap.exists()) {
        return userPresenceSnap.data() as UserPresence
      }

      return null
    } catch (error) {
      console.error("Error getting user presence:", error)
      throw error
    }
  },

  // Subscribe to user presence
  subscribeToUserPresence(userId: string, callback: (presence: UserPresence | null) => void): () => void {
    const userPresenceRef = doc(db, "presence", userId)

    const unsubscribe = onSnapshot(
      userPresenceRef,
      (doc) => {
        if (doc.exists()) {
          callback(doc.data() as UserPresence)
        } else {
          callback(null)
        }
      },
      (error) => {
        console.error("Error subscribing to user presence:", error)
        callback(null)
      },
    )

    return unsubscribe
  },

  // Subscribe to real-time user presence
  subscribeToRealtimePresence(userId: string, callback: (online: boolean) => void): () => void {
    const rtdbPresenceRef = ref(rtdb, `presence/${userId}`)

    const unsubscribe = onValue(
      rtdbPresenceRef,
      (snapshot) => {
        const data = snapshot.val()
        if (data) {
          callback(data.online === true)
        } else {
          callback(false)
        }
      },
      (error) => {
        console.error("Error subscribing to realtime presence:", error)
        callback(false)
      },
    )

    return unsubscribe
  },
}

