import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database
export interface Profile {
  id: string
  user_id: string
  username: string | null
  full_name: string | null
  country: string | null
  about_me: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Market {
  id: number
  name: string
  description: string | null
  created_at: string
}

export interface Profession {
  id: number
  name: string
  market_id: number
  created_at: string
}

export interface UserMarket {
  id: string
  user_id: string
  market_id: number
  created_at: string
}

export interface UserProfession {
  id: string
  user_id: string
  profession_id: number
  created_at: string
}

export interface Post {
  id: string
  user_id: string
  content: string
  image_url: string | null
  created_at: string
  updated_at: string
  profiles?: Profile
  likes_count?: number
  comments_count?: number
  is_liked?: boolean
  is_saved?: boolean
}

export interface PostLike {
  id: string
  post_id: string
  user_id: string
  created_at: string
}

export interface PostComment {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
  profiles?: Profile
}

export interface SavedPost {
  id: string
  post_id: string
  user_id: string
  created_at: string
}

export interface Connection {
  id: string
  follower_id: string
  following_id: string
  status: "pending" | "accepted" | "rejected"
  created_at: string
  updated_at: string
  follower_profile?: Profile
  following_profile?: Profile
}

export interface Notification {
  id: string
  user_id: string
  type: "like" | "comment" | "connection_request" | "connection_accepted" | "new_post"
  title: string
  message: string
  read: boolean
  related_user_id: string | null
  related_post_id: string | null
  related_connection_id: string | null
  created_at: string
  related_user_profile?: Profile
}

export interface Job {
  id: string
  user_id: string
  market_id: number
  title: string
  description: string
  modality: "remote" | "hybrid" | "on-site"
  location: string | null
  employment_type: "full-time" | "freelance" | "internship" | "project-based"
  contact_info: string
  publisher_name: string
  publisher_position: string | null
  publisher_company: string | null
  authorized_to_publish: boolean
  created_at: string
  updated_at: string
  profiles?: Profile // To fetch publisher's profile
  markets?: Market // To fetch market details
}

// Countries list
export const COUNTRIES = [
  "Argentina",
  "Bolivia",
  "Brasil",
  "Chile",
  "Colombia",
  "Costa Rica",
  "Cuba",
  "Ecuador",
  "El Salvador",
  "España",
  "Guatemala",
  "Honduras",
  "México",
  "Nicaragua",
  "Panamá",
  "Paraguay",
  "Perú",
  "Puerto Rico",
  "República Dominicana",
  "Uruguay",
  "Venezuela",
  "Estados Unidos",
  "Canadá",
  "Francia",
  "Alemania",
  "Italia",
  "Reino Unido",
  "Portugal",
  "Holanda",
  "Bélgica",
  "Suiza",
  "Austria",
  "Suecia",
  "Noruega",
  "Dinamarca",
  "Finlandia",
  "Polonia",
  "República Checa",
  "Hungría",
  "Rumania",
  "Bulgaria",
  "Grecia",
  "Turquía",
  "Rusia",
  "Ucrania",
  "China",
  "Japón",
  "Corea del Sur",
  "India",
  "Tailandia",
  "Vietnam",
  "Filipinas",
  "Indonesia",
  "Malasia",
  "Singapur",
  "Australia",
  "Nueva Zelanda",
  "Sudáfrica",
  "Egipto",
  "Marruecos",
  "Nigeria",
  "Kenia",
  "Ghana",
  "Etiopía",
]
