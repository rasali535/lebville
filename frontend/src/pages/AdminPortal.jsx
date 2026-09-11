import React, { useCallback, useEffect, useState } from "react";
import { api, API, formatApiError } from "../lib/api";
import { formatBWP } from "../lib/format";
import { useAuth } from "../context/AuthContext";
import { BarChart3, CalendarDays, Gift, ImagePlus, LogOut, Package, Save, Settings, ShoppingBag, Trash2, X } from "lucide-react";

const blankProduct = { name: "", slug: "", description: "", price: 0, compare_at_price: "", category: "clothing", tag: "", image: "", images: [], sizes: [], stock: 0, active: true, featured: false };
const blankSpecial = { title: "", description: "", image: "", product_ids: [], starts_at: "", ends_at: "", active: true };

const field = "w-full border border-espresso/15 bg-white px-3 py-2 text-sm focus:outline-none focus:border-terracotta";
const label = "block overline text-[10px] text-muted-foreground mb-2";

function Modal({ title, onClose, children }) {
  return <div className="fixed inset-0 z-[80] bg-espresso/55 backdrop-blur-sm overflow-y-auto p-4 sm:p-8">
    <div className="max-w-3xl mx-auto bg-bone border border-white/20 shadow-2xl">
      <div className="flex justify-between items-center p-5 border-b border-espresso/10"><h2 className="font-serif text-3xl">{title}</h2><button onClick={onClose} aria-label="Close"><X /></button></div>
      <div className="p-5 sm:p-8">{children}</div>
    </div>
  </div>;
}

