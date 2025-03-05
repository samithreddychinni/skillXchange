"use client"

import { useState, useEffect, useCallback } from "react"
import { callService, type Call } from "../services/call-service"
import { useAuth } from "../context/auth-context"

export function useCall(callId?: string) {
  const { user } = useAuth()
  const [call, setCall] = useState<Call | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [incomingCalls, setIncomingCalls] = useState<Call[]>([])

  // Load call data
  useEffect(() => {
    if (!callId || !user) return

    const loadCall = async () => {
      setLoading(true)
      setError(null)

      try {
        const callData = await callService.getCall(callId)
        setCall(callData)
      } catch (err) {
        console.error("Error loading call:", err)
        setError("Failed to load call")
      } finally {
        setLoading(false)
      }
    }

    loadCall()
  }, [callId, user])

  // Subscribe to call updates
  useEffect(() => {
    if (!callId || !user) return

    const unsubscribe = callService.subscribeToCall(callId, (updatedCall) => {
      setCall(updatedCall)
    })

    return () => unsubscribe()
  }, [callId, user])

  // Subscribe to incoming calls
  useEffect(() => {
    if (!user) return

    const unsubscribe = callService.subscribeToIncomingCalls(user.uid, (calls) => {
      setIncomingCalls(calls)
    })

    return () => unsubscribe()
  }, [user])

  // Initiate a call
  const initiateCall = useCallback(
    async (recipientId: string) => {
      if (!user) {
        setError("Cannot initiate call: not authenticated")
        return null
      }

      try {
        const newCallId = await callService.initiateCall(user.uid, recipientId)
        return newCallId
      } catch (err) {
        console.error("Error initiating call:", err)
        setError("Failed to initiate call")
        return null
      }
    },
    [user],
  )

  // Accept a call
  const acceptCall = useCallback(
    async (callIdToAccept: string) => {
      if (!user) {
        setError("Cannot accept call: not authenticated")
        return
      }

      try {
        await callService.acceptCall(callIdToAccept)
      } catch (err) {
        console.error("Error accepting call:", err)
        setError("Failed to accept call")
      }
    },
    [user],
  )

  // Reject a call
  const rejectCall = useCallback(
    async (callIdToReject: string) => {
      if (!user) {
        setError("Cannot reject call: not authenticated")
        return
      }

      try {
        await callService.rejectCall(callIdToReject)
      } catch (err) {
        console.error("Error rejecting call:", err)
        setError("Failed to reject call")
      }
    },
    [user],
  )

  // End a call
  const endCall = useCallback(
    async (callIdToEnd: string = callId || "") => {
      if (!callIdToEnd || !user) {
        setError("Cannot end call: not authenticated or no call selected")
        return
      }

      try {
        await callService.endCall(callIdToEnd)
      } catch (err) {
        console.error("Error ending call:", err)
        setError("Failed to end call")
      }
    },
    [callId, user],
  )

  // Rate a call
  const rateCall = useCallback(
    async (callIdToRate: string = callId || "", ratedUserId: string, rating: number, feedback?: string) => {
      if (!callIdToRate || !user) {
        setError("Cannot rate call: not authenticated or no call selected")
        return
      }

      try {
        await callService.rateCall({
          callId: callIdToRate,
          ratedBy: user.uid,
          ratedUser: ratedUserId,
          rating,
          feedback,
        })
      } catch (err) {
        console.error("Error rating call:", err)
        setError("Failed to rate call")
      }
    },
    [callId, user],
  )

  return {
    call,
    loading,
    error,
    incomingCalls,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    rateCall,
  }
}

