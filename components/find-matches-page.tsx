"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { findMatchesService, type MatchResult } from "@/lib/services/find-matches-service"
import { useAuth } from "@/lib/context/auth-context"
import { Loader2, MessageSquare, Video } from "lucide-react"
import { useChat } from "@/lib/hooks/use-chat"
import { useCall } from "@/lib/hooks/use-call"
import { matchingService } from "@/lib/services/matching-service"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"

export default function FindMatchesPage() {
  const { user, userProfile } = useAuth()
  const [matches, setMatches] = useState<MatchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<MatchResult | null>(null)
  const [activeTab, setActiveTab] = useState<"chat" | "video">("chat")
  const { startChat, chatMessages, sendMessage } = useChat()
  const { startCall, endCall, callStatus } = useCall()
  const [connectionStatus, setConnectionStatus] = useState<Record<string, string>>({})

  useEffect(() => {
    if (user?.uid) {
      fetchMatches()
    }
  }, [user?.uid])

  const fetchMatches = async () => {
    if (!user?.uid) return

    setLoading(true)
    try {
      const results = await findMatchesService.findMatches(user.uid)
      setMatches(results)

      // Check connection status for each match
      const statuses: Record<string, string> = {}
      for (const match of results) {
        if (!match.isSampleUser) {
          const status = await matchingService.getConnectionStatus(user.uid, match.user.uid)
          statuses[match.user.uid] = status
        } else {
          // Sample users are always "pending" to allow interaction
          statuses[match.user.uid] = "pending"
        }
      }
      setConnectionStatus(statuses)
    } catch (error) {
      console.error("Error fetching matches:", error)
      // No error toast here
    } finally {
      setLoading(false)
    }
  }

  const handleUserSelect = (match: MatchResult) => {
    setSelectedUser(match)

    if (activeTab === "chat") {
      handleStartChat(match)
    } else {
      handleStartCall(match)
    }
  }

  const handleStartChat = (match: MatchResult) => {
    if (!user?.uid) return

    startChat(user.uid, match.user.uid, match.isSampleUser)
  }

  const handleStartCall = (match: MatchResult) => {
    if (!user?.uid) return

    startCall(user.uid, match.user.uid, match.isSampleUser)
  }

  const handleSendMessage = (message: string) => {
    if (!selectedUser) return

    sendMessage(message, selectedUser.isSampleUser)
  }

  const handleConnect = async (matchUserId: string) => {
    if (!user?.uid) return

    try {
      await matchingService.sendConnectionRequest(user.uid, matchUserId)
      setConnectionStatus((prev) => ({ ...prev, [matchUserId]: "pending" }))

      toast({
        title: "Connection Request Sent",
        description: "We'll notify you when they respond.",
        duration: 3000,
      })
    } catch (error) {
      console.error("Error sending connection request:", error)

      toast({
        title: "Connection Request Failed",
        description: "Please try again later.",
        variant: "destructive",
        duration: 3000,
      })
    }
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value as "chat" | "video")

    if (selectedUser) {
      if (value === "chat") {
        handleStartChat(selectedUser)
      } else {
        handleStartCall(selectedUser)
      }
    }
  }

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <h2 className="text-2xl font-bold mb-4">Potential Matches</h2>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              {matches.map((match) => (
                <Card
                  key={match.user.uid}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedUser?.user.uid === match.user.uid ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => handleUserSelect(match)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 rounded-full overflow-hidden">
                        <img
                          src={match.user.profileImage || "/placeholder.svg?height=100&width=100"}
                          alt={match.user.displayName}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{match.user.displayName}</h3>
                        <p className="text-sm text-gray-500 truncate">{match.matchReason}</p>
                      </div>
                      <div>
                        {connectionStatus[match.user.uid] === "connected" ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Connected
                          </Badge>
                        ) : connectionStatus[match.user.uid] === "pending" ? (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            Pending
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleConnect(match.user.uid)
                            }}
                          >
                            Connect
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {matches.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500">
                  <p>No matches found. Try updating your profile with more skills.</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          {selectedUser ? (
            <div className="bg-white rounded-lg shadow-sm border h-full">
              <div className="p-4 border-b flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full overflow-hidden">
                    <img
                      src={selectedUser.user.profileImage || "/placeholder.svg?height=100&width=100"}
                      alt={selectedUser.user.displayName}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-medium">{selectedUser.user.displayName}</h3>
                    <p className="text-xs text-gray-500">{selectedUser.user.location}</p>
                  </div>
                </div>

                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-auto">
                  <TabsList>
                    <TabsTrigger value="chat" className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      <span className="hidden sm:inline">Chat</span>
                    </TabsTrigger>
                    <TabsTrigger value="video" className="flex items-center gap-1">
                      <Video className="h-4 w-4" />
                      <span className="hidden sm:inline">Video</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="h-[calc(100%-60px)]">
                <TabsContent value="chat" className="h-full m-0">
                  {selectedUser && (
                    <div className="flex flex-col h-full">
                      <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {chatMessages.map((msg, i) => (
                          <div
                            key={i}
                            className={`flex ${msg.senderId === user?.uid ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg p-3 ${
                                msg.senderId === user?.uid
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              <p>{msg.text}</p>
                              <p className="text-xs opacity-70 mt-1">
                                {new Date(msg.timestamp).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </div>
                        ))}

                        {chatMessages.length === 0 && (
                          <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <MessageSquare className="h-12 w-12 mb-2 opacity-20" />
                            <p>Start a conversation with {selectedUser.user.displayName}</p>
                          </div>
                        )}
                      </div>

                      <div className="p-4 border-t">
                        <form
                          onSubmit={(e) => {
                            e.preventDefault()
                            const form = e.target as HTMLFormElement
                            const input = form.elements.namedItem("message") as HTMLInputElement
                            if (input.value.trim()) {
                              handleSendMessage(input.value)
                              input.value = ""
                            }
                          }}
                          className="flex gap-2"
                        >
                          <input
                            type="text"
                            name="message"
                            placeholder="Type a message..."
                            className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          <Button type="submit">Send</Button>
                        </form>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="video" className="h-full m-0">
                  <div className="flex flex-col items-center justify-center h-full">
                    {callStatus === "connected" ? (
                      <div className="relative w-full h-full">
                        <div className="absolute inset-0 bg-gray-900">
                          <video id="remoteVideo" autoPlay playsInline className="w-full h-full object-cover"></video>
                          <div className="absolute bottom-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden border-2 border-white">
                            <video
                              id="localVideo"
                              autoPlay
                              playsInline
                              muted
                              className="w-full h-full object-cover"
                            ></video>
                          </div>
                          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                            <Button
                              variant="destructive"
                              onClick={() => endCall()}
                              className="rounded-full h-12 w-12 flex items-center justify-center"
                            >
                              <span className="sr-only">End Call</span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M16 2v4"></path>
                                <path d="M8 2v4"></path>
                                <path d="M22 11H2"></path>
                                <path d="M16 22v-4"></path>
                                <path d="M8 22v-4"></path>
                                <path d="M22 13H2"></path>
                              </svg>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : callStatus === "connecting" ? (
                      <div className="text-center">
                        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4 mx-auto" />
                        <p className="text-lg">Connecting to {selectedUser.user.displayName}...</p>
                      </div>
                    ) : (
                      <div className="text-center p-8">
                        <Video className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-xl font-medium mb-2">Start a Video Call</h3>
                        <p className="text-gray-500 mb-6">
                          Connect face-to-face with {selectedUser.user.displayName} to discuss skill exchange
                        </p>
                        <Button onClick={() => handleStartCall(selectedUser)}>Start Video Call</Button>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <div className="text-center p-8">
                <div className="mx-auto h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <MessageSquare className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-medium mb-2">Select a Match</h3>
                <p className="text-gray-500 max-w-md">
                  Choose someone from the list to start chatting or have a video call to discuss skill exchange
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

