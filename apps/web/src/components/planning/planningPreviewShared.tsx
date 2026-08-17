/* eslint-disable react-refresh/only-export-components */
import type { ReactNode } from 'react'

export const cn = (...classes: (string | boolean | undefined)[]) =>
    classes.filter(Boolean).join(' ')

export const PanelHeader = ({ icon: Icon, title, subtitle, action }: { icon: any, title: string, subtitle: string, action?: ReactNode }) => (
    <div className="flex items-center justify-between mb-4 border-b border-border/40 pb-3">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-700 shadow-sm">
                <Icon className="w-4 h-4" />
            </div>
            <div>
                <h3 className="font-semibold text-sm text-zinc-900 leading-none">{title}</h3>
                <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider mt-1">{subtitle}</p>
            </div>
        </div>
        {action && <div>{action}</div>}
    </div>
)
