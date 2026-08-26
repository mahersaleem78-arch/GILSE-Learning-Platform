import { Link } from 'react-router-dom'

export default function AdminPage() {
  const cards = [
    { to:'/admin/courses', title:'Courses', text:'Create, edit, and manage courses, modules, and lessons.' },
    { to:'/admin/payments', title:'Payments', text:'Review USDT/TRON payment submissions and verification status.' },
    { to:'/admin/rewards', title:'Referral rewards', text:'Approve or reject $40 referral rewards, then mark approved rewards as paid.' },
  ]
  return <div><div className="mb-8"><h2 className="font-heading text-2xl font-bold text-neutral-900">Overview</h2><p className="mt-1 text-sm text-neutral-600">Manage courses, users, payments, and referral rewards.</p></div><div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{cards.map(card => <Link key={card.to} to={card.to} className="card-hover p-6 group"><div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-50"><span className="text-lg font-bold text-primary-600">{card.title[0]}</span></div><h3 className="mt-4 font-heading text-lg font-semibold text-neutral-900 group-hover:text-primary-700">{card.title}</h3><p className="mt-2 text-sm text-neutral-600">{card.text}</p></Link>)}</div></div>
}
