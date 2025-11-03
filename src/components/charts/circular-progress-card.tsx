'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CircularProgressCardProps {
  title: string;
  description?: string;
  value: number;
  maxValue?: number;
  label?: string;
  color?: string;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}

export function CircularProgressCard({
  title,
  description,
  value,
  maxValue = 100,
  label,
  color = 'hsl(221.2 83.2% 53.3%)',
  icon: Icon,
  className,
}: CircularProgressCardProps) {
  const percentage = Math.min((value / maxValue) * 100, 100);
  
  const data = [
    {
      name: label || title,
      value: percentage,
      fill: color,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Card className="border-none shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              {description && (
                <CardDescription>{description}</CardDescription>
              )}
            </div>
            {Icon && (
              <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center">
                <Icon className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <ResponsiveContainer width="100%" height={200}>
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="70%"
                outerRadius="100%"
                barSize={20}
                data={data}
                startAngle={90}
                endAngle={-270}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar
                  background={{ fill: 'hsl(var(--muted))' }}
                  dataKey="value"
                  cornerRadius={10}
                  animationDuration={1000}
                />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="text-4xl font-bold"
              >
                {Math.round(percentage)}%
              </motion.div>
              {label && (
                <div className="text-sm text-muted-foreground mt-1">{label}</div>
              )}
            </div>
          </div>
          <div className="mt-4 text-center">
            <span className="text-2xl font-bold">{value}</span>
            <span className="text-muted-foreground"> / {maxValue}</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
