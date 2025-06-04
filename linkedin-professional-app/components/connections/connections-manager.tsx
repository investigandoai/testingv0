"use client"

import { useState, useEffect } from "react"
import { supabase, type Connection } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Check, X, Users, UserCheck, Clock } from "lucide-react"

interface ConnectionsManagerProps {
  currentUserId: string
}

export default function ConnectionsManager({ currentUserId }: ConnectionsManagerProps) {
  const [pendingRequests, setPendingRequests] = useState<Connection[]>([])
  const [sentRequests, setSentRequests] = useState<Connection[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadConnections()
  }, [currentUserId])

  const loadConnections = async () => {
    setLoading(true)
    try {
      // Pending requests (received)
      const { data: pending } = await supabase
        .from("connections")
        .select(`
          *,
          follower_profile:profiles!connections_follower_id_fkey(*)
        `)
        .eq("following_id", currentUserId)
        .eq("status", "pending")

      // Sent requests
      const { data: sent } = await supabase
        .from("connections")
        .select(`
          *,
          following_profile:profiles!connections_following_id_fkey(*)
        `)
        .eq("follower_id", currentUserId)
        .eq("status", "pending")

      // Accepted connections
      const { data: accepted } = await supabase
        .from("connections")
        .select(`
          *,
          follower_profile:profiles!connections_follower_id_fkey(*),
          following_profile:profiles!connections_following_id_fkey(*)
        `)
        .or(`follower_id.eq.${currentUserId},following_id.eq.${currentUserId}`)
        .eq("status", "accepted")

      setPendingRequests(pending || [])
      setSentRequests(sent || [])
      setConnections(accepted || [])
    } catch (error) {
      console.error("Error loading connections:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptRequest = async (connectionId: string, requesterId: string) => {
    try {
      await supabase
        .from("connections")
        .update({ status: "accepted", updated_at: new Date().toISOString() })
        .eq("id", connectionId)

      // Create notification for requester
      await supabase.from("notifications").insert([
        {
          user_id: requesterId,
          type: "connection_accepted",
          title: "Conexión aceptada",
          message: "Tu solicitud de conexión fue aceptada",
          related_user_id: currentUserId,
          related_connection_id: connectionId,
        },
      ])

      loadConnections()
    } catch (error) {
      console.error("Error accepting request:", error)
    }
  }

  const handleRejectRequest = async (connectionId: string) => {
    try {
      await supabase
        .from("connections")
        .update({ status: "rejected", updated_at: new Date().toISOString() })
        .eq("id", connectionId)

      loadConnections()
    } catch (error) {
      console.error("Error rejecting request:", error)
    }
  }

  const handleCancelRequest = async (connectionId: string) => {
    try {
      await supabase.from("connections").delete().eq("id", connectionId)
      loadConnections()
    } catch (error) {
      console.error("Error canceling request:", error)
    }
  }

  if (loading) {
    return <div>Cargando conexiones...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Gestión de Conexiones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending" className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Pendientes ({pendingRequests.length})
              </TabsTrigger>
              <TabsTrigger value="sent" className="flex items-center">
                <UserCheck className="h-4 w-4 mr-2" />
                Enviadas ({sentRequests.length})
              </TabsTrigger>
              <TabsTrigger value="connections" className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Conexiones ({connections.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              {pendingRequests.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No tienes solicitudes pendientes</p>
              ) : (
                pendingRequests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={request.follower_profile?.avatar_url || ""} />
                            <AvatarFallback className="bg-blue-100 text-blue-700">
                              {request.follower_profile?.full_name?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">{request.follower_profile?.full_name || "Usuario"}</h3>
                            <p className="text-sm text-gray-500">@{request.follower_profile?.username || "username"}</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" onClick={() => handleAcceptRequest(request.id, request.follower_id)}>
                            <Check className="h-4 w-4 mr-1" />
                            Aceptar
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleRejectRequest(request.id)}>
                            <X className="h-4 w-4 mr-1" />
                            Rechazar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="sent" className="space-y-4">
              {sentRequests.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No tienes solicitudes enviadas</p>
              ) : (
                sentRequests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={request.following_profile?.avatar_url || ""} />
                            <AvatarFallback className="bg-blue-100 text-blue-700">
                              {request.following_profile?.full_name?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">{request.following_profile?.full_name || "Usuario"}</h3>
                            <p className="text-sm text-gray-500">
                              @{request.following_profile?.username || "username"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary">Pendiente</Badge>
                          <Button size="sm" variant="outline" onClick={() => handleCancelRequest(request.id)}>
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="connections" className="space-y-4">
              {connections.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Aún no tienes conexiones</p>
              ) : (
                connections.map((connection) => {
                  const otherProfile =
                    connection.follower_id === currentUserId
                      ? connection.following_profile
                      : connection.follower_profile

                  return (
                    <Card key={connection.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={otherProfile?.avatar_url || ""} />
                              <AvatarFallback className="bg-blue-100 text-blue-700">
                                {otherProfile?.full_name?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold">{otherProfile?.full_name || "Usuario"}</h3>
                              <p className="text-sm text-gray-500">@{otherProfile?.username || "username"}</p>
                            </div>
                          </div>
                          <Badge variant="default">Conectado</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
