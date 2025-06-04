"use client"

import { useState, useRef, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Home,
  Users,
  Briefcase,
  MessageSquare,
  Bell,
  ChevronDown,
  LogOut,
  User,
  HelpCircle,
} from "lucide-react"
import { useRouter } from "next/navigation"

interface SiteHeaderProps {
  user: any
  profile: any
  unreadNotifications: number
  activeTab?: string
  onTabChange?: (tab: string) => void
  onViewProfile?: () => void
  onSupport?: () => void
}

export function SiteHeader({
  user,
  profile,
  unreadNotifications,
  activeTab = "feed",
  onTabChange,
  onViewProfile,
  onSupport,
}: SiteHeaderProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleDropdownToggle = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  const handleMenuClick = (action: () => void) => {
    action()
    setIsDropdownOpen(false)
  }

  const navItems = [
    {
      id: "feed",
      icon: Home,
      label: "Inicio",
      active: activeTab === "feed",
    },
    {
      id: "connections",
      icon: Users,
      label: "Mi red",
      active: activeTab === "connections",
    },
    {
      id: "search",
      icon: Briefcase,
      label: "Ofertas", // Changed from "Empleos"
      active: activeTab === "search",
    },
    {
      id: "messages",
      icon: MessageSquare,
      label: "Mensajes",
      active: false,
      disabled: true,
    },
    {
      id: "notifications",
      icon: Bell,
      label: "Avisos",
      active: activeTab === "notifications",
      badge: unreadNotifications,
    },
  ]

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo and Search */}
          <div className="flex items-center space-x-4">
            {/* LinkedIn Logo */}
            <div className="flex items-center">
              <div className="bg-blue-600 text-white font-bold text-lg px-2 py-1 rounded">in</div>
            </div>

            {/* Search Bar */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64 bg-gray-50 border-gray-200 focus:bg-white"
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center">
            <div className="grid grid-cols-6 gap-0">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    size="sm"
                    disabled={item.disabled}
                    onClick={() => onTabChange?.(item.id)}
                    className={`flex flex-col items-center justify-center h-14 w-16 space-y-1 relative ${
                      item.active
                        ? "text-blue-600 bg-blue-50 border-b-2 border-blue-600"
                        : "text-gray-600 hover:text-gray-900"
                    } ${item.disabled ? "opacity-50 cursor-not-allowed" : ""} rounded-none`}
                  >
                    <div className="relative flex items-center justify-center">
                      <Icon className="h-5 w-5" />
                      {item.badge !== undefined && item.badge > 0 && (
                        <Badge
                          variant="destructive"
                          className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center"
                        >
                          {item.badge > 99 ? "99+" : item.badge}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-center">{item.label}</span>
                  </Button>
                )
              })}

              {/* Profile Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDropdownToggle}
                  className="flex flex-col items-center justify-center h-14 w-16 space-y-1 text-gray-600 hover:text-gray-900 rounded-none"
                >
                  <div className="relative flex items-center justify-center">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={profile?.avatar_url || ""} />
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                        {profile?.full_name?.charAt(0) || user?.email?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <span className="text-xs text-center flex items-center justify-center">
                    Yo
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </span>
                </Button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-[100]">
                    <div className="px-3 py-2 border-b border-gray-100">
                      <p className="font-medium text-sm text-gray-900">{profile?.full_name || "Usuario"}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => handleMenuClick(() => onViewProfile?.())}
                        className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <User className="h-4 w-4 mr-2" />
                        Ver perfil
                      </button>

                      <button
                        onClick={() => handleMenuClick(() => onSupport?.())}
                        className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <HelpCircle className="h-4 w-4 mr-2" />
                        Soporte
                      </button>

                      <div className="border-t border-gray-100 my-1"></div>

                      <button
                        onClick={() => handleMenuClick(handleSignOut)}
                        className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Cerrar sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}
