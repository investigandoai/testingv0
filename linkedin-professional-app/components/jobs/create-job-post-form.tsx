"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { supabase, type Profile, type Market } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Briefcase, Send } from "lucide-react"

interface CreateJobPostFormProps {
  user: any
  profile: Profile | null
  onJobPosted: () => void
}

export default function CreateJobPostForm({ user, profile, onJobPosted }: CreateJobPostFormProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [modality, setModality] = useState<"remote" | "hybrid" | "on-site">("remote")
  const [location, setLocation] = useState("")
  const [employmentType, setEmploymentType] = useState<"full-time" | "freelance" | "internship" | "project-based">(
    "full-time",
  )
  const [contactInfo, setContactInfo] = useState("")
  const [publisherName, setPublisherName] = useState(profile?.full_name || "")
  const [publisherPosition, setPublisherPosition] = useState("")
  const [publisherCompany, setPublisherCompany] = useState("")
  const [authorizedToPublish, setAuthorizedToPublish] = useState(false)
  const [selectedMarket, setSelectedMarket] = useState<string>("")
  const [markets, setMarkets] = useState<Market[]>([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    loadMarkets()
  }, [])

  const loadMarkets = async () => {
    try {
      const { data, error } = await supabase.from("markets").select("*").order("name")
      if (error) throw error
      setMarkets(data || [])
      if (data && data.length > 0) {
        setSelectedMarket(data[0].id.toString())
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setMessage("")

    if (!title.trim() || !description.trim() || !contactInfo.trim() || !publisherName.trim() || !selectedMarket) {
      setError("Por favor, completa todos los campos obligatorios.")
      return
    }
    if (!authorizedToPublish) {
      setError("Debes confirmar que estás autorizado para publicar esta oferta.")
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.from("jobs").insert([
        {
          user_id: user.id,
          market_id: Number.parseInt(selectedMarket),
          title: title.trim(),
          description: description.trim(),
          modality,
          location: modality === "remote" ? null : location.trim() || null,
          employment_type: employmentType,
          contact_info: contactInfo.trim(),
          publisher_name: publisherName.trim(),
          publisher_position: publisherPosition.trim() || null,
          publisher_company: publisherCompany.trim() || null,
          authorized_to_publish: authorizedToPublish,
        },
      ])

      if (error) throw error

      setMessage("¡Oferta de empleo publicada exitosamente!")
      setTitle("")
      setDescription("")
      setModality("remote")
      setLocation("")
      setEmploymentType("full-time")
      setContactInfo("")
      setPublisherName(profile?.full_name || "")
      setPublisherPosition("")
      setPublisherCompany("")
      setAuthorizedToPublish(false)
      onJobPosted()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Briefcase className="h-5 w-5 mr-2" />
          Publicar Oferta de Empleo
        </CardTitle>
        <CardDescription>Completa los detalles de la vacante que deseas ofrecer.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Título de la oferta *</Label>
            <Input
              id="title"
              placeholder="Ej: Desarrollador Frontend Senior"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción del empleo *</Label>
            <Textarea
              id="description"
              placeholder="Describe las responsabilidades, requisitos y beneficios..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="market">Mercado *</Label>
              <Select value={selectedMarket} onValueChange={setSelectedMarket} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el mercado" />
                </SelectTrigger>
                <SelectContent>
                  {markets.map((market) => (
                    <SelectItem key={market.id} value={market.id.toString()}>
                      {market.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="modality">Modalidad *</Label>
              <Select
                value={modality}
                onValueChange={(value: "remote" | "hybrid" | "on-site") => setModality(value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona la modalidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="remote">Remoto</SelectItem>
                  <SelectItem value="hybrid">Híbrido</SelectItem>
                  <SelectItem value="on-site">Presencial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {modality !== "remote" && (
            <div className="space-y-2">
              <Label htmlFor="location">Ubicación (si aplica)</Label>
              <Input
                id="location"
                placeholder="Ej: Buenos Aires, Argentina"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="employmentType">Tipo de empleo *</Label>
            <Select
              value={employmentType}
              onValueChange={(value: "full-time" | "freelance" | "internship" | "project-based") =>
                setEmploymentType(value)
              }
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el tipo de empleo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full-time">Tiempo completo</SelectItem>
                <SelectItem value="freelance">Freelance</SelectItem>
                <SelectItem value="internship">Prácticas</SelectItem>
                <SelectItem value="project-based">Proyecto puntual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactInfo">Contacto directo o enlace de aplicación *</Label>
            <Input
              id="contactInfo"
              placeholder="Ej: email@empresa.com o https://linkdeaplicacion.com"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              required
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Quién lo publica</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="publisherName">Nombre *</Label>
                <Input
                  id="publisherName"
                  placeholder="Tu nombre"
                  value={publisherName}
                  onChange={(e) => setPublisherName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="publisherPosition">Cargo</Label>
                <Input
                  id="publisherPosition"
                  placeholder="Ej: Gerente de RRHH"
                  value={publisherPosition}
                  onChange={(e) => setPublisherPosition(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="publisherCompany">Empresa</Label>
              <Input
                id="publisherCompany"
                placeholder="Ej: Mi Empresa S.A."
                value={publisherCompany}
                onChange={(e) => setPublisherCompany(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="authorizedToPublish"
              checked={authorizedToPublish}
              onCheckedChange={(checked) => setAuthorizedToPublish(!!checked)}
              required
            />
            <Label
              htmlFor="authorizedToPublish"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Estoy autorizado para publicar esta oferta *
            </Label>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Send className="h-4 w-4 mr-2" />
            Publicar Oferta
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
  )
}
