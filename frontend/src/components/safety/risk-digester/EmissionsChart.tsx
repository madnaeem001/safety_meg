import React from 'react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

import { ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SMCard } from '../../ui';

export const EmissionsChart: React.FC = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
    >
      <SMCard className="p-8 rounded-[2.5rem] h-[400px] flex flex-col">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-xl font-bold text-text-primary tracking-tight">Environmental Emissions</h3>
            <p className="text-xs text-text-muted font-medium uppercase tracking-widest mt-1">Actual vs Regulatory Limits</p>
          </div>
          <button 
            onClick={() => navigate('/emission-reports')}
            className="text-[10px] font-bold text-accent uppercase tracking-widest hover:opacity-80 transition-colors flex items-center gap-1"
          >
            Detailed Reports <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
        
        <div className="flex-1 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={[]}>
              <defs>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5d786c" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#5d786c" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorLimit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e24a4a" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#e24a4a" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e6ded1" />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#8c7e67', fontSize: 10, fontWeight: 600 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#8c7e67', fontSize: 10, fontWeight: 600 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  borderRadius: '1rem', 
                  border: '1px solid #e6ded1',
                  boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="actual" 
                stroke="#5d786c" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorActual)" 
              />
              <Area 
                type="monotone" 
                dataKey="limit" 
                stroke="#e24a4a" 
                strokeWidth={2}
                strokeDasharray="5 5"
                fillOpacity={1} 
                fill="url(#colorLimit)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </SMCard>
    </motion.div>
  );
};
