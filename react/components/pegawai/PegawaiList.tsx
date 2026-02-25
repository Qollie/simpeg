import React, { useEffect, useState } from 'react';

type Pegawai = {
  nipPegawai: string;
  nama: string;
  email?: string;
};

export default function PegawaiList() {
  const [data, setData] = useState<Pegawai[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/pegawai')
      .then((r) => r.json())
      .then((json) => {
        // Laravel paginator returns `data` array
        setData(json.data ?? json);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading pegawai...</div>;

  return (
    <div>
      <h3>Daftar Pegawai</h3>
      <ul>
        {data.map((p) => (
          <li key={p.nipPegawai}>
            {p.nama} — {p.nipPegawai} {p.email ? `(${p.email})` : ''}
          </li>
        ))}
      </ul>
    </div>
  );
}
