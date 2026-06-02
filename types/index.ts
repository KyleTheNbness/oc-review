export interface Category {
  id: number
  name: string
  slug: string
}

export interface Item {
  id: number
  category_id: number
  name: string
  description: string | null
  created_at: string
  created_by: string
  is_hidden: boolean
  category?: Category
  avg_rating?: number
  review_count?: number
}

export interface Review {
  id: number
  item_id: number
  rating: number
  body: string | null
  created_at: string
  is_hidden: boolean
}

export interface AdminUser {
  id: number
  email: string
  password_hash: string
}