function ProductForm({ initial, defaultCategory = "clothing", onClose, onSaved }) {
  const [form, setForm] = useState(initial || { ...blankProduct, category: defaultCategory });
  const [removedMediaIds, setRemovedMediaIds] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const upload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setBusy(true); setError("");
    try {
      const body = new FormData(); body.append("file", file);
      const { data } = await api.post("/admin/media", body, { headers: { "Content-Type": "multipart/form-data" } });
      const previous = String(form.image || "").match(/\/api\/media\/([a-f0-9]{24})(?:$|[?#])/i);
      if (previous) setRemovedMediaIds((ids) => [...new Set([...ids, previous[1]])]);
      set("image", data.url.startsWith("http") ? data.url : `${API.replace(/\/api$/, "")}${data.url}`);
    } catch (err) { setError(formatApiError(err)); } finally { setBusy(false); }
  };
  const removeImage = () => {
    const match = String(form.image || "").match(/\/api\/media\/([a-f0-9]{24})(?:$|[?#])/i);
    if (match) setRemovedMediaIds((ids) => [...new Set([...ids, match[1]])]);
    set("image", "");
  };
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError("");
    const payload = { ...form, price: Number(form.price), compare_at_price: form.compare_at_price === "" ? null : Number(form.compare_at_price), stock: Number(form.stock), sizes: Array.isArray(form.sizes) ? form.sizes : String(form.sizes).split(",").map((x) => x.trim()).filter(Boolean) };
    try { initial?.id ? await api.put(`/admin/products/${initial.id}`, payload) : await api.post("/admin/products", payload); await Promise.allSettled(removedMediaIds.map((id) => api.delete(`/admin/media/${id}`))); onSaved(); }
    catch (err) { setError(formatApiError(err)); } finally { setBusy(false); }
  };
  return <form onSubmit={submit} className="grid sm:grid-cols-2 gap-5">
    <div className="sm:col-span-2"><label className={label}>Name</label><input className={field} required value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
    <div><label className={label}>Price (BWP)</label><input className={field} type="number" min="0" step="0.01" required value={form.price} onChange={(e) => set("price", e.target.value)} /></div>
    <div><label className={label}>Old/compare price</label><input className={field} type="number" min="0" step="0.01" value={form.compare_at_price ?? ""} onChange={(e) => set("compare_at_price", e.target.value)} /></div>
    <div><label className={label}>Category</label><select className={field} value={form.category} onChange={(e) => set("category", e.target.value)}><option value="clothing">Clothing</option><option value="cosmetics">Cosmetics</option><option value="accessories">Accessories</option><option value="service">Bookable service</option></select></div>
    <div><label className={label}>Label/tag</label><select className={field} value={form.tag || ""} onChange={(e) => set("tag", e.target.value || null)}><option value="">None</option><option value="new">New</option><option value="bestseller">Best seller</option><option value="clearance">Sale</option><option value="popular">Popular</option><option value="luxury">Luxury</option></select></div>
    <div><label className={label}>Stock</label><input className={field} type="number" min="0" value={form.stock} onChange={(e) => set("stock", e.target.value)} /></div>
    <div><label className={label}>Sizes/duration (comma separated)</label><input className={field} value={Array.isArray(form.sizes) ? form.sizes.join(", ") : form.sizes} onChange={(e) => set("sizes", e.target.value)} placeholder="S, M, L or 60 mins" /></div>
    <div className="sm:col-span-2"><label className={label}>Description</label><textarea className={`${field} min-h-28`} value={form.description} onChange={(e) => set("description", e.target.value)} /></div>
    <div className="sm:col-span-2"><label className={label}>Product image</label><div className="flex gap-4 items-center">{form.image && <div><img src={form.image} alt="Preview" className="w-20 h-24 object-cover" /><button type="button" onClick={removeImage} className="block text-xs text-destructive underline mt-1">Remove</button></div>}<label className="cursor-pointer border border-dashed border-terracotta px-5 py-4 text-sm"><ImagePlus className="inline mr-2" size={17} />{busy ? "Uploading…" : "Upload image"}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={upload} /></label></div></div>
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} /> Visible on website</label>
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} /> Featured</label>
    {error && <p className="sm:col-span-2 text-destructive text-sm">{error}</p>}
    <div className="sm:col-span-2 flex justify-end gap-3"><button type="button" onClick={onClose} className="px-5 py-3 border border-espresso/20">Cancel</button><button disabled={busy} className="bg-espresso text-bone px-6 py-3 disabled:opacity-50"><Save className="inline mr-2" size={16} />Save product</button></div>
  </form>;
}

function BookingForm({ initial, services, onClose, onSaved }) {
  const [form, setForm] = useState({ ...initial, email: initial.email || "", notes: initial.notes || "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const chooseService = (serviceId) => {
    const service = services.find((item) => item.id === serviceId);
    setForm((f) => ({ ...f, service_id: serviceId, service_name: service?.name || f.service_name }));
  };
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError("");
    try {
      await api.put(`/admin/bookings/${initial.id}`, {
        service_id: form.service_id, service_name: form.service_name,
        customer_name: form.customer_name, phone: form.phone,
        email: form.email || null, preferred_date: form.preferred_date,
        preferred_time: form.preferred_time, guests: Number(form.guests),
        notes: form.notes || null, status: form.status,
      });
      onSaved();
    } catch (err) { setError(formatApiError(err)); } finally { setBusy(false); }
  };
  return <form onSubmit={submit} className="grid sm:grid-cols-2 gap-5">
    <div className="sm:col-span-2"><label className={label}>Bookable service</label><select className={field} value={form.service_id} onChange={(e) => chooseService(e.target.value)}>{services.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
    <div><label className={label}>Customer name</label><input required className={field} value={form.customer_name} onChange={e=>set("customer_name",e.target.value)}/></div>
    <div><label className={label}>Phone</label><input required className={field} value={form.phone} onChange={e=>set("phone",e.target.value)}/></div>
    <div><label className={label}>Email</label><input type="email" className={field} value={form.email} onChange={e=>set("email",e.target.value)}/></div>
    <div><label className={label}>Guests</label><input type="number" min="1" max="30" className={field} value={form.guests} onChange={e=>set("guests",e.target.value)}/></div>
    <div><label className={label}>Preferred date</label><input type="date" required className={field} value={form.preferred_date} onChange={e=>set("preferred_date",e.target.value)}/></div>
    <div><label className={label}>Preferred time</label><input type="time" required className={field} value={form.preferred_time} onChange={e=>set("preferred_time",e.target.value)}/></div>
    <div className="sm:col-span-2"><label className={label}>Status</label><select className={field} value={form.status} onChange={e=>set("status",e.target.value)}>{["new","confirmed","completed","cancelled"].map(o=><option key={o} value={o}>{o}</option>)}</select></div>
    <div className="sm:col-span-2"><label className={label}>Notes</label><textarea className={`${field} min-h-24`} value={form.notes} onChange={e=>set("notes",e.target.value)}/></div>
    {error && <p className="sm:col-span-2 text-destructive text-sm">{error}</p>}
    <div className="sm:col-span-2 flex justify-end gap-3"><button type="button" onClick={onClose} className="px-5 py-3 border border-espresso/20">Cancel</button><button disabled={busy} className="bg-espresso text-bone px-6 py-3 disabled:opacity-50"><Save className="inline mr-2" size={16}/>Save booking</button></div>
  </form>;
}

export default function AdminPortal() {
  const { logout } = useAuth();
  const [tab, setTab] = useState("overview");
  const [data, setData] = useState({ summary: {}, products: [], specials: [], orders: [], bookings: [], settings: null });
  const [modal, setModal] = useState(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setError("");
    try {
      const [summary, products, specials, orders, bookings, settings] = await Promise.all([
        api.get("/admin/summary"), api.get("/admin/products"), api.get("/admin/specials"), api.get("/admin/orders"), api.get("/admin/bookings"), api.get("/admin/settings")
      ]);
      setData({ summary: summary.data, products: products.data.items, specials: specials.data.items, orders: orders.data.items, bookings: bookings.data.items, settings: settings.data });
    } catch (err) { setError(formatApiError(err)); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const remove = async (kind, id) => { if (!window.confirm(`Remove this ${kind.slice(0, -1)}?`)) return; await api.delete(`/admin/${kind}/${id}`); load(); };
  const status = async (kind, id, value) => { await api.patch(`/admin/${kind}/${id}/status`, { status: value }); load(); };
  const saveSpecial = async (e) => { e.preventDefault(); const payload = modal.item; modal.item.id ? await api.put(`/admin/specials/${modal.item.id}`, payload) : await api.post("/admin/specials", payload); setModal(null); load(); };
  const uploadSpecialImage = async (e) => { const file=e.target.files?.[0]; if(!file)return; const body=new FormData(); body.append("file",file); const {data:media}=await api.post("/admin/media",body,{headers:{"Content-Type":"multipart/form-data"}}); const url=media.url.startsWith("http")?media.url:`${API.replace(/\/api$/,"")}${media.url}`; setModal(m=>({...m,item:{...m.item,image:url}})); };
  const saveSettings = async (e) => { e.preventDefault(); await api.put("/admin/settings", data.settings); load(); };
  const nav = [{ id: "overview", text: "Overview", icon: BarChart3 }, { id: "products", text: "Products", icon: Package }, { id: "services", text: "Bookable Services", icon: CalendarDays }, { id: "specials", text: "Specials", icon: Gift }, { id: "orders", text: "Orders", icon: ShoppingBag }, { id: "bookings", text: "Customer Bookings", icon: CalendarDays }, { id: "settings", text: "Settings", icon: Settings }];
  return <div className="min-h-screen pt-24 bg-[#f5f0e8] flex flex-col lg:flex-row">
    <aside className="lg:w-72 bg-espresso text-bone p-6 lg:min-h-[calc(100vh-6rem)]"><p className="overline text-terracotta mb-2">Lebville</p><h1 className="font-serif text-3xl mb-8">Admin Studio</h1><nav className="space-y-1">{nav.map(({ id, text, icon: Icon }) => <button key={id} onClick={() => setTab(id)} className={`w-full flex gap-3 items-center px-4 py-3 text-left text-sm ${tab === id ? "bg-terracotta text-white" : "hover:bg-white/10"}`}><Icon size={17} />{text}</button>)}</nav><button onClick={logout} className="mt-10 flex gap-2 items-center text-bone/60 hover:text-white"><LogOut size={16} /> Sign out</button></aside>
    <section className="flex-1 p-5 sm:p-10 overflow-hidden"><div className="max-w-6xl mx-auto">{error && <div className="bg-red-50 text-red-700 p-4 mb-5">{error}</div>}
      {tab === "overview" && <><h2 className="font-serif text-5xl mb-8">Good day.</h2><div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5">{[["Products",data.summary.products],["Open orders",data.summary.open_orders],["New bookings",data.summary.new_bookings],["Active specials",data.summary.active_specials]].map(([k,v])=><div key={k} className="bg-white p-6 border border-espresso/5"><p className="overline text-muted-foreground">{k}</p><p className="font-serif text-5xl mt-3">{v ?? "—"}</p></div>)}</div></>}
      {(tab === "products" || tab === "services") && <CatalogueTable items={data.products.filter(p=>tab === "services" ? p.category === "service" : p.category !== "service")} serviceMode={tab === "services"} setModal={setModal} remove={remove}/>}
      {tab === "specials" && <><div className="flex justify-between items-end mb-6"><div><p className="overline text-terracotta">Promotions</p><h2 className="font-serif text-4xl">Specials</h2></div><button onClick={() => setModal({type:"special",item:{...blankSpecial}})} className="bg-espresso text-white px-5 py-3">+ Add special</button></div><div className="grid md:grid-cols-2 gap-5">{data.specials.map(s=><div key={s.id} className="bg-white p-6 border border-espresso/5"><div className="flex justify-between"><div><span className={`overline ${s.active ? "text-green-700":"text-muted-foreground"}`}>{s.active ? "Active":"Inactive"}</span><h3 className="font-serif text-2xl mt-2">{s.title}</h3></div><Gift className="text-terracotta"/></div><p className="text-sm text-muted-foreground mt-3">{s.description}</p><div className="mt-5"><button className="underline mr-5" onClick={()=>setModal({type:"special",item:{...s}})}>Edit</button><button className="text-destructive" onClick={()=>remove("specials",s.id)}>Remove</button></div></div>)}</div></>}
      {tab === "orders" && <AdminRecords items={data.orders} type="orders" status={status} />}
      {tab === "bookings" && <AdminRecords items={data.bookings} type="bookings" status={status} onEdit={item=>setModal({type:"booking",item})} onRemove={id=>remove("bookings",id)} />}
      {tab === "settings" && data.settings && <form onSubmit={saveSettings} className="max-w-xl bg-white p-7"><p className="overline text-terracotta mb-2">Communication</p><h2 className="font-serif text-4xl mb-7">WhatsApp settings</h2><label className={label}>Lebville WhatsApp number</label><input className={field} value={data.settings.whatsapp_number} onChange={e=>setData(d=>({...d,settings:{...d.settings,whatsapp_number:e.target.value}}))} placeholder="+267 73 011 600"/><p className="text-xs text-muted-foreground mt-2 mb-6">Use the complete number including country code.</p><button className="bg-espresso text-white px-6 py-3"><Save className="inline mr-2" size={16}/>Save settings</button></form>}
    </div></section>
    {modal?.type === "product" && <Modal title={modal.item ? "Edit item" : modal.defaultCategory === "service" ? "Add bookable service" : "Add product"} onClose={()=>setModal(null)}><ProductForm initial={modal.item} defaultCategory={modal.defaultCategory} onClose={()=>setModal(null)} onSaved={()=>{setModal(null);load();}}/></Modal>}
    {modal?.type === "booking" && <Modal title={`Edit booking ${modal.item.booking_number || ""}`} onClose={()=>setModal(null)}><BookingForm initial={modal.item} services={data.products.filter(p=>p.category==="service")} onClose={()=>setModal(null)} onSaved={()=>{setModal(null);load();}}/></Modal>}
    {modal?.type === "special" && <Modal title={modal.item.id ? "Edit special":"Add special"} onClose={()=>setModal(null)}><form onSubmit={saveSpecial} className="space-y-5"><div><label className={label}>Title</label><input required className={field} value={modal.item.title} onChange={e=>setModal(m=>({...m,item:{...m.item,title:e.target.value}}))}/></div><div><label className={label}>Description</label><textarea className={field} value={modal.item.description} onChange={e=>setModal(m=>({...m,item:{...m.item,description:e.target.value}}))}/></div><div><label className={label}>Special banner image</label><div className="flex items-center gap-4">{modal.item.image&&<img src={modal.item.image} alt="" className="w-24 h-20 object-cover"/>}<label className="cursor-pointer border border-dashed border-terracotta px-4 py-3 text-sm"><ImagePlus className="inline mr-2" size={16}/>Upload<input className="hidden" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={uploadSpecialImage}/></label>{modal.item.image&&<button type="button" onClick={()=>setModal(m=>({...m,item:{...m.item,image:""}}))} className="text-destructive text-sm underline">Remove</button>}</div></div><div><label className={label}>Products included in this special</label><div className="max-h-40 overflow-y-auto border border-espresso/10 p-3 grid sm:grid-cols-2 gap-2">{data.products.map(p=><label key={p.id} className="text-sm flex gap-2"><input type="checkbox" checked={(modal.item.product_ids||[]).includes(p.id)} onChange={e=>setModal(m=>({...m,item:{...m.item,product_ids:e.target.checked?[...(m.item.product_ids||[]),p.id]:(m.item.product_ids||[]).filter(id=>id!==p.id)}}))}/>{p.name}</label>)}</div></div><div className="grid sm:grid-cols-2 gap-4"><div><label className={label}>Start date</label><input type="datetime-local" className={field} value={(modal.item.starts_at||"").slice(0,16)} onChange={e=>setModal(m=>({...m,item:{...m.item,starts_at:e.target.value}}))}/></div><div><label className={label}>End date</label><input type="datetime-local" className={field} value={(modal.item.ends_at||"").slice(0,16)} onChange={e=>setModal(m=>({...m,item:{...m.item,ends_at:e.target.value}}))}/></div></div><label className="flex gap-2"><input type="checkbox" checked={modal.item.active} onChange={e=>setModal(m=>({...m,item:{...m.item,active:e.target.checked}}))}/> Active on website</label><button className="bg-espresso text-white px-6 py-3">Save special</button></form></Modal>}
  </div>;
}

function CatalogueTable({ items, serviceMode, setModal, remove }) {
  return <><div className="flex justify-between items-end mb-6"><div><p className="overline text-terracotta">{serviceMode ? "Booking catalogue" : "Shop catalogue"}</p><h2 className="font-serif text-4xl">{serviceMode ? "Bookable Services" : "Products"}</h2></div><button onClick={()=>setModal({type:"product",defaultCategory:serviceMode?"service":"clothing"})} className="bg-espresso text-white px-5 py-3">+ Add {serviceMode ? "service" : "product"}</button></div><div className="bg-white overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left border-b"><th className="p-4">Item</th><th className="p-4">Category</th><th className="p-4">Price</th><th className="p-4">{serviceMode?"Duration":"Stock"}</th><th className="p-4">Status</th><th className="p-4"></th></tr></thead><tbody>{items.map(p=><tr key={p.id} className="border-b border-espresso/5"><td className="p-4"><div className="flex gap-3 items-center"><img src={p.image} alt="" className="w-12 h-14 object-cover bg-sand"/><span>{p.name}</span></div></td><td className="p-4 capitalize">{p.category}</td><td className="p-4">{formatBWP(p.price)}</td><td className="p-4">{serviceMode?(p.sizes||[]).join(", ")||"—":p.stock}</td><td className="p-4">{p.active===false?"Hidden":"Live"}</td><td className="p-4 whitespace-nowrap"><button onClick={()=>setModal({type:"product",item:p})} className="underline mr-4">Edit</button><button onClick={()=>remove("products",p.id)} className="text-destructive"><Trash2 size={16}/></button></td></tr>)}{items.length===0&&<tr><td colSpan="6" className="p-8 text-muted-foreground">No {serviceMode?"bookable services":"products"} yet.</td></tr>}</tbody></table></div></>;
}

function AdminRecords({ items, type, status, onEdit, onRemove }) {
  const options = type === "orders" ? ["pending_payment","paid","processing","ready","completed","cancelled"] : ["new","confirmed","completed","cancelled"];
  return <><p className="overline text-terracotta">Management</p><h2 className="font-serif text-4xl mb-6 capitalize">{type}</h2><div className="space-y-4">{items.length===0 && <div className="bg-white p-8 text-muted-foreground">No {type} yet.</div>}{items.map(x=><div key={x.id} className="bg-white border border-espresso/5 p-5"><div className="flex flex-col md:flex-row justify-between gap-5"><div><p className="overline text-terracotta">{x.order_number || x.booking_number}</p><h3 className="font-serif text-2xl mt-1">{x.shipping?.full_name || x.customer_name}</h3><p className="text-sm text-muted-foreground mt-1">{x.shipping?.phone || x.phone} · {new Date(x.created_at).toLocaleString()}</p>{x.service_name && <p className="mt-3">{x.service_name} — {x.preferred_date} at {x.preferred_time}</p>}{x.items && <p className="mt-3">{x.items.map(i=>`${i.name} ×${i.quantity}`).join(", ")} · <strong>{formatBWP(x.total)}</strong></p>}</div><div className="flex flex-col gap-3 md:items-end"><select className={`${field} md:w-48`} value={x.status} onChange={e=>status(type,x.id,e.target.value)}>{options.map(o=><option key={o} value={o}>{o.replaceAll("_"," ")}</option>)}</select>{type==="bookings"&&<div><button onClick={()=>onEdit(x)} className="underline mr-4">Edit details</button><button onClick={()=>onRemove(x.id)} className="text-destructive"><Trash2 className="inline mr-1" size={15}/>Remove</button></div>}</div></div></div>)}</div></>;
}
