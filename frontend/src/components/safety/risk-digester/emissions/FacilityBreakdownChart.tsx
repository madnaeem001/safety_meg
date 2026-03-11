import React from 'react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { FACILITY_EMISSIONS } from '../../../../data/mockRiskDigester';

const COLORS = ['#5d786c', '#a1b6ab', '#c5d3cb', '#e2e9e4'];

interface FacilityBreakdownChartProps {
  facilityData?: { name: string; value: number }[];
}

export const FacilityBreakdownChart: React.FC<FacilityBreakdownChartProps> = ({ facilityData }) => {
  const data = facilityData && facilityData.length > 0 ? facilityData : FACILITY_EMISSIONS;
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
    </motion.div>
  );
};
