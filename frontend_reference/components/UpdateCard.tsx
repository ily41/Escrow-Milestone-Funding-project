import type { Update } from '@/lib/types'
import { format } from 'date-fns'

interface UpdateCardProps {
  update: Update
}

export default function UpdateCard({ update }: UpdateCardProps) {
  return (
    <div className="rounded-lg p-4" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>{update.title}</h3>
        <span className="text-sm" style={{ color: 'var(--text)', opacity: 0.6 }}>
          {format(new Date(update.created_at), 'MMM d, yyyy')}
        </span>
      </div>
      <p className="whitespace-pre-wrap" style={{ color: 'var(--text)', opacity: 0.8 }}>{update.content}</p>
      <div className="mt-2 text-sm" style={{ color: 'var(--text)', opacity: 0.6 }}>
        By {update.created_by_username}
      </div>
    </div>
  )
}
