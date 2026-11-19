'use client'
import { useState, useEffect } from 'react'

export default function AdminShops() {
  const [shops, setShops] = useState<any[]>([])
  const [form, setForm] = useState({ name: '', ownerPhone: '', area: 'Ximex Mall', logo: '🛒' })
  const [products, setProducts] = useState<any[]>([])
  const [newProd, setNewProd] = useState({ name: '', price: '', stock: '10', image: '' })

  useEffect(()=>{ fetchShops() }, [])
  
  async function fetchShops() {
    const res = await fetch('/api/admin/shops/list')
    const data = await res.json()
    setShops(data.shops || [])
  }

  async function createShop() {
    if (!form.name || !form.ownerPhone) return alert('Name + owner phone required')
    const res = await fetch('/api/admin/shops/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-secret': process.env.NEXT_PUBLIC_INTERNAL_SECRET! },
      body: JSON.stringify(form)
    })
    const data = await res.json()
    if (!res.ok) return alert(data.error)
    alert(`Shop created! Link: tuma.co.zw/shop/${data.id} — Copy for WhatsApp Status`)
    setForm({ name: '', ownerPhone: '', area: 'Ximex Mall', logo: '🛒' })
    fetchShops()
  }

  async function addProduct(shopId: string) {
    if (!newProd.name || !newProd.price) return alert('Name + price')
    await fetch('/api/admin/shops/product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shopId, ...newProd, price: Number(newProd.price), stock: Number(newProd.stock) })
    })
    setNewProd({ name: '', price: '', stock: '10', image: '' })
    alert('Product added')
  }

  async function uploadImage(e: any) {
    const file = e.target.files[0]
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
    const data = await res.json()
    setNewProd({...newProd, image: data.url})
    alert('Image uploaded')
  }

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif', maxWidth: 800, margin: '0 auto' }}>
      <h2>Admin — Add Tuckshop (No Code)</h2>
      
      <div style={{ background: 'white', padding: 15, borderRadius: 12, border: '1px solid #eee', marginTop: 15 }}>
        <h4>1. Create Shop</h4>
        <input placeholder="Shop name e.g. Enchanter Ximex" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} style={inputStyle} />
        <input placeholder="Owner WhatsApp 263777..." value={form.ownerPhone} onChange={e=>setForm({...form, ownerPhone: e.target.value})} style={{...inputStyle, marginTop: 8}} />
        <input placeholder="Area e.g. Ximex Mall Table 12" value={form.area} onChange={e=>setForm({...form, area: e.target.value})} style={{...inputStyle, marginTop: 8}} />
        <button onClick={createShop} style={btnBlack}>Create Shop + Get WhatsApp Link</button>
      </div>

      <div style={{ marginTop: 20 }}>
        <h4>Your Shops — Copy link for Status</h4>
        {shops.map(s=>(
          <div key={s.id} style={{ background: 'white', padding: 12, borderRadius: 10, border: '1px solid #eee', marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <b>{s.logo} {s.name}</b>
              <span style={{ fontSize: 11, color: '#666' }}>{s.area}</span>
            </div>
            <div style={{ fontSize: 12, marginTop: 6, background: '#f8f9fb', padding: 6, borderRadius: 6, wordBreak: 'break-all' }}>
              tuma.co.zw/shop/{s.id}
            </div>
            <button onClick={()=>navigator.clipboard.writeText(`Order from ${s.name}: https://tuma.co.zw/shop/${s.id}`)} style={{ fontSize: 11, marginTop: 6 }}>📋 Copy Status Text</button>

            <div style={{ marginTop: 10, borderTop: '1px solid #eee', paddingTop: 8 }}>
              <input placeholder="Product name" value={newProd.name} onChange={e=>setNewProd({...newProd, name: e.target.value})} style={{...inputStyle, fontSize: 12}} />
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <input placeholder="$ price" type="number" value={newProd.price} onChange={e=>setNewProd({...newProd, price: e.target.value})} style={{...inputStyle, flex: 1}} />
                <input placeholder="stock" type="number" value={newProd.stock} onChange={e=>setNewProd({...newProd, stock: e.target.value})} style={{...inputStyle, flex: 1}} />
              </div>
              <input type="file" accept="image/*" onChange={uploadImage} style={{ marginTop: 6, fontSize: 11 }} />
              {newProd.image && <img src={newProd.image} style={{ width: 60, height: 60, objectFit: 'cover', marginTop: 6, borderRadius: 6 }} />}
              <button onClick={()=>addProduct(s.id)} style={{...btnBlack, padding: 8, fontSize: 12, marginTop: 6}}>Add Product</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
const inputStyle = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' as any }
const btnBlack = { width: '100%', padding: '12px', background: 'black', color: 'white', borderRadius: '10px', border: 0, fontWeight: 'bold', marginTop: 10, cursor: 'pointer' as any }