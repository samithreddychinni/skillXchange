import {
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  type Timestamp,
  query,
  where,
  orderBy,
  getDocs,
  arrayUnion,
  setDoc,
} from "firebase/firestore"
import { db } from "../firebase"

export interface Call {
  id: string
  participants: string[]
  initiator: string
  status: "pending" | "active" | "completed" | "rejected"
  startTime?: Timestamp
  endTime?: Timestamp
  duration?: number
  rated?: boolean
}

export interface CallRating {
  callId: string
  ratedBy: string
  ratedUser: string
  rating: number
  feedback?: string
  timestamp?: Timestamp
}

export interface SignalingData {
  offer?: RTCSessionDescriptionInit
  offerCreatedBy?: string
  answer?: RTCSessionDescriptionInit
  answerCreatedBy?: string
  updatedAt?: Timestamp
}

export interface IceCandidate {
  candidate: RTCIceCandidateInit
  createdBy: string
  createdAt: Timestamp
}

export const callService = {
  // Initiate a call
  async initiateCall(initiatorId: string, recipientId: string): Promise<string> {
    try {
      const callsRef = collection(db, "calls")

      const callData: Omit<Call, "id"> = {
        participants: [initiatorId, recipientId].sort(),
        initiator: initiatorId,
        status: "pending",
        startTime: serverTimestamp() as Timestamp,
      }

      const callRef = await addDoc(callsRef, callData)

      // Create signaling document
      await setDoc(doc(db, "callSignaling", callRef.id), {
        createdAt: serverTimestamp(),
      })

      return callRef.id
    } catch (error) {
      console.error("Error initiating call:", error)
      throw error
    }
  },

  // Get call by ID
  async getCall(callId: string): Promise<Call | null> {
    try {
      const callRef = doc(db, "calls", callId)
      const callSnap = await getDoc(callRef)

      if (callSnap.exists()) {
        return { id: callSnap.id, ...callSnap.data() } as Call
      }

      return null
    } catch (error) {
      console.error("Error getting call:", error)
      throw error
    }
  },

  // Accept a call
  async acceptCall(callId: string): Promise<void> {
    try {
      const callRef = doc(db, "calls", callId)
      await updateDoc(callRef, {
        status: "active",
        startTime: serverTimestamp(),
      })
    } catch (error) {
      console.error("Error accepting call:", error)
      throw error
    }
  },

  // Reject a call
  async rejectCall(callId: string): Promise<void> {
    try {
      const callRef = doc(db, "calls", callId)
      await updateDoc(callRef, {
        status: "rejected",
        endTime: serverTimestamp(),
      })
    } catch (error) {
      console.error("Error rejecting call:", error)
      throw error
    }
  },

  // End a call
  async endCall(callId: string): Promise<void> {
    try {
      const callRef = doc(db, "calls", callId)
      const callSnap = await getDoc(callRef)

      if (callSnap.exists()) {
        const callData = callSnap.data() as Call
        const startTime = callData.startTime?.toDate() || new Date()
        const endTime = new Date()
        const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000) // in seconds

        await updateDoc(callRef, {
          status: "completed",
          endTime: serverTimestamp(),
          duration,
        })
      }
    } catch (error) {
      console.error("Error ending call:", error)
      throw error
    }
  },

  // Update call signaling data (WebRTC)
  async updateCallSignaling(callId: string, data: Partial<SignalingData>): Promise<void> {
    try {
      const signalingRef = doc(db, "callSignaling", callId)

      await updateDoc(signalingRef, {
        ...data,
        updatedAt: serverTimestamp(),
      })
    } catch (error) {
      console.error("Error updating call signaling:", error)
      throw error
    }
  },

  // Get call signaling data
  async getCallSignaling(callId: string): Promise<SignalingData | null> {
    try {
      const signalingRef = doc(db, "callSignaling", callId)
      const signalingSnap = await getDoc(signalingRef)

      if (signalingSnap.exists()) {
        return signalingSnap.data() as SignalingData
      }

      return null
    } catch (error) {
      console.error("Error getting call signaling:", error)
      throw error
    }
  },

  // Subscribe to call signaling changes
  subscribeToCallSignaling(callId: string, callback: (data: SignalingData) => void): () => void {
    try {
      const signalingRef = doc(db, "callSignaling", callId)

      return onSnapshot(signalingRef, (doc) => {
        if (doc.exists()) {
          callback(doc.data() as SignalingData)
        }
      })
    } catch (error) {
      console.error("Error subscribing to call signaling:", error)
      throw error
    }
  },

  // Add ICE candidate
  async addIceCandidate(callId: string, candidate: RTCIceCandidateInit, userId: string): Promise<void> {
    try {
      const candidatesRef = doc(db, "callIceCandidates", callId)
      const candidatesSnap = await getDoc(candidatesRef)

      if (candidatesSnap.exists()) {
        // Add to existing document
        await updateDoc(candidatesRef, {
          candidates: arrayUnion({
            candidate,
            createdBy: userId,
            createdAt: serverTimestamp(),
          }),
        })
      } else {
        // Create new document
        await setDoc(candidatesRef, {
          candidates: [
            {
              candidate,
              createdBy: userId,
              createdAt: serverTimestamp(),
            },
          ],
        })
      }
    } catch (error) {
      console.error("Error adding ICE candidate:", error)
      throw error
    }
  },

  // Subscribe to ICE candidates
  subscribeToIceCandidates(callId: string, callback: (candidates: IceCandidate[]) => void): () => void {
    try {
      const candidatesRef = doc(db, "callIceCandidates", callId)

      return onSnapshot(candidatesRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data()
          if (data?.candidates) {
            callback(data.candidates)
          }
        }
      })
    } catch (error) {
      console.error("Error subscribing to ICE candidates:", error)
      throw error
    }
  },

  // Rate a call
  async rateCall(rating: Omit<CallRating, "timestamp">): Promise<void> {
    try {
      const ratingsRef = collection(db, "callRatings")

      const ratingData = {
        ...rating,
        timestamp: serverTimestamp(),
      }

      await addDoc(ratingsRef, ratingData)

      // Mark call as rated
      const callRef = doc(db, "calls", rating.callId)
      await updateDoc(callRef, {
        rated: true,
      })
    } catch (error) {
      console.error("Error rating call:", error)
      throw error
    }
  },

  // Get call history for a user
  async getUserCallHistory(userId: string, limit = 20): Promise<Call[]> {
    try {
      const callsRef = collection(db, "calls")
      const q = query(
        callsRef,
        where("participants", "array-contains", userId),
        orderBy("startTime", "desc"),
        limit(limit),
      )

      const querySnapshot = await getDocs(q)
      const calls: Call[] = []

      querySnapshot.forEach((doc) => {
        calls.push({ id: doc.id, ...doc.data() } as Call)
      })

      return calls
    } catch (error) {
      console.error("Error getting call history:", error)
      throw error
    }
  },

  // Subscribe to call status
  subscribeToCall(callId: string, callback: (call: Call) => void): () => void {
    try {
      const callRef = doc(db, "calls", callId)

      return onSnapshot(callRef, (doc) => {
        if (doc.exists()) {
          callback({ id: doc.id, ...doc.data() } as Call)
        }
      })
    } catch (error) {
      console.error("Error subscribing to call:", error)
      throw error
    }
  },

  // Subscribe to incoming calls
  subscribeToIncomingCalls(userId: string, callback: (calls: Call[]) => void): () => void {
    try {
      const callsRef = collection(db, "calls")
      const q = query(
        callsRef,
        where("participants", "array-contains", userId),
        where("status", "==", "pending"),
        where("initiator", "!=", userId),
      )

      return onSnapshot(q, (querySnapshot) => {
        const calls: Call[] = []

        querySnapshot.forEach((doc) => {
          calls.push({ id: doc.id, ...doc.data() } as Call)
        })

        callback(calls)
      })
    } catch (error) {
      console.error("Error subscribing to incoming calls:", error)
      throw error
    }
  },
}

