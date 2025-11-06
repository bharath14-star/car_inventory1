import React, { useEffect, useState } from 'react'
import API from '../api'
import { useNavigate, useLocation } from 'react-router-dom'

export default function RecordsList(){
  const [records, setRecords] = useState([]);
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const user = typeof window !== 'undefined' && localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
  const isAdmin = user && user.role === 'admin';

  // pagination & sorting state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState('inOutDateTime');
  const [sortDir, setSortDir] = useState('desc');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchRecords = async (opts = {}) => {
    try {
      const params = {
        search: q,
        status: statusFilter,
        page,
        limit,
        sortBy,
        sortDir,
        ...opts,
      };

      const res = await API.get('/car-records', { params });

      // backend may return { total, page, limit, items }
      if (res.data && Array.isArray(res.data.items)) {
        setRecords(res.data.items);
        setTotal(res.data.total || 0);
        setPage(res.data.page || page);
        setLimit(res.data.limit || limit);
      } else if (Array.isArray(res.data)) {
        // fallback to older format
        setRecords(res.data);
        setTotal(res.data.length);
      } else {
        setRecords([]);
        setTotal(0);
      }
    } catch (err) {
      console.error(err);
      alert('Error fetching records');
    }
  }

  // initialize from query params if provided
  useEffect(()=>{
    const qp = new URLSearchParams(location.search);
    const s = qp.get('search');
    const p = qp.get('page');
    const l = qp.get('limit');
    const sb = qp.get('sortBy');
    const sd = qp.get('sortDir');
    if (s !== null) setQ(s);
    if (p) setPage(Number(p));
    if (l) setLimit(Number(l));
    if (sb) setSortBy(sb);
    if (sd) setSortDir(sd);
    fetchRecords();
  }, [location.search]);

  useEffect(()=>{ fetchRecords(); }, [page, limit, sortBy, sortDir, statusFilter]);

  const onSearch = () => { setPage(1); fetchRecords({ page: 1 }); }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div>
      <div className="d-flex mb-3">
        <input className="form-control me-2" placeholder="Search regNo, person, make..." value={q} onChange={e=>setQ(e.target.value)} />
        <button className="btn btn-outline-primary me-3" onClick={onSearch}>Search</button>

        <div className="me-2 d-flex align-items-center">
          <label className="me-2 mb-0">Sort</label>
          <select className="form-select me-2" value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{width:160}}>
            <option value="inOutDateTime">Date</option>
            <option value="regNo">Reg No</option>
            <option value="personName">Person</option>
          </select>
          <select className="form-select" value={sortDir} onChange={e=>setSortDir(e.target.value)} style={{width:120}}>
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
        </div>

        <div className="d-flex align-items-center me-2">
          <label className="me-2 mb-0">Status</label>
          <select className="form-select" value={statusFilter} onChange={e=>{ setStatusFilter(e.target.value); setPage(1); }} style={{width:120}}>
            <option value="">All</option>
            <option value="IN">IN</option>
            <option value="OUT">OUT</option>
          </select>
        </div>

        <div className="d-flex align-items-center">
          <label className="me-2 mb-0">Page size</label>
          <select className="form-select" value={limit} onChange={e=>{ setLimit(Number(e.target.value)); setPage(1); }} style={{width:100}}>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      <div className="mb-2 d-flex justify-content-between">
        <div>Showing {records.length} of {total} results</div>
        <div>Page {page} / {totalPages}</div>
      </div>

      <table className="table table-striped">
        <thead>
          <tr>
            <th>Reg No</th>
            <th>Person</th>
            <th>In/Out</th>
            <th>Date</th>
            <th>Photos</th>
            <th>Video</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.map(r => (
            <tr key={r._id}>
              <td>{r.regNo}</td>
              <td>{r.personName}</td>
              <td>{r.inOutStatus}</td>
              <td>{r.inOutDateTime ? new Date(r.inOutDateTime).toLocaleString() : ''}</td>
              <td>
                {r.photos && r.photos.map((p,i)=> (
                  <img key={i} src={`http://localhost:5000${p}`} alt="photo" style={{ height: 50, marginRight: 6 }} />
                ))}
              </td>
              <td>
                {r.video && (
                  <a href={`http://localhost:5000${r.video}`} target="_blank" rel="noreferrer">View</a>
                )}
              </td>
              <td>
                <button className="btn btn-sm btn-info me-2" onClick={()=>{ navigate(`/record/${r._id}`) }}>View Details</button>
                {isAdmin && (
                  <>
                    <button className="btn btn-sm btn-secondary me-2" onClick={()=>{ navigate(`/entry?edit=${r._id}`) }}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={async ()=>{
                      if (!confirm('Delete?')) return;
                      try {
                        await API.delete(`/car/${r._id}`);
                        fetchRecords();
                      } catch (err) { console.error(err); alert('Delete failed') }
                    }}>Delete</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="d-flex justify-content-between align-items-center">
        <div>
          <button className="btn btn-outline-secondary me-2" onClick={()=>{ if (page>1) setPage(p=>p-1); }} disabled={page<=1}>Prev</button>
          <button className="btn btn-outline-secondary" onClick={()=>{ if (page<totalPages) setPage(p=>p+1); }} disabled={page>=totalPages}>Next</button>
        </div>

        <div>
          <small className="text-muted">Go to page:</small>
          <input type="number" min={1} max={totalPages} value={page} onChange={e=>{ const v = Number(e.target.value) || 1; setPage(Math.min(Math.max(1, v), totalPages)); }} style={{width:80, marginLeft:8}} />
        </div>
      </div>
    </div>
  )
}
