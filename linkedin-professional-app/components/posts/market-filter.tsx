"use client"

import { useState, useEffect } from "react"
import { supabase, type Market } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Filter, Check } from "lucide-react"

interface MarketFilterProps {
  userId: string
  selectedMarkets: number[]
  onMarketSelectionChange: (markets: number[]) => void
}

export default function MarketFilter({ userId, selectedMarkets, onMarketSelectionChange }: MarketFilterProps) {
  const [markets, setMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAllMarkets()
  }, [])

  const loadAllMarkets = async () => {
    setLoading(true)
    try {
      const { data: marketsData, error: marketsError } = await supabase.from("markets").select("*").order("name")

      if (marketsError) throw marketsError

      if (marketsData) {
        setMarkets(marketsData)

        if (selectedMarkets.length === 0) {
          const allMarketIds = marketsData.map((market) => market.id)
          onMarketSelectionChange(allMarketIds)
        }
      }
    } catch (error) {
      console.error("Error loading markets:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarketToggle = (marketId: number) => {
    if (selectedMarkets.includes(marketId)) {
      if (selectedMarkets.length > 1) {
        onMarketSelectionChange(selectedMarkets.filter((id) => id !== marketId))
      }
    } else {
      onMarketSelectionChange([...selectedMarkets, marketId])
    }
  }

  const handleSelectAll = () => {
    onMarketSelectionChange(markets.map((market) => market.id))
  }

  const isAllSelected = selectedMarkets.length === markets.length

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-base">
          <Filter className="h-4 w-4 mr-2 text-blue-600" />
          Mercados
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Botón Todos */}
          <Button
            variant={isAllSelected ? "default" : "outline"}
            size="sm"
            onClick={handleSelectAll}
            className={`w-full justify-start text-sm h-8 ${
              isAllSelected ? "bg-blue-600 hover:bg-blue-700 text-white" : "border-gray-200 hover:bg-gray-50"
            }`}
          >
            {isAllSelected && <Check className="h-3 w-3 mr-2" />}
            Todos los mercados
          </Button>

          {/* Lista de mercados */}
          <div className="space-y-1">
            {markets.map((market) => {
              const isSelected = selectedMarkets.includes(market.id)
              return (
                <Button
                  key={market.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMarketToggle(market.id)}
                  className={`w-full justify-start text-sm h-8 px-3 ${
                    isSelected ? "bg-blue-50 text-blue-700 hover:bg-blue-100" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="truncate">{market.name}</span>
                    {isSelected && <div className="w-2 h-2 bg-blue-600 rounded-full ml-2 flex-shrink-0" />}
                  </div>
                </Button>
              )
            })}
          </div>

          {/* Contador */}
          <div className="pt-2 border-t border-gray-100">
            <div className="text-xs text-gray-500 text-center">
              {selectedMarkets.length} de {markets.length} seleccionados
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
