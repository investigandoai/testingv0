"use client"

import { useState, useEffect } from "react"
import { supabase, type Profile } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Loader2, MapPin, Briefcase, Globe, Calendar, ArrowLeft, Pencil } from "lucide-react"
import { useRouter } from "next/navigation"

interface ProfileViewProps {
  userId: string
  onEditProfile: () => void
}

export default function ProfileView({ userId, onEditProfile }: ProfileViewProps) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [userMarkets, setUserMarkets] = useState<{ id: number; name: string }[]>([])
  const [userProfessions, setUserProfessions] = useState<{ id: number; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadProfileData()
  }, [userId])

  const loadProfileData = async () => {
    setLoading(true)
    try {
      // Cargar perfil
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single()

      if (profileError) throw profileError
      setProfile(profileData)

      // Cargar mercados del usuario
      const { data: userMarketsData, error: marketsError } = await supabase
        .from("user_markets")
        .select(`
          market_id,
          markets (
            id,
            name
          )
        `)
        .eq("user_id", userId)

      if (marketsError) throw marketsError

      if (userMarketsData) {
        const markets = userMarketsData
          .map((item) => item.markets)
          .filter((market): market is { id: number; name: string } => market !== null)
        setUserMarkets(markets)
      }

      // Cargar profesiones del usuario
      const { data: userProfessionsData, error: professionsError } = await supabase
        .from("user_professions")
        .select(`
          profession_id,
          professions (
            id,
            name
          )
        `)
        .eq("user_id", userId)

      if (professionsError) throw professionsError

      if (userProfessionsData) {
        const professions = userProfessionsData
          .map((item) => item.professions)
          .filter((profession): profession is { id: number; name: string } => profession !== null)
        setUserProfessions(professions)
      }
    } catch (error) {
      console.error("Error loading profile data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleBackToFeed = () => {
    router.push("/dashboard")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">No se encontró el perfil.</p>
            <Button onClick={handleBackToFeed} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" onClick={handleBackToFeed}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al inicio
          </Button>
          <Button onClick={onEditProfile}>
            <Pencil className="h-4 w-4 mr-2" />
            Editar perfil
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col md:flex-row items-center md:space-x-6">
                <Avatar className="h-24 w-24 border-2 border-blue-200">
                  <AvatarImage src={profile.avatar_url || ""} />
                  <AvatarFallback className="text-2xl bg-blue-100 text-blue-700">
                    {profile.full_name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="mt-4 md:mt-0 text-center md:text-left">
                  <CardTitle className="text-2xl font-bold text-gray-900">{profile.full_name}</CardTitle>
                  <CardDescription className="text-blue-600 text-lg">@{profile.username}</CardDescription>
                  {profile.country && (
                    <div className="flex items-center justify-center md:justify-start mt-2 text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      {profile.country}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 md:mt-0 text-center md:text-right">
                <div className="text-sm text-gray-500 flex items-center justify-center md:justify-end">
                  <Calendar className="h-4 w-4 mr-1" />
                  Miembro desde {new Date(profile.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {profile.about_me && (
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-gray-900">Acerca de mí</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{profile.about_me}</p>
              </div>
            )}

            {userMarkets.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-medium flex items-center text-gray-900">
                  <Globe className="h-5 w-5 mr-2" />
                  Mercados laborales
                </h3>
                <div className="flex flex-wrap gap-2">
                  {userMarkets.map((market) => (
                    <span
                      key={market.id}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center gap-2 border border-blue-200"
                    >
                      {market.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {userProfessions.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-medium flex items-center text-gray-900">
                  <Briefcase className="h-5 w-5 mr-2" />
                  Profesiones
                </h3>
                <div className="flex flex-wrap gap-2">
                  {userProfessions.map((profession) => (
                    <span
                      key={profession.id}
                      className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full flex items-center gap-2 border border-gray-300"
                    >
                      {profession.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
