"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, MessageCircle, Bookmark, Share, MoreHorizontal } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface PostCardProps {
  post: any
  currentUserId: string
  onUpdate: () => void
}

export default function PostCard({ post, currentUserId, onUpdate }: PostCardProps) {
  const [liking, setLiking] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleLike = async () => {
    setLiking(true)
    try {
      if (post.is_liked) {
        // Unlike
        await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", currentUserId)
      } else {
        // Like
        await supabase.from("post_likes").insert([
          {
            post_id: post.id,
            user_id: currentUserId,
          },
        ])

        // Create notification for post owner
        if (post.user_id !== currentUserId) {
          await supabase.from("notifications").insert([
            {
              user_id: post.user_id,
              type: "like",
              title: "Nueva reacción",
              message: `A ${post.profiles?.full_name || "alguien"} le gustó tu publicación`,
              related_user_id: currentUserId,
              related_post_id: post.id,
            },
          ])
        }
      }
      onUpdate()
    } catch (error) {
      console.error("Error toggling like:", error)
    } finally {
      setLiking(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (post.is_saved) {
        // Unsave
        await supabase.from("saved_posts").delete().eq("post_id", post.id).eq("user_id", currentUserId)
      } else {
        // Save
        await supabase.from("saved_posts").insert([
          {
            post_id: post.id,
            user_id: currentUserId,
          },
        ])
      }
      onUpdate()
    } catch (error) {
      console.error("Error toggling save:", error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.profiles?.avatar_url || ""} />
              <AvatarFallback className="bg-blue-100 text-blue-700">
                {post.profiles?.full_name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-gray-900">{post.profiles?.full_name || "Usuario"}</h3>
              <p className="text-sm text-gray-500">
                @{post.profiles?.username || "username"} •{" "}
                {formatDistanceToNow(new Date(post.created_at), {
                  addSuffix: true,
                  locale: es,
                })}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-900 whitespace-pre-wrap">{post.content}</p>

        {post.image_url && (
          <div className="rounded-lg overflow-hidden">
            <img src={post.image_url || "/placeholder.svg"} alt="Post image" className="w-full h-auto" />
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={liking}
              className={`flex items-center space-x-2 ${post.is_liked ? "text-red-600" : "text-gray-600"}`}
            >
              <Heart className={`h-4 w-4 ${post.is_liked ? "fill-current" : ""}`} />
              <span>{post.likes_count || 0}</span>
            </Button>

            <Button variant="ghost" size="sm" className="flex items-center space-x-2 text-gray-600">
              <MessageCircle className="h-4 w-4" />
              <span>{post.comments_count || 0}</span>
            </Button>

            <Button variant="ghost" size="sm" className="text-gray-600">
              <Share className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className={`${post.is_saved ? "text-blue-600" : "text-gray-600"}`}
          >
            <Bookmark className={`h-4 w-4 ${post.is_saved ? "fill-current" : ""}`} />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
