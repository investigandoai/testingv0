"use client"

import { useEffect, useState } from "react"
import { supabase, type Profile, type Post } from "@/lib/supabase"
import ProfileForm from "@/components/profile/profile-form"
import SupportForm from "@/components/support/support-form"
import CreatePost from "@/components/posts/create-post"
import PostCard from "@/components/posts/post-card"
import MarketFilter from "@/components/posts/market-filter"
import ConnectionsManager from "@/components/connections/connections-manager"
import NotificationsPanel from "@/components/notifications/notifications-panel"
import { SiteHeader } from "@/components/site-header"
import { Providers } from "@/components/providers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, MapPin, Calendar } from "lucide-react"
import { useRouter } from "next/navigation"
import JobListingPage from "@/components/jobs/job-listing-page"

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showProfileForm, setShowProfileForm] = useState(false)
  const [showSupport, setShowSupport] = useState(false)
  const [posts, setPosts] = useState<Post[]>([])
  const [loadingPosts, setLoadingPosts] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [activeTab, setActiveTab] = useState("feed")
  const [userMarkets, setUserMarkets] = useState<string[]>([])
  const [userProfessions, setUserProfessions] = useState<string[]>([])
  const [selectedMarketIds, setSelectedMarketIds] = useState<number[]>([])
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user && !showProfileForm && !showSupport) {
      loadPosts()
      loadUnreadNotifications()
    }
  }, [user, showProfileForm, showSupport, selectedMarketIds])

  const checkUser = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.user) {
        router.push("/")
        return
      }

      setUser(session.user)

      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .single()

      if (error && error.code !== "PGRST116") {
        console.error("Error loading profile:", error)
      }

      if (!profileData) {
        setShowProfileForm(true)
      } else {
        setProfile(profileData)

        const { data: marketsData } = await supabase
          .from("user_markets")
          .select(`
            markets (
              id,
              name
            )
          `)
          .eq("user_id", session.user.id)

        const { data: professionsData } = await supabase
          .from("user_professions")
          .select(`
            professions (
              name
            )
          `)
          .eq("user_id", session.user.id)

        if (marketsData) {
          setUserMarkets(marketsData.map((item: any) => item.markets.name))
          setSelectedMarketIds(marketsData.map((item: any) => item.markets.id))
        }

        if (professionsData) {
          setUserProfessions(professionsData.map((item: any) => item.professions.name))
        }
      }
    } catch (error) {
      console.error("Error checking user:", error)
      router.push("/")
    } finally {
      setLoading(false)
    }
  }

  const loadPosts = async () => {
    if (selectedMarketIds.length === 0) return

    setLoadingPosts(true)
    try {
      let query = supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(20)

      if (selectedMarketIds.length > 0) {
        query = query.in("market_id", selectedMarketIds)
      }

      const { data: postsData, error: postsError } = await query

      if (postsError) throw postsError

      if (!postsData || postsData.length === 0) {
        setPosts([])
        setLoadingPosts(false)
        return
      }

      const postIds = postsData.map((post) => post.id)
      const userIds = postsData.map((post) => post.user_id)

      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", userIds)

      if (profilesError) throw profilesError

      const { data: likesData, error: likesError } = await supabase
        .from("post_likes")
        .select("*")
        .in("post_id", postIds)

      if (likesError) throw likesError

      const { data: commentsData, error: commentsError } = await supabase
        .from("post_comments")
        .select("*")
        .in("post_id", postIds)

      if (commentsError) throw commentsError

      const { data: savedData, error: savedError } = await supabase
        .from("saved_posts")
        .select("*")
        .in("post_id", postIds)

      if (savedError) throw savedError

      const processedPosts = postsData.map((post) => {
        const postProfile = profilesData?.find((profile) => profile.user_id === post.user_id)
        const postLikes = likesData?.filter((like) => like.post_id === post.id) || []
        const isLiked = postLikes.some((like) => like.user_id === user.id)
        const postComments = commentsData?.filter((comment) => comment.post_id === post.id) || []
        const isSaved = savedData?.some((saved) => saved.post_id === post.id && saved.user_id === user.id) || false

        return {
          ...post,
          profiles: postProfile,
          likes_count: postLikes.length,
          comments_count: postComments.length,
          is_liked: isLiked,
          is_saved: isSaved,
        }
      })

      setPosts(processedPosts)
    } catch (error) {
      console.error("Error loading posts:", error)
    } finally {
      setLoadingPosts(false)
    }
  }

  const loadUnreadNotifications = async () => {
    try {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false)

      setUnreadNotifications(count || 0)
    } catch (error) {
      console.error("Error loading unread notifications:", error)
    }
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
  }

  const handlePostUpdate = () => {
    loadPosts()
    loadUnreadNotifications()
  }

  const handleMarketSelectionChange = (marketIds: number[]) => {
    setSelectedMarketIds(marketIds)
  }

  const handleViewProfile = () => {
    setShowProfileForm(true)
    setShowSupport(false)
  }

  const handleSupport = () => {
    setShowSupport(true)
    setShowProfileForm(false)
  }

  const handleBackToFeed = () => {
    setShowProfileForm(false)
    setShowSupport(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (showProfileForm && user) {
    return (
      <Providers>
        <ProfileForm userId={user.id} />
      </Providers>
    )
  }

  if (showSupport && user) {
    return (
      <Providers>
        <SupportForm user={user} profile={profile} onBack={handleBackToFeed} />
      </Providers>
    )
  }

  return (
    <Providers>
      <div className="min-h-screen bg-gray-100">
        <SiteHeader
          user={user}
          profile={profile}
          unreadNotifications={unreadNotifications}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onViewProfile={handleViewProfile}
          onSupport={handleSupport}
        />

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filtro de mercados - Lado izquierdo */}
            {activeTab === "feed" && (
              <div className="lg:col-span-1">
                <MarketFilter
                  userId={user.id}
                  selectedMarkets={selectedMarketIds}
                  onMarketSelectionChange={handleMarketSelectionChange}
                />
              </div>
            )}

            {/* Main Content Area */}
            <div className={activeTab === "feed" ? "lg:col-span-2" : "lg:col-span-4"}>
              {activeTab === "feed" && (
                <div className="space-y-6">
                  <CreatePost user={user} profile={profile} onPostCreated={handlePostUpdate} />

                  <div className="space-y-6">
                    {loadingPosts ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    ) : posts.length === 0 ? (
                      <Card>
                        <CardContent className="p-8 text-center">
                          <p className="text-gray-500">
                            No hay publicaciones en los mercados seleccionados. ¡Sé el primero en compartir algo!
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      posts.map((post) => (
                        <PostCard key={post.id} post={post} currentUserId={user.id} onUpdate={handlePostUpdate} />
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === "search" && <JobListingPage currentUserId={user.id} profile={profile} />}

              {activeTab === "connections" && <ConnectionsManager currentUserId={user.id} />}

              {activeTab === "notifications" && <NotificationsPanel currentUserId={user.id} />}
            </div>

            {/* Perfil del usuario - Lado derecho */}
            {activeTab === "feed" && (
              <div className="lg:col-span-1">
                <Card className="sticky top-20">
                  <CardHeader className="text-center pb-4">
                    <Avatar className="h-20 w-20 mx-auto mb-3 border-2 border-blue-200">
                      <AvatarImage src={profile?.avatar_url || ""} />
                      <AvatarFallback className="text-lg bg-blue-100 text-blue-700">
                        {profile?.full_name?.charAt(0) || user?.email?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <CardTitle className="text-lg text-gray-900">{profile?.full_name || "Usuario"}</CardTitle>
                      <CardDescription className="text-blue-600">@{profile?.username || "username"}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    {profile?.country && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2 text-blue-500" />
                        {profile.country}
                      </div>
                    )}
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                      Miembro desde {new Date(profile?.created_at || "").toLocaleDateString()}
                    </div>
                    {profile?.about_me && (
                      <div className="pt-3 border-t border-gray-200">
                        <h4 className="font-medium mb-2 text-gray-900 text-sm">Acerca de mí</h4>
                        <p className="text-sm text-gray-600 line-clamp-3">{profile.about_me}</p>
                      </div>
                    )}
                    {userMarkets.length > 0 && (
                      <div className="pt-3 border-t border-gray-200">
                        <h4 className="font-medium mb-2 text-gray-900 text-sm">Mercados</h4>
                        <div className="flex flex-wrap gap-1">
                          {userMarkets.slice(0, 3).map((market, index) => (
                            <span
                              key={index}
                              className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full border border-blue-200"
                            >
                              {market}
                            </span>
                          ))}
                          {userMarkets.length > 3 && (
                            <span className="text-xs text-gray-500">+{userMarkets.length - 3} más</span>
                          )}
                        </div>
                      </div>
                    )}
                    {userProfessions.length > 0 && (
                      <div className="pt-3 border-t border-gray-200">
                        <h4 className="font-medium mb-2 text-gray-900 text-sm">Profesiones</h4>
                        <div className="flex flex-wrap gap-1">
                          {userProfessions.slice(0, 2).map((profession, index) => (
                            <span
                              key={index}
                              className="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded-full border border-gray-300"
                            >
                              {profession}
                            </span>
                          ))}
                          {userProfessions.length > 2 && (
                            <span className="text-xs text-gray-500">+{userProfessions.length - 2} más</span>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </Providers>
  )
}
