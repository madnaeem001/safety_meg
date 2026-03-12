import React from 'react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { Database } from 'lucide-react';

const COLORS = ['#5d786c', '#a1b6ab', '#c5d3cb', '#e2e9e4'];

interface FacilityBreakdownChartProps {
  facilityData?: { name: string; value: number }[];
}

export const FacilityBreakdownChart: React.FC<FacilityBreakdownChartProps> = ({ facilityData }) => {
  const data = facilityData && facilityData.length > 0 ? facilityData : [];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="bg-white p-8 rounded-[2.5rem] shadow-soft border border-surface-100 h-[400px] flex flex-col"
    >
      <div>
        <h3 className="text-xl font-bold text-brand-900 tracking-tight">Facility Breakdown</h3>
        <p className="text-xs text-surface-500 font-medium uppercase tracking-widest mt-1">Emission distribution by location</p>
      </div>
      
      {data.length > 0 ? (
        <div className="flex-1 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={8}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  borderRadius: '1rem',
                  border: '1px solid #f2f0eb',
                  boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)'
                }}
              />
              <Legend
                verticalAlign="bottom"
                align="center"
                iconType="circle"
                formatter={(value) => <span className="text-[10px] font-bold text-surface-500 uppercase tracking-widest ml-1">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="mt-4 flex flex-1 flex-col items-center justify-center rounded-[2rem] border border-dashed border-surface-200 bg-surface-50/60 px-6 py-12 text-center">
          <div className="mb-3 rounded-2xl bg-white p-3 shadow-soft">
            <Database className="h-5 w-5 text-surface-400" />
          </div>
          <p className="font-semibold text-brand-900">No facility emission totals are available</p>
          <p className="mt-1 text-sm text-surface-500">
            Facility breakdown now depends entirely on backend gas sensor readings grouped by zone or location.
          </p>
        </div>
      )}
    </motion.div>
  );
};
