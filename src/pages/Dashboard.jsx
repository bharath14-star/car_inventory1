import React, { useEffect, useState } from 'react'
import API from '../api'
import { useNavigate } from 'react-router-dom'

function Sparkline({ data = [] }){
  if (!data || data.length === 0) return <div>No trend</div>;
  const w = 240, h = 48, pad = 4;
  const max = Math.max(...data.map(d=>d.count), 1);
  const barW = (w - pad*2) / data.length - 4;

  return (
    <svg width={w} height={h}>
      {data.map((d,i)=>{
        const x = pad + i*(barW+4);
        const barH = Math.round((d.count / max) * (h - pad*2));
        const y = h - pad - barH;
        return <rect key={d.date} x={x} y={y} width={barW} height={barH} fill="#0d6efd" />
      })}
    </svg>
  )
}

export default function Dashboard(){
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const res = await API.get('/dashboard');
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  }

  useEffect(()=>{ load(); }, []);

  if (loading) return <div>Loading dashboard...</div>;
  if (!stats) return <div>No data</div>;

  const goFilterBy = (type, value) => {
    // navigate to records with search param
    if (!value) return;
    const search = encodeURIComponent(value);
    navigate(`/records?search=${search}`);
  }

  return (
    <div>
      <h2>Dashboard</h2>
      <div className="row mb-3">
        <div className="col-md-3">
          <div className="card p-3 mb-3">
            <h5>Total entries</h5>
            <div className="display-6">{stats.total}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card p-3 mb-3">
            <h5>Today</h5>
            <div className="display-6">{stats.today}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card p-3 mb-3">
            <h5>This week</h5>
            <div className="display-6">{stats.thisWeek}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card p-3 mb-3">
            <h5>Recent</h5>
            <div>{stats.recent ? stats.recent.length : 0} items</div>
          </div>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-8">
          <div className="card p-3 mb-3">
            <h6>Last 7 days</h6>
            <Sparkline data={stats.dailyCounts} />
            <div className="mt-2 small text-muted">Dates: {stats.dailyCounts.map(d=>d.date).join(', ')}</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card p-3 mb-3">
            <h6>Top Reg Nos</h6>
            <ul className="list-unstyled">
              {stats.topReg && stats.topReg.map(t => (
                <li key={t._id}>
                  <a href="#" onClick={(e)=>{ e.preventDefault(); goFilterBy('regNo', t._id); }}>{t._id}</a>
                  <small className="text-muted"> ({t.count})</small>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-12">
          <div className="card p-3 mb-3">
            <h6>Recent entries</h6>
            <ul className="list-unstyled">
              {stats.recent && stats.recent.map(r => (
                <li key={r._id}>
                  <a href="#" onClick={(e)=>{ e.preventDefault(); navigate(`/records?search=${encodeURIComponent(r.regNo)}`); }}>{r.regNo}</a>
                  <div className="small text-muted">{r.personName} — {new Date(r.inOutDateTime).toLocaleString()}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
