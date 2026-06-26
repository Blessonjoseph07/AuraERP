import React from 'react'

const DashboardCard = ({ title, value, icon: Icon, subtext, color = 'blue' }) => {
  const getColorClasses = () => {
    switch (color) {
      case 'green':
        return {
          iconBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-emerald-500/5',
          glow: 'group-hover:border-emerald-500/30'
        }
      case 'amber':
        return {
          iconBg: 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-amber-500/5',
          glow: 'group-hover:border-amber-500/30'
        }
      case 'red':
        return {
          iconBg: 'bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-rose-500/5',
          glow: 'group-hover:border-rose-500/30'
        }
      default:
        return {
          iconBg: 'bg-brand-500/10 text-brand-400 border border-brand-500/20 shadow-brand-500/5',
          glow: 'group-hover:border-brand-500/30'
        }
    }
  }

  const styles = getColorClasses()

  return (
    <div className={`glass-card p-6 rounded-2xl flex items-center justify-between border border-slate-800 transition duration-300 group hover:translate-y-[-2px] ${styles.glow}`}>
      <div className="space-y-1">
        <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">{title}</span>
        <h3 className="text-3xl font-extrabold text-slate-100 tracking-tight leading-none pt-1">{value}</h3>
        {subtext && <p className="text-[10px] text-slate-400 pt-1">{subtext}</p>}
      </div>
      <div className={`p-4 rounded-2xl border transition duration-300 group-hover:scale-105 ${styles.iconBg}`}>
        <Icon size={24} />
      </div>
    </div>
  )
}

export default DashboardCard
