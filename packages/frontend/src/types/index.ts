// Define your TypeScript interfaces here

export interface User {
  id: string
  username: string
  email: string
  created_at: string
}

export interface ApiResponse<T> {
  data: T
  message?: string
  status: number
}