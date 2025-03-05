"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Video, VideoOff, Mic, MicOff, PhoneOff, MonitorUp, X, Star } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/context/auth-context"
import { callService } from "@/lib/services/call-service"
import { presenceService } from "@/lib/services/presence-service"
import { historyService } from "@/lib/services/history-service"
import { userService } from "@/lib/services/user-service"
import { toast } from "@/components/ui/use-toast"

interface VideoCallProps {
  uid: string
  recipientId: string | null
  recipientUsername?: string
}

export default function VideoCall({ uid, recipientId, recipientUsername = "User" }: VideoCallProps) {
  const [isCallActive, setIsCallActive] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [showRatingDialog, setShowRatingDialog] = useState(false)
  const [rating, setRating] = useState(0)
  const [feedback, setFeedback] = useState("")
  const [isSubmittingRating, setIsSubmittingRating] = useState(false)
  const [callId, setCallId] = useState<string | null>(null)
  const [callStartTime, setCallStartTime] = useState<Date | null>(null)
  const [isRecipientOnline, setIsRecipientOnline] = useState(false)
  const [showIncomingCallDialog, setShowIncomingCallDialog] = useState(false)
  const [incomingCallId, setIncomingCallId] = useState<string | null>(null)
  const [incomingCallUser, setIncomingCallUser] = useState<string | null>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const [callButtonClicked, setCallButtonClicked] = useState(false)
  const { user } = useAuth()

  // Check if recipient is online
  useEffect(() => {
    if (!recipientId) return

    const unsubscribe = presenceService.subscribeToRealtimePresence(recipientId, (online) => {
      setIsRecipientOnline(online)
    })

    return () => unsubscribe()
  }, [recipientId])

  // Subscribe to incoming calls
  useEffect(() => {
    if (!user) return

    const unsubscribe = callService.subscribeToIncomingCalls(user.uid, async (calls) => {
      if (calls.length > 0 && !isCallActive) {
        const incomingCall = calls[0]
        setIncomingCallId(incomingCall.id)

        // Get caller username
        try {
          const callerProfile = await userService.getUserProfile(incomingCall.initiator)
          if (callerProfile) {
            setIncomingCallUser(callerProfile.username)
          } else {
            setIncomingCallUser("Unknown User")
          }
        } catch (error) {
          console.error("Error fetching caller profile:", error)
          setIncomingCallUser("Unknown User")
        }

        setShowIncomingCallDialog(true)
      }
    })

    return () => unsubscribe()
  }, [user, isCallActive])

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop())
      }

      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
      }

      // If call is active, end it
      if (isCallActive && callId && user) {
        endCall()
      }
    }
  }, [isCallActive, callId, user])

  const setupPeerConnection = () => {
    const configuration = {
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }],
    }

    const peerConnection = new RTCPeerConnection(configuration)

    // Add local stream tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStreamRef.current!)
      })
    }

    // Handle incoming remote stream
    peerConnection.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0]
      }
    }

    // ICE candidate handling
    peerConnection.onicecandidate = async (event) => {
      if (event.candidate && callId && user) {
        // Store the ICE candidate in the database for the other peer to use
        await callService.addIceCandidate(callId, event.candidate.toJSON(), user.uid)
      }
    }

    // Connection state change handling
    peerConnection.onconnectionstatechange = () => {
      if (peerConnection.connectionState === "connected") {
        toast({
          title: "Call Connected",
          description: "You are now connected to the other person",
          variant: "success",
          duration: 3000,
        })
      } else if (peerConnection.connectionState === "disconnected" || peerConnection.connectionState === "failed") {
        toast({
          title: "Call Disconnected",
          description: "Connection with the other person was lost",
          variant: "destructive",
          duration: 3000,
        })
        endCall()
      }
    }

    peerConnectionRef.current = peerConnection
    return peerConnection
  }

  // Subscribe to WebRTC signaling
  const subscribeToSignaling = (callId: string) => {
    // Subscribe to offer/answer updates
    const unsubscribeSignaling = callService.subscribeToCallSignaling(callId, async (signalData) => {
      if (!peerConnectionRef.current || !user) return

      // Handle offer (if you're the callee)
      if (signalData.offer && !signalData.answer && user.uid !== signalData.offerCreatedBy) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(signalData.offer))
          const answer = await peerConnectionRef.current.createAnswer()
          await peerConnectionRef.current.setLocalDescription(answer)

          // Store the answer
          await callService.updateCallSignaling(callId, {
            answer,
            answerCreatedBy: user.uid,
          })
        } catch (error) {
          console.error("Error handling offer:", error)
        }
      }

      // Handle answer (if you're the caller)
      if (signalData.answer && user.uid !== signalData.answerCreatedBy) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(signalData.answer))
        } catch (error) {
          console.error("Error handling answer:", error)
        }
      }
    })

    // Subscribe to ICE candidates
    const unsubscribeIceCandidates = callService.subscribeToIceCandidates(callId, async (candidates) => {
      if (!peerConnectionRef.current || !user) return

      // Add any new candidates from the other peer
      for (const candidate of candidates) {
        if (candidate.createdBy !== user.uid) {
          try {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate.candidate))
          } catch (error) {
            console.error("Error adding ICE candidate:", error)
          }
        }
      }
    })

    // Return unsubscribe function
    return () => {
      unsubscribeSignaling()
      unsubscribeIceCandidates()
    }
  }

  const startCall = async () => {
    if (callButtonClicked || !recipientId || !user) return
    setCallButtonClicked(true)

    try {
      // For sample users, simulate a call
      if (recipientId.startsWith("sample-user")) {
        // Simulate getting user media
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        localStreamRef.current = stream

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }

        // Create a sample call ID
        const newCallId = `sample_call_${user.uid}_${recipientId}`
        setCallId(newCallId)

        setIsCallActive(true)
        setIsFullScreen(true)
        setCallStartTime(new Date())

        toast({
          title: "Sample Call Started",
          description: `This is a simulated call with ${recipientUsername}. You can test the call controls.`,
          duration: 5000,
        })

        // Reset button state after a delay
        setTimeout(() => {
          setCallButtonClicked(false)
        }, 1000)

        return
      }

      // Normal call flow for real users
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      localStreamRef.current = stream

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      // Create call in database
      const newCallId = await callService.initiateCall(user.uid, recipientId)
      setCallId(newCallId)

      // Setup WebRTC peer connection
      const peerConnection = setupPeerConnection()

      // Subscribe to signaling
      subscribeToSignaling(newCallId)

      // Create and set local offer
      const offer = await peerConnection.createOffer()
      await peerConnection.setLocalDescription(offer)

      // Store the offer
      await callService.updateCallSignaling(newCallId, {
        offer,
        offerCreatedBy: user.uid,
      })

      // Update presence status
      await presenceService.setUserInCall(user.uid, recipientId)

      setIsCallActive(true)
      setIsFullScreen(true)
      setCallStartTime(new Date())

      toast({
        title: "Call Started",
        description: `Calling ${recipientUsername}...`,
        duration: 3000,
      })

      // Reset button state after a delay
      setTimeout(() => {
        setCallButtonClicked(false)
      }, 1000)
    } catch (error) {
      console.error("Error starting call:", error)
      setCallButtonClicked(false)

      toast({
        title: "Call Failed",
        description: "Could not start the call. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
    }
  }

  const acceptIncomingCall = async () => {
    if (!incomingCallId || !user || !incomingCallUser) return

    try {
      // Get call details
      const call = await callService.getCall(incomingCallId)
      if (!call) {
        toast({
          title: "Call Not Found",
          description: "The call no longer exists.",
          variant: "destructive",
          duration: 3000,
        })
        setShowIncomingCallDialog(false)
        return
      }

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      localStreamRef.current = stream

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      // Accept call in database
      await callService.acceptCall(incomingCallId)
      setCallId(incomingCallId)

      // Setup WebRTC peer connection
      setupPeerConnection()

      // Subscribe to signaling
      subscribeToSignaling(incomingCallId)

      // Update presence status
      await presenceService.setUserInCall(user.uid, call.initiator)

      setIsCallActive(true)
      setIsFullScreen(true)
      setCallStartTime(new Date())
      setShowIncomingCallDialog(false)

      toast({
        title: "Call Accepted",
        description: `Connected with ${incomingCallUser}`,
        variant: "success",
        duration: 3000,
      })
    } catch (error) {
      console.error("Error accepting call:", error)

      toast({
        title: "Call Failed",
        description: "Could not accept the call. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
    }
  }

  const rejectIncomingCall = async () => {
    if (!incomingCallId) return

    try {
      // Reject call in database
      await callService.rejectCall(incomingCallId)
      setShowIncomingCallDialog(false)

      toast({
        title: "Call Rejected",
        description: "You declined the incoming call",
        duration: 3000,
      })
    } catch (error) {
      console.error("Error rejecting call:", error)
    }
  }

  const endCall = async () => {
    if (!user || !callId) return

    try {
      // Stop media tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop())
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null
      }

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null
      }

      // Close peer connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
        peerConnectionRef.current = null
      }

      // For sample users, just clean up local state
      if (callId.startsWith("sample_call")) {
        setIsCallActive(false)
        setIsScreenSharing(false)
        setIsFullScreen(false)

        // Show rating dialog after call ends
        setShowRatingDialog(true)

        toast({
          title: "Sample Call Ended",
          description: "The sample call has been ended",
          duration: 3000,
        })

        return
      }

      // End call in database for real users
      await callService.endCall(callId)

      // Update presence status
      await presenceService.setUserNotInCall(user.uid)

      // Record call in history
      if (callStartTime && recipientId) {
        const endTime = new Date()
        const durationInSeconds = Math.floor((endTime.getTime() - callStartTime.getTime()) / 1000)

        await historyService.addHistoryRecord({
          userID: user.uid,
          Partner: recipientId,
          duration: durationInSeconds,
        })
      }

      setIsCallActive(false)
      setIsScreenSharing(false)
      setIsFullScreen(false)

      // Show rating dialog after call ends
      setShowRatingDialog(true)

      toast({
        title: "Call Ended",
        description: "The call has been ended",
        duration: 3000,
      })
    } catch (error) {
      console.error("Error ending call:", error)

      toast({
        title: "Error",
        description: "There was a problem ending the call",
        variant: "destructive",
        duration: 3000,
      })
    }
  }

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks()
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled
      })
      setIsMuted(!isMuted)

      toast({
        title: isMuted ? "Microphone Enabled" : "Microphone Disabled",
        description: isMuted ? "Others can now hear you" : "Others cannot hear you",
        duration: 2000,
      })
    }
  }

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks()
      videoTracks.forEach((track) => {
        track.enabled = !track.enabled
      })
      setIsVideoEnabled(!isVideoEnabled)

      toast({
        title: isVideoEnabled ? "Camera Disabled" : "Camera Enabled",
        description: isVideoEnabled ? "Others cannot see you" : "Others can now see you",
        duration: 2000,
      })
    }
  }

  const toggleScreenShare = async () => {
    if (!localStreamRef.current) return

    try {
      if (isScreenSharing) {
        // Stop screen sharing and revert to camera
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })

        // Replace tracks in peer connection
        if (peerConnectionRef.current) {
          const senders = peerConnectionRef.current.getSenders()
          const videoTrack = stream.getVideoTracks()[0]

          const videoSender = senders.find((sender) => sender.track?.kind === "video")

          if (videoSender && videoTrack) {
            videoSender.replaceTrack(videoTrack)
          }
        }

        // Update local video
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }

        localStreamRef.current = stream

        toast({
          title: "Screen Sharing Stopped",
          description: "Switched back to camera",
          duration: 2000,
        })
      } else {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true })
        const screenTrack = screenStream.getVideoTracks()[0]

        // Replace video track in peer connection
        if (peerConnectionRef.current) {
          const senders = peerConnectionRef.current.getSenders()

          const videoSender = senders.find((sender) => sender.track?.kind === "video")

          if (videoSender) {
            videoSender.replaceTrack(screenTrack)
          }
        }

        // Create a combined stream with screen video and original audio
        const combinedStream = new MediaStream()

        // Add screen video track
        combinedStream.addTrack(screenTrack)

        // Add audio tracks from original stream
        if (localStreamRef.current) {
          localStreamRef.current.getAudioTracks().forEach((track) => {
            combinedStream.addTrack(track)
          })
        }

        // Update local video
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = combinedStream
        }

        // Handle screen sharing ended by user
        screenTrack.onended = () => {
          toggleScreenShare()
        }

        localStreamRef.current = combinedStream

        toast({
          title: "Screen Sharing Started",
          description: "Others can now see your screen",
          duration: 2000,
        })
      }

      setIsScreenSharing(!isScreenSharing)
    } catch (error) {
      console.error("Error toggling screen share:", error)

      toast({
        title: "Screen Sharing Failed",
        description: "Could not share your screen. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
    }
  }

  const exitFullScreen = () => {
    setIsFullScreen(false)
  }

  const handleRatingSubmit = async () => {
    if (!user || !recipientId) return

    setIsSubmittingRating(true)

    try {
      // Submit rating to call service
      if (callId) {
        await callService.rateCall({
          callId,
          ratedBy: user.uid,
          ratedUser: recipientId,
          rating,
        })
      }

      // Add rating to user profile
      await userService.addRating(recipientId, {
        ratedBy: user.uid,
        rating,
        feedback,
        timestamp: new Date().toISOString(),
      })

      // Close dialog and reset state
      setShowRatingDialog(false)
      setRating(0)
      setFeedback("")

      toast({
        title: "Rating Submitted",
        description: "Thank you for your feedback!",
        variant: "success",
        duration: 3000,
      })
    } catch (error) {
      console.error("Error submitting rating:", error)

      toast({
        title: "Rating Failed",
        description: "Could not submit your rating. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setIsSubmittingRating(false)
    }
  }

  const handleRatingSkip = () => {
    setShowRatingDialog(false)
    setRating(0)
    setFeedback("")
  }

  if (isFullScreen && isCallActive) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
        <div className="p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">Video Call with {recipientUsername}</h2>
          <Button variant="ghost" size="icon" onClick={exitFullScreen} className="transition-all hover:bg-primary/10">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex-grow p-4 flex items-center justify-center">
          <div className="grid grid-cols-2 gap-4 w-full max-w-4xl h-full max-h-[70vh]">
            <div className="relative bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center shadow-md animate-slide-up">
              <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
              {!isVideoEnabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 text-white">
                  Camera Off
                </div>
              )}
            </div>
            <div
              className="relative bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center shadow-md animate-slide-up"
              style={{ animationDelay: "0.1s" }}
            >
              <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 text-white">
                Connecting...
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 flex justify-center gap-4">
          <Button
            onClick={toggleMute}
            variant="outline"
            size="lg"
            className={`transition-all ${isMuted ? "bg-red-100 dark:bg-red-900" : ""}`}
          >
            {isMuted ? <MicOff className="h-5 w-5 mr-2" /> : <Mic className="h-5 w-5 mr-2" />}
            {isMuted ? "Unmute" : "Mute"}
          </Button>
          <Button
            onClick={endCall}
            variant="destructive"
            size="lg"
            className="bg-red-600 hover:bg-red-700 transition-all"
          >
            <PhoneOff className="h-5 w-5 mr-2" />
            End Call
          </Button>
          <Button
            onClick={toggleVideo}
            variant="outline"
            size="lg"
            className={`transition-all ${!isVideoEnabled ? "bg-red-100 dark:bg-red-900" : ""}`}
          >
            {isVideoEnabled ? <Video className="h-5 w-5 mr-2" /> : <VideoOff className="h-5 w-5 mr-2" />}
            {isVideoEnabled ? "Turn Off Camera" : "Turn On Camera"}
          </Button>
          <Button
            onClick={toggleScreenShare}
            variant="outline"
            size="lg"
            className={`transition-all ${isScreenSharing ? "bg-green-100 dark:bg-green-900" : ""}`}
          >
            <MonitorUp className="h-5 w-5 mr-2" />
            {isScreenSharing ? "Stop Sharing" : "Share Screen"}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <Card className="shadow-md animate-fade-in">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">
            {recipientId ? `Video Call with ${recipientUsername}` : "Start a Video Call"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center h-[200px] shadow-md animate-slide-up">
              <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
              {(!isCallActive || !isVideoEnabled) && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 text-white">
                  {isCallActive && !isVideoEnabled ? "Camera Off" : "Your Camera"}
                </div>
              )}
            </div>
            <div
              className="relative bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center h-[200px] shadow-md animate-slide-up"
              style={{ animationDelay: "0.1s" }}
            >
              <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 text-white">
                {isCallActive ? "Connecting..." : "Recipient Camera"}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center gap-2 pt-2">
          {isCallActive ? (
            <>
              <Button
                onClick={toggleMute}
                variant="outline"
                size="icon"
                className={`transition-all ${isMuted ? "bg-red-100 dark:bg-red-900" : ""}`}
              >
                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Button
                onClick={endCall}
                variant="destructive"
                size="icon"
                className="bg-red-600 hover:bg-red-700 transition-all"
              >
                <PhoneOff className="h-4 w-4" />
              </Button>
              <Button
                onClick={toggleVideo}
                variant="outline"
                size="icon"
                className={`transition-all ${!isVideoEnabled ? "bg-red-100 dark:bg-red-900" : ""}`}
              >
                {isVideoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
              </Button>
              <Button
                onClick={toggleScreenShare}
                variant="outline"
                size="icon"
                className={`transition-all ${isScreenSharing ? "bg-green-100 dark:bg-green-900" : ""}`}
              >
                <MonitorUp className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button
              onClick={startCall}
              disabled={!recipientId || callButtonClicked || !isRecipientOnline}
              className="bg-primary hover:bg-primary/80 transition-all"
            >
              {callButtonClicked ? "Connecting..." : isRecipientOnline ? "Start Call" : "User Offline"}
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Rating Dialog */}
      <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rate your call experience</DialogTitle>
            <DialogDescription>
              How was your call with {recipientUsername}? Your feedback helps improve our community.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`p-1 rounded-full transition-all ${
                    rating >= star ? "text-yellow-400 scale-110" : "text-gray-300 hover:text-yellow-200"
                  }`}
                >
                  <Star className="h-8 w-8 fill-current" />
                </button>
              ))}
            </div>
          </div>
          <Textarea
            placeholder="Share your feedback (optional)"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={handleRatingSkip}>
              Skip
            </Button>
            <Button
              onClick={handleRatingSubmit}
              disabled={rating === 0 || isSubmittingRating}
              className="bg-primary hover:bg-primary/80"
            >
              {isSubmittingRating ? "Submitting..." : "Submit Rating"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Incoming Call Dialog */}
      <Dialog open={showIncomingCallDialog} onOpenChange={setShowIncomingCallDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Incoming Call</DialogTitle>
            <DialogDescription>{incomingCallUser} is calling you.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <div className="flex gap-4">
              <Button
                onClick={rejectIncomingCall}
                variant="outline"
                className="border-red-500 text-red-500 hover:bg-red-50"
              >
                <PhoneOff className="h-4 w-4 mr-2" />
                Decline
              </Button>
              <Button onClick={acceptIncomingCall} className="bg-green-600 hover:bg-green-700 text-white">
                <Video className="h-4 w-4 mr-2" />
                Accept
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

