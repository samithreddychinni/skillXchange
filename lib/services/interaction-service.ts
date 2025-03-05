import { collection, addDoc, query, where, orderBy, getDocs, Timestamp, serverTimestamp } from "firebase/firestore"
import { db } from "../firebase"

export interface Interaction {
  id: string
  userId: string
  partnerId: string
  type: "chat" | "call" | "session"
  date: Timestamp
  duration?: number
  notes?: string
  rating?: number
}

export const interactionService = {
  // Record a new interaction
  async recordInteraction(interaction: Omit<Interaction, "id" | "date">): Promise<string> {
    const interactionsRef = collection(db, "interactions")

    const interactionData = {
      ...interaction,
      date: serverTimestamp(),
    }

    const interactionRef = await addDoc(interactionsRef, interactionData)
    return interactionRef.id
  },

  // Get user's interaction history
  async getUserInteractions(userId: string, limit = 20): Promise<Interaction[]> {
    const interactionsRef = collection(db, "interactions")
    const q = query(interactionsRef, where("userId", "==", userId), orderBy("date", "desc"), limit(limit))

    const querySnapshot = await getDocs(q)
    const interactions: Interaction[] = []

    querySnapshot.forEach((doc) => {
      interactions.push({ id: doc.id, ...doc.data() } as Interaction)
    })

    return interactions
  },

  // Get interactions between two users
  async getInteractionsBetweenUsers(userId1: string, userId2: string): Promise<Interaction[]> {
    const interactionsRef = collection(db, "interactions")

    // Query for interactions where userId1 is the user and userId2 is the partner
    const q1 = query(
      interactionsRef,
      where("userId", "==", userId1),
      where("partnerId", "==", userId2),
      orderBy("date", "desc"),
    )

    // Query for interactions where userId2 is the user and userId1 is the partner
    const q2 = query(
      interactionsRef,
      where("userId", "==", userId2),
      where("partnerId", "==", userId1),
      orderBy("date", "desc"),
    )

    const [snapshot1, snapshot2] = await Promise.all([getDocs(q1), getDocs(q2)])

    const interactions: Interaction[] = []

    snapshot1.forEach((doc) => {
      interactions.push({ id: doc.id, ...doc.data() } as Interaction)
    })

    snapshot2.forEach((doc) => {
      interactions.push({ id: doc.id, ...doc.data() } as Interaction)
    })

    // Sort by date descending
    interactions.sort((a, b) => {
      const dateA = a.date instanceof Timestamp ? a.date.toMillis() : a.date
      const dateB = b.date instanceof Timestamp ? b.date.toMillis() : b.date
      return dateB - dateA
    })

    return interactions
  },
}

