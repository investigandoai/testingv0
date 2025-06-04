"use client"

import { useState, useEffect } from "react"
import { supabase, type Profile, type Market, type Profession, COUNTRIES } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, MapPin, UserPlus } from "lucide-react"

interface ProfessionalSearchProps {
  currentUserId: string
}

interface SearchResult extends Profile {
  markets?: string[]
  professions?: string[]
  connection_status?: string
}

export default function ProfessionalSearch({ currentUserId }: ProfessionalSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCountry, setSelectedCountry] = useState("")
  const [selectedMarket, setSelectedMarket] = useState("")
  const [selectedProfession, setSelectedProfession] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [markets, setMarkets] = useState<Market[]>([])
  const [professions, setProfessions] = useState<Profession[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadFilters()
  }, [])

  useEffect(() => {
    if (selectedMarket) {
      loadProfessions()
    }
  }, [selectedMarket])

  const loadFilters = async () => {
    try {
      const { data: marketsData } = await supabase.from("markets").select("*").order("name")

      if (marketsData) setMarkets(marketsData)
    } catch (error) {
      console.error("Error loading filters:", error)
    }
  }

  const loadProfessions = async () => {
    try {
      const { data: professionsData } = await supabase
        .from("professions")
        .select("*")
        .eq("market_id", selectedMarket)
        .order("name")

      if (professionsData) setProfessions(professionsData)
    } catch (error) {
      console.error("Error loading professions:", error)
    }
  }

  const handleSearch = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from("profiles")
        .select(`
          *,
          user_markets!inner(
            markets(name)
          ),
          user_professions(
            professions(name)
          )
        `)
        .neq("user_id", currentUserId)

      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%`)
      }

      if (selectedCountry) {
        query = query.eq("country", selectedCountry)
      }

      if (selectedMarket) {
        query = query.eq("user_markets.market_id", selectedMarket)
      }

      const { data, error } = await query.limit(20)

      if (error) throw error

      // Process results to flatten market and profession data
      const processedResults =
        data?.map((profile: any) => ({
          ...profile,
          markets: profile.user_markets?.map((um: any) => um.markets.name) || [],
          professions: profile.user_professions?.map((up: any) => up.professions.name) || [],
        })) || []

      setResults(processedResults)
    } catch (error) {
      console.error("Error searching professionals:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async (targetUserId: string) => {
    try {
      await supabase.from("connections").insert([
        {
          follower_id: currentUserId,
          following_id: targetUserId,
          status: "pending",
        },
      ])

      // Create notification
      await supabase.from("notifications").insert([
        {
          user_id: targetUserId,
          type: "connection_request",
          title: "Nueva solicitud de conexión",
          message: "Tienes una nueva solicitud de conexión",
          related_user_id: currentUserId,
        },
      ])

      // Refresh search results
      handleSearch()
    } catch (error) {
      console.error("Error sending connection request:", error)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Buscar Profesionales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger>
                <SelectValue placeholder="País" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los países</SelectItem>
                {COUNTRIES.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedMarket} onValueChange={setSelectedMarket}>
              <SelectTrigger>
                <SelectValue placeholder="Mercado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los mercados</SelectItem>
                {markets.map((market) => (
                  <SelectItem key={market.id} value={market.id.toString()}>
                    {market.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedProfession} onValueChange={setSelectedProfession} disabled={!selectedMarket}>
              <SelectTrigger>
                <SelectValue placeholder="Profesión" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las profesiones</SelectItem>
                {professions.map((profession) => (
                  <SelectItem key={profession.id} value={profession.id.toString()}>
                    {profession.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleSearch} disabled={loading} className="w-full">
            {loading ? "Buscando..." : "Buscar"}
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map((professional) => (
          <Card key={professional.id}>
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={professional.avatar_url || ""} />
                  <AvatarFallback className="bg-blue-100 text-blue-700 text-lg">
                    {professional.full_name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <h3 className="font-semibold text-gray-900">{professional.full_name || "Usuario"}</h3>
                  <p className="text-sm text-gray-500">@{professional.username || "username"}</p>
                </div>

                {professional.country && (
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-1" />
                    {professional.country}
                  </div>
                )}

                {professional.markets && professional.markets.length > 0 && (
                  <div className="flex flex-wrap gap-1 justify-center">
                    {professional.markets.slice(0, 2).map((market, index) => (
                      <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {market}
                      </span>
                    ))}
                  </div>
                )}

                {professional.professions && professional.professions.length > 0 && (
                  <div className="flex flex-wrap gap-1 justify-center">
                    {professional.professions.slice(0, 2).map((profession, index) => (
                      <span key={index} className="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded-full">
                        {profession}
                      </span>
                    ))}
                  </div>
                )}

                <Button size="sm" onClick={() => handleConnect(professional.user_id)} className="w-full">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Conectar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {results.length === 0 && !loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">No se encontraron profesionales con los criterios seleccionados.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
