import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Zap, Target, Award, TrendingUp, Shield, CheckCircle2 } from 'lucide-react';
import { SMCard } from '../../components/ui';

const MotionSMCard = motion.create(SMCard);

export const GamificationStats = () => {
  const achievements = [
    { id: '1', title: 'Safety First', description: 'Completed 10 risk assessments', icon: Shield, color: 'text-blue-600', bg: 'bg-blue-50', progress: 100 },
    { id: '2', title: 'Eagle Eye', description: 'Identified 5 critical hazards', icon: Target, color: 'text-purple-600', bg: 'bg-purple-50', progress: 60 },
    { id: '3', title: 'Quick Responder', description: 'Reported incident within 1 hour', icon: Zap, color: 'text-orange-600', bg: 'bg-orange-50', progress: 80 },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-primary via-primary-800 to-primary-900 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
        {/* Ambient warm glow */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-accent-400/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-accent-400/15 rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-accent-300 text-sm font-bold uppercase tracking-wider mb-1">Current Level</p>
              <h3 className="text-3xl font-bold">Safety Master <span className="text-accent-400">Lvl 12</span></h3>
            </div>
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
              <Trophy className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
          
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-sm font-bold">
              <span>XP Progress</span>
              <span>2,450 / 3,000 XP</span>
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden border border-white/5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '82%' }}
                className="h-full bg-gradient-to-r from-accent-400 to-accent-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 border border-white/10 text-center">
              <Star className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
              <p className="text-xs text-accent-200">Points</p>
              <p className="font-bold">12,450</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 border border-white/10 text-center">
              <Award className="w-5 h-5 text-accent-400 mx-auto mb-1" />
              <p className="text-xs text-accent-200">Badges</p>
              <p className="font-bold">24</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 border border-white/10 text-center">
              <TrendingUp className="w-5 h-5 text-green-400 mx-auto mb-1" />
              <p className="text-xs text-accent-200">Rank</p>
              <p className="font-bold">#4</p>
            </div>
          </div>
        </div>
        <Trophy className="absolute right-[-40px] top-[-40px] w-64 h-64 text-white/5 -rotate-12" />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <h4 className="text-sm font-bold text-text-muted uppercase tracking-wider ml-2">Recent Achievements</h4>
        {achievements.map((achievement, i) => (
          <MotionSMCard
            key={achievement.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-4 flex items-center gap-4"
          >
            <div className={`w-12 h-12 ${achievement.bg} ${achievement.color} rounded-2xl flex items-center justify-center shrink-0`}>
              <achievement.icon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h5 className="font-bold text-text-primary truncate">{achievement.title}</h5>
              <p className="text-xs text-text-muted truncate">{achievement.description}</p>
              <div className="mt-2 h-1.5 bg-surface-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${achievement.progress === 100 ? 'bg-success' : 'bg-accent'}`}
                  style={{ width: `${achievement.progress}%` }}
                />
              </div>
            </div>
            {achievement.progress === 100 && (
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
            )}
          </MotionSMCard>
        ))}
      </div>
    </div>
  );
};
