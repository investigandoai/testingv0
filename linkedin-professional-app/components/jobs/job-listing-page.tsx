"use client"

import { useState, useEffect } from "react"
import { supabase, type Job, type Profile } from "@/lib/supabase"
import CreateJobPostForm from "@/components/jobs/create-job-post-form"
import JobCard from "@/components/jobs/job-card"
import MarketFilter from "@/components/posts/market-filter" // Reusing the existing market filter
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface JobListingPageProps {
  currentUserId: string
  profile: Profile | null
}

export default function JobListingPage({ currentUserId, profile }: JobListingPageProps) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loadingJobs, setLoadingJobs] = useState(true)
  const [selectedMarketIds, setSelectedMarketIds] = useState<number[]>([])

  useEffect(() => {
    if (selectedMarketIds.length > 0) {
      loadJobs()
    }
  }, [selectedMarketIds])

  const loadJobs = async () => {
    setLoadingJobs(true)
    try {
      let query = supabase
        .from("jobs")
        .select(
          `
          *,
          profiles (
            username,
            full_name,
            avatar_url
          ),
          markets (
            name
          )
        `,
        )
        .order("created_at", { ascending: false })
        .limit(50)

      if (selectedMarketIds.length > 0) {
        query = query.in("market_id", selectedMarketIds)
      }

      const { data, error } = await query

      if (error) throw error

      setJobs(data || [])
    } catch (error) {
      console.error("Error loading jobs:", error)
    } finally {
      setLoadingJobs(false)
    }
  }

  const handleMarketSelectionChange = (marketIds: number[]) => {
    setSelectedMarketIds(marketIds)
  }

  const handleJobPosted = () => {
    loadJobs() // Reload jobs after a new one is posted
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Filtro de mercados - Lado izquierdo */}
      <div className="lg:col-span-1">
        <MarketFilter
          userId={currentUserId}
          selectedMarkets={selectedMarketIds}
          onMarketSelectionChange={handleMarketSelectionChange}
        />
      </div>

      {/* Contenido principal de empleos */}
      <div className="lg:col-span-2 space-y-6">
        <CreateJobPostForm user={currentUserId} profile={profile} onJobPosted={handleJobPosted} />

        <h2 className="text-xl font-semibold text-gray-900">Ofertas de Empleo</h2>
        <div className="space-y-6">
          {loadingJobs ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : jobs.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">
                  No hay ofertas de empleo en los mercados seleccionados. ¡Sé el primero en publicar una!
                </p>
              </CardContent>
            </Card>
          ) : (
            jobs.map((job) => <JobCard key={job.id} job={job} />)
          )}
        </div>
      </div>
    </div>
  )
}
