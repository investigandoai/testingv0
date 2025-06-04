"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { supabase, type Profile, type Market } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Send, ImageIcon } from "lucide-react"

interface CreatePostProps {
  user: any
  profile: Profile | null
  onPostCreated: () => void
}

export default function CreatePost({ user, profile, onPostCreated }: CreatePostProps) {
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [markets, setMarkets] = useState<Market[]>([])
  const [selectedMarket, setSelectedMarket] = useState<string>("")
  const [loadingMarkets, setLoadingMarkets] = useState(false)

  useEffect(() => {
    loadAllMarkets()
  }, [])

  const loadAllMarkets = async () => {
    setLoadingMarkets(true)
    try {
      // Cargar todos los mercados disponibles
      const { data: marketsData, error: marketsError } = await supabase.from("markets").select("*").order("name")

      if (marketsError) throw marketsError

      if (marketsData && marketsData.length > 0) {
        setMarkets(marketsData)

        // Seleccionar el primer mercado por defecto
        if (marketsData.length > 0) {
          setSelectedMarket(marketsData[0].id.toString())
        }
      }
    } catch (error) {
      console.error("Error loading markets:", error)
    } finally {
      setLoadingMarkets(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    if (!selectedMarket) {
      setError("Por favor selecciona un mercado para tu publicación")
      return
    }

    setLoading(true)
    setError("")

    try {
      const { error } = await supabase.from("posts").insert([
        {
          user_id: user.id,
          content: content.trim(),
          market_id: Number.parseInt(selectedMarket),
        },
      ])

      if (error) throw error

      setContent("")
      onPostCreated()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile?.avatar_url || ""} />
            <AvatarFallback className="bg-blue-100 text-blue-700">
              {profile?.full_name?.charAt(0) || user?.email?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg">¿Qué quieres compartir?</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="Comparte tus pensamientos, experiencias profesionales o novedades..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="resize-none"
          />

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <Select value={selectedMarket} onValueChange={setSelectedMarket} disabled={loadingMarkets}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Seleccionar mercado" />
              </SelectTrigger>
              <SelectContent>
                {markets.map((market) => (
                  <SelectItem key={market.id} value={market.id.toString()}>
                    {market.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button type="button" variant="ghost" size="sm" disabled className="sm:ml-auto">
                <ImageIcon className="h-4 w-4 mr-2" />
                Imagen (próximamente)
              </Button>

              <Button
                type="submit"
                disabled={loading || !content.trim() || !selectedMarket}
                className="ml-auto sm:ml-0"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Send className="h-4 w-4 mr-2" />
                Publicar
              </Button>
            </div>
          </div>
        </form>

        {error && (
          <Alert className="mt-4" variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
