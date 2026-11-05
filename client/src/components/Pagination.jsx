// Previous / Next buttons. "pagination" is the block the server sends: { page, totalPages, total }
const Pagination = ({ pagination, onPage }) => {
  if (!pagination || pagination.totalPages <= 1) return null
  const { page, totalPages, total } = pagination

  return (
    <div className="mt-6 flex items-center justify-center gap-4 text-sm text-bread-brown">
      <button className="btn-outline" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        Previous
      </button>
      <p>
        Page {page} of {totalPages} ({total} in total)
      </p>
      <button className="btn-outline" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
        Next
      </button>
    </div>
  )
}

export default Pagination
