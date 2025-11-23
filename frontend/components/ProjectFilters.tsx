'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useState } from 'react'
import CustomSelect from './CustomSelect'

export default function ProjectFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [status, setStatus] = useState(searchParams.get('status') || '')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (status) params.set('status', status)
    // Use current pathname to stay on the same page
    const targetPath = pathname === '/' ? '/' : '/projects'
    router.push(`${targetPath}?${params.toString()}`)
  }

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'funded', label: 'Funded' },
    { value: 'draft', label: 'Draft' },
  ]

  return (
    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 mb-6">
      <input
        type="text"
        placeholder="Search projects..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="input-field flex-1"
      />
      <CustomSelect
        value={status}
        onChange={setStatus}
        options={statusOptions}
        placeholder="All Status"
        className="min-w-[180px]"
      />
      <button type="submit" className="btn-primary whitespace-nowrap">
        Search
      </button>
    </form>
  )
}
