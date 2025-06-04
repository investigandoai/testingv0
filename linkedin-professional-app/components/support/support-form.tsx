"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Send, Loader2 } from "lucide-react"

interface SupportFormProps {
  user: any
  profile: any
  onBack: () => void
}

export default function SupportForm({ user, profile, onBack }: SupportFormProps) {
  const [formData, setFormData] = useState({
    type: "",
    subject: "",
    message: "",
    email: user?.email || "",
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Simular envío del formulario
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Aquí normalmente enviarías el email o guardarías en la base de datos
      console.log("Formulario de soporte enviado:", {
        ...formData,
        user_id: user.id,
        user_name: profile?.full_name || "Usuario",
        timestamp: new Date().toISOString(),
      })

      setSuccess(true)
      setFormData({
        type: "",
        subject: "",
        message: "",
        email: user?.email || "",
      })
    } catch (error) {
      setError("Error al enviar el formulario. Por favor, intenta nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-green-600 text-6xl mb-4">✓</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Mensaje enviado!</h2>
              <p className="text-gray-600 mb-6">
                Hemos recibido tu {formData.type.toLowerCase()} y te responderemos a la brevedad en{" "}
                <strong>{formData.email}</strong>
              </p>
              <Button onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al inicio
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex items-center mb-6">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Centro de Soporte</CardTitle>
            <CardDescription>
              ¿Necesitas ayuda? Completa el formulario y nos pondremos en contacto contigo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo de caso *</Label>
                  <Select value={formData.type} onValueChange={(value) => handleChange("type", value)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el tipo de caso" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reclamo">Reclamo</SelectItem>
                      <SelectItem value="consulta">Consulta</SelectItem>
                      <SelectItem value="solicitud">Solicitud</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email de contacto *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Asunto *</Label>
                <Input
                  id="subject"
                  placeholder="Describe brevemente tu consulta"
                  value={formData.subject}
                  onChange={(e) => handleChange("subject", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Mensaje *</Label>
                <Textarea
                  id="message"
                  placeholder="Describe detalladamente tu consulta, reclamo o solicitud..."
                  value={formData.message}
                  onChange={(e) => handleChange("message", e.target.value)}
                  rows={6}
                  required
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Información del usuario</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>
                    <strong>Nombre:</strong> {profile?.full_name || "No especificado"}
                  </p>
                  <p>
                    <strong>Usuario:</strong> @{profile?.username || "No especificado"}
                  </p>
                  <p>
                    <strong>País:</strong> {profile?.country || "No especificado"}
                  </p>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Send className="h-4 w-4 mr-2" />
                Enviar mensaje
              </Button>
            </form>

            {error && (
              <Alert className="mt-4" variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
