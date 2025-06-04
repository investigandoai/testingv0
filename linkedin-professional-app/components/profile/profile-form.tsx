"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { supabase, type Profile, type Market, type Profession, COUNTRIES } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, User, Briefcase, Globe, Upload, X } from "lucide-react"
import { useRouter } from "next/navigation"

interface ProfileFormProps {
  userId: string
}

export default function ProfileForm({ userId }: ProfileFormProps) {
  const [profile, setProfile] = useState<Partial<Profile>>({
    username: "",
    full_name: "",
    country: "",
    about_me: "",
    avatar_url: "",
  })
  const [markets, setMarkets] = useState<Market[]>([])
  const [professions, setProfessions] = useState<Profession[]>([])
  const [selectedMarkets, setSelectedMarkets] = useState<number[]>([])
  const [selectedProfessions, setSelectedProfessions] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [userId])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single()

      if (profileError && profileError.code !== "PGRST116") {
        throw profileError
      }

      if (profileData) {
        setProfile(profileData)
        if (profileData.avatar_url) {
          setAvatarPreview(profileData.avatar_url)
        }
      }

      // Load markets
      const { data: marketsData, error: marketsError } = await supabase.from("markets").select("*").order("name")

      if (marketsError) throw marketsError
      setMarkets(marketsData || [])

      // Load professions
      const { data: professionsData, error: professionsError } = await supabase
        .from("professions")
        .select("*")
        .order("name")

      if (professionsError) throw professionsError
      setProfessions(professionsData || [])

      // Load user's selected markets
      const { data: userMarketsData, error: userMarketsError } = await supabase
        .from("user_markets")
        .select("market_id")
        .eq("user_id", userId)

      if (userMarketsError && userMarketsError.code !== "PGRST116") {
        throw userMarketsError
      }

      if (userMarketsData) {
        setSelectedMarkets(userMarketsData.map((um) => um.market_id))
      }

      // Load user's selected professions
      const { data: userProfessionsData, error: userProfessionsError } = await supabase
        .from("user_professions")
        .select("profession_id")
        .eq("user_id", userId)

      if (userProfessionsError && userProfessionsError.code !== "PGRST116") {
        throw userProfessionsError
      }

      if (userProfessionsData) {
        setSelectedProfessions(userProfessionsData.map((up) => up.profession_id))
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.size > 5 * 1024 * 1024) {
        setError("La imagen no puede superar los 5MB")
        return
      }

      // Crear URL temporal para previsualización
      const objectUrl = URL.createObjectURL(file)
      setAvatarPreview(objectUrl)

      // Por ahora, usar una URL de placeholder
      const placeholderUrl = `/placeholder.svg?height=150&width=150&text=${encodeURIComponent(profile.full_name || "Usuario")}`
      setProfile({ ...profile, avatar_url: placeholderUrl })
    }
  }

  const removeAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview(null)
    setProfile({ ...profile, avatar_url: null })
  }

  const handleMarketChange = (marketId: number) => {
    setSelectedMarkets((prev) => {
      if (prev.includes(marketId)) {
        // Remove market
        const newMarkets = prev.filter((id) => id !== marketId)

        // Also remove professions from this market
        const marketProfessions = professions.filter((p) => p.market_id === marketId).map((p) => p.id)
        setSelectedProfessions((prevProfs) => prevProfs.filter((id) => !marketProfessions.includes(id)))

        return newMarkets
      } else {
        // Add market
        return [...prev, marketId]
      }
    })
  }

  const handleProfessionChange = (professionId: number) => {
    setSelectedProfessions((prev) => {
      if (prev.includes(professionId)) {
        return prev.filter((id) => id !== professionId)
      } else {
        return [...prev, professionId]
      }
    })
  }

  const getAvailableProfessions = () => {
    return professions.filter((profession) => selectedMarkets.includes(profession.market_id))
  }

  const getMarketName = (marketId: number) => {
    const market = markets.find((m) => m.id === marketId)
    return market ? market.name : ""
  }

  const getProfessionsByMarket = () => {
    const result: { [key: string]: Profession[] } = {}

    selectedMarkets.forEach((marketId) => {
      const marketName = getMarketName(marketId)
      const marketProfessions = professions.filter((p) => p.market_id === marketId)
      if (marketName && marketProfessions.length > 0) {
        result[marketName] = marketProfessions
      }
    })

    return result
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    setMessage("")

    // Validar campos obligatorios
    if (selectedMarkets.length === 0) {
      setError("Debes seleccionar al menos un mercado laboral")
      setSaving(false)
      return
    }

    try {
      // Check if profile exists
      const { data: existingProfile } = await supabase.from("profiles").select("id").eq("user_id", userId).single()

      const profileData = {
        user_id: userId,
        username: profile.username,
        full_name: profile.full_name,
        country: profile.country,
        about_me: profile.about_me,
        avatar_url: profile.avatar_url,
        updated_at: new Date().toISOString(),
      }

      if (existingProfile) {
        // Update existing profile
        const { error } = await supabase.from("profiles").update(profileData).eq("user_id", userId)

        if (error) throw error
      } else {
        // Create new profile
        const { error } = await supabase.from("profiles").insert([
          {
            id: crypto.randomUUID(),
            ...profileData,
            created_at: new Date().toISOString(),
          },
        ])

        if (error) throw error
      }

      // Update user markets
      // First delete existing
      await supabase.from("user_markets").delete().eq("user_id", userId)

      // Then insert new ones
      if (selectedMarkets.length > 0) {
        const userMarketsData = selectedMarkets.map((marketId) => ({
          id: crypto.randomUUID(),
          user_id: userId,
          market_id: marketId,
          created_at: new Date().toISOString(),
        }))

        const { error: marketsError } = await supabase.from("user_markets").insert(userMarketsData)

        if (marketsError) throw marketsError
      }

      // Update user professions
      // First delete existing
      await supabase.from("user_professions").delete().eq("user_id", userId)

      // Then insert new ones
      if (selectedProfessions.length > 0) {
        const userProfessionsData = selectedProfessions.map((professionId) => ({
          id: crypto.randomUUID(),
          user_id: userId,
          profession_id: professionId,
          created_at: new Date().toISOString(),
        }))

        const { error: professionsError } = await supabase.from("user_professions").insert(userProfessionsData)

        if (professionsError) throw professionsError
      }

      setMessage("¡Perfil guardado exitosamente!")

      // Redirigir inmediatamente al dashboard sin esperar
      router.push("/dashboard")
    } catch (error: any) {
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <User className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle className="text-gray-900">Completa tu perfil profesional</CardTitle>
                <CardDescription>Esta información será visible para otros profesionales</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Avatar Upload */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Foto de perfil</h3>
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    {avatarPreview ? (
                      <div className="relative h-24 w-24 rounded-full overflow-hidden border-2 border-blue-200">
                        <img
                          src={avatarPreview || "/placeholder.svg"}
                          alt="Avatar preview"
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={removeAvatar}
                          className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 shadow-sm"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center border-2 border-blue-200">
                        <User className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="avatar" className="cursor-pointer">
                      <div className="flex items-center space-x-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-md hover:bg-blue-100 transition-colors border border-blue-200">
                        <Upload className="h-4 w-4" />
                        <span>Subir foto</span>
                      </div>
                      <Input
                        id="avatar"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </Label>
                    <p className="text-xs text-gray-500 mt-2">JPG, PNG o GIF. Se usará un avatar generado por ahora.</p>
                  </div>
                </div>
              </div>

              {/* Basic Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium flex items-center text-gray-900">
                  <User className="h-5 w-5 mr-2" />
                  Información básica
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Alias *</Label>
                    <Input
                      id="username"
                      placeholder="ej: juan_perez"
                      value={profile.username || ""}
                      onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nombre completo *</Label>
                    <Input
                      id="full_name"
                      placeholder="ej: Juan Pérez"
                      value={profile.full_name || ""}
                      onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country *</Label>
                  <Select
                    value={profile.country || ""}
                    onValueChange={(value) => setProfile({ ...profile, country: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tu país" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="about_me">This is a bit about me</Label>
                  <Textarea
                    id="about_me"
                    placeholder="Resumite en algunas palabras de forma integral y con humor... ¡Sé auténtico!"
                    value={profile.about_me || ""}
                    onChange={(e) => setProfile({ ...profile, about_me: e.target.value })}
                    rows={4}
                    className="placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Markets Selection */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium flex items-center text-gray-900">
                  <Globe className="h-5 w-5 mr-2" />
                  Mercados laborales de interés *
                </h3>
                <p className="text-sm text-gray-600">
                  Selecciona los mercados en los que te gustaría trabajar o ya trabajas
                </p>

                <div className="space-y-4">
                  <Select onValueChange={(value) => handleMarketChange(Number.parseInt(value))} value="">
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un mercado laboral" />
                    </SelectTrigger>
                    <SelectContent>
                      {markets.map((market) => (
                        <SelectItem
                          key={market.id}
                          value={market.id.toString()}
                          disabled={selectedMarkets.includes(market.id)}
                        >
                          {market.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedMarkets.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {selectedMarkets.map((marketId) => {
                        const market = markets.find((m) => m.id === marketId)
                        return market ? (
                          <div
                            key={market.id}
                            className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center gap-2 border border-blue-200"
                          >
                            <span>{market.name}</span>
                            <button
                              type="button"
                              onClick={() => handleMarketChange(market.id)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : null
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Professions Selection */}
              {selectedMarkets.length > 0 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium flex items-center text-gray-900">
                    <Briefcase className="h-5 w-5 mr-2" />
                    Profesiones
                  </h3>
                  <p className="text-sm text-gray-600">Selecciona las profesiones que ejerces o te interesan</p>

                  <div className="space-y-6">
                    {Object.entries(getProfessionsByMarket()).map(([marketName, marketProfessions]) => (
                      <div key={marketName} className="space-y-3">
                        <h4 className="font-medium text-sm text-blue-600">{marketName}</h4>

                        <Select onValueChange={(value) => handleProfessionChange(Number.parseInt(value))} value="">
                          <SelectTrigger>
                            <SelectValue placeholder={`Selecciona una profesión de ${marketName}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {marketProfessions.map((profession) => (
                              <SelectItem
                                key={profession.id}
                                value={profession.id.toString()}
                                disabled={selectedProfessions.includes(profession.id)}
                              >
                                {profession.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}

                    {selectedProfessions.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {selectedProfessions.map((professionId) => {
                          const profession = professions.find((p) => p.id === professionId)
                          return profession ? (
                            <div
                              key={profession.id}
                              className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full flex items-center gap-2 border border-gray-300"
                            >
                              <span>{profession.name}</span>
                              <button
                                type="button"
                                onClick={() => handleProfessionChange(profession.id)}
                                className="text-gray-600 hover:text-gray-800"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : null
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Perfil
              </Button>
            </form>

            {error && (
              <Alert className="mt-4" variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {message && (
              <Alert className="mt-4">
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
