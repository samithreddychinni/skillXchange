"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock } from "lucide-react"

interface Interaction {
  id: string
  userId: string
  type: "chat" | "call" | "session"
  date: string
  duration?: string
}

interface InteractionHistoryProps {
  userId: string
}

export default function InteractionHistory({ userId }: InteractionHistoryProps) {
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate API call
    const fetchInteractions = async () => {
      setLoading(true)

      // Simulate delay
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Mock interaction data
      const mockInteractions: Interaction[] = [
        {
          id: "int-1",
          userId: "user-456",
          type: "session",
          date: "2023-11-15",
          duration: "45 minutes",
        },
        {
          id: "int-2",
          userId: "user-789",
          type: "chat",
          date: "2023-11-10",
        },
        {
          id: "int-3",
          userId: "user-101",
          type: "call",
          date: "2023-11-05",
          duration: "30 minutes",
        },
        {
          id: "int-4",
          userId: "user-456",
          type: "session",
          date: "2023-10-28",
          duration: "60 minutes",
        },
        {
          id: "int-5",
          userId: "user-202",
          type: "chat",
          date: "2023-10-20",
        },
      ]

      setInteractions(mockInteractions)
      setLoading(false)
    }

    fetchInteractions()
  }, [])

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "chat":
        return "Chat Session"
      case "call":
        return "Video Call"
      case "session":
        return "Teaching Session"
      default:
        return "Interaction"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "chat":
        return "bg-blue-600"
      case "call":
        return "bg-green-600"
      case "session":
        return "bg-purple-600"
      default:
        return "bg-gray-600"
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Interaction History</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="text-center text-muted-foreground">Loading history...</div>
          </div>
        ) : interactions.length > 0 ? (
          <div className="space-y-4">
            {interactions.map((interaction) => (
              <div
                key={interaction.id}
                className="p-4 rounded-lg border border-border bg-card hover:bg-secondary/50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-lg">{interaction.userId}</h3>
                    <div className="flex items-center mt-1 text-muted-foreground text-sm">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>{interaction.date}</span>
                      {interaction.duration && (
                        <>
                          <span className="mx-2">•</span>
                          <Clock className="h-4 w-4 mr-1" />
                          <span>{interaction.duration}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Badge className={`${getTypeColor(interaction.type)}`}>{getTypeLabel(interaction.type)}</Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex justify-center py-8">
            <div className="text-center text-muted-foreground">No interaction history found</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

