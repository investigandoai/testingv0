"use client"

import { useState, useEffect } from "react"
import { supabase, type Market } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Filter, X, ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

interface MarketFilterCompactProps {
  userId: string
  selectedMarkets: number[]
  onMarketSelectionChange: (markets: number[]) => void
}

export default function MarketFilterCompact({
  userId,
  selectedMarkets,
  onMarketSelectionChange,
}: MarketFilterCompactProps) {
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

  const getSelectedMarkets = () => {
    return markets.filter((market) => selectedMarkets.includes(market.id))
  }

  const getFilterText = () => {
    const selectedCount = selectedMarkets.length
    const totalCount = markets.length

    if (selectedCount === totalCount) {
      return "Todos los mercados"
    } else if (selectedCount === 1) {
      const market = markets.find((m) => m.id === selectedMarkets[0])
      return market?.name || "1 mercado"
    } else {
      return `${selectedCount} mercados`
    }
  }

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Cargando...</span>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-3">
      {/* Filter Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 text-sm border-gray-300 hover:border-blue-400 hover:bg-blue-50"
          >
            <Filter className="h-3 w-3 mr-2 text-blue-600" />
            {getFilterText()}
            <ChevronDown className="h-3 w-3 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 max-h-80 overflow-y-auto">
          <div className="px-2 py-1.5 text-xs font-medium text-gray-500 border-b">Filtrar por mercados</div>

          <DropdownMenuItem onClick={handleSelectAll} className="cursor-pointer">
            <div className="flex items-center justify-between w-full">
              <span>Todos los mercados</span>
              {selectedMarkets.length === markets.length && <div className="w-2 h-2 bg-blue-600 rounded-full"></div>}
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {markets.map((market) => (
            <DropdownMenuItem key={market.id} onClick={() => handleMarketToggle(market.id)} className="cursor-pointer">
              <div className="flex items-center justify-between w-full">
                <span>{market.name}</span>
                {selectedMarkets.includes(market.id) && <div className="w-2 h-2 bg-blue-600 rounded-full"></div>}
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Selected Markets as Chips */}
      {selectedMarkets.length < markets.length && (
        <div className="flex items-center space-x-2 overflow-x-auto">
          {getSelectedMarkets()
            .slice(0, 3)
            .map((market) => (
              <Badge
                key={market.id}
                variant="secondary"
                className="text-xs whitespace-nowrap cursor-pointer hover:bg-gray-200 flex items-center gap-1"
                onClick={() => handleMarketToggle(market.id)}
              >
                {market.name}
                <X className="h-3 w-3" />
              </Badge>
            ))}
          {getSelectedMarkets().length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{getSelectedMarkets().length - 3}
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
