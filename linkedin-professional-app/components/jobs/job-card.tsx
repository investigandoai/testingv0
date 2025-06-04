"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Briefcase, Clock, Link, User, Building2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import type { Job } from "@/lib/supabase"

interface JobCardProps {
  job: Job
}

export default function JobCard({ job }: JobCardProps) {
  const getModalityLabel = (modality: Job["modality"]) => {
    switch (modality) {
      case "remote":
        return "Remoto"
      case "hybrid":
        return "Híbrido"
      case "on-site":
        return "Presencial"
      default:
        return modality
    }
  }

  const getEmploymentTypeLabel = (type: Job["employment_type"]) => {
    switch (type) {
      case "full-time":
        return "Tiempo completo"
      case "freelance":
        return "Freelance"
      case "internship":
        return "Prácticas"
      case "project-based":
        return "Proyecto puntual"
      default:
        return type
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-gray-900">{job.title}</CardTitle>
          <Badge variant="secondary" className="text-sm px-3 py-1">
            {job.markets?.name || "Mercado Desconocido"}
          </Badge>
        </div>
        <CardDescription className="text-gray-600 flex items-center space-x-2">
          <User className="h-4 w-4" />
          <span>{job.publisher_name}</span>
          {job.publisher_position && (
            <>
              <span className="text-gray-400">•</span>
              <span>{job.publisher_position}</span>
            </>
          )}
          {job.publisher_company && (
            <>
              <span className="text-gray-400">•</span>
              <Building2 className="h-4 w-4" />
              <span>{job.publisher_company}</span>
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-700">
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {getEmploymentTypeLabel(job.employment_type)}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Briefcase className="h-3 w-3" />
            {getModalityLabel(job.modality)}
          </Badge>
          {job.location && (
            <Badge variant="outline" className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {job.location}
            </Badge>
          )}
        </div>

        <p className="text-gray-800 whitespace-pre-wrap">{job.description}</p>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <span className="text-xs text-gray-500">
            Publicado{" "}
            {formatDistanceToNow(new Date(job.created_at), {
              addSuffix: true,
              locale: es,
            })}
          </span>
          <Button asChild size="sm">
            <a href={job.contact_info} target="_blank" rel="noopener noreferrer" className="flex items-center">
              <Link className="h-4 w-4 mr-2" />
              Aplicar
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
