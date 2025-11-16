'use client';

import { motion } from 'framer-motion';
import { Calendar, ChevronDown } from 'lucide-react';
import { format, startOfMonth, startOfWeek } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export interface DateFilterState {
  from: Date;
  to: Date;
  preset?: string;
}

interface DateFilterBarProps {
  dateRange: DateFilterState;
  onDateRangeChange: (dateRange: DateFilterState) => void;
  className?: string;
}

const DATE_PRESETS = [
  { label: 'Today', value: 'today', days: 0 },
  { label: 'Last 7 days', value: 'last7', days: 7 },
  { label: 'Last 30 days', value: 'last30', days: 30 },
  { label: 'This year', value: 'thisYear', special: 'year' },
  { label: 'Last year', value: 'lastYear', special: 'lastYear' },
];

export function DateFilterBar({ dateRange, onDateRangeChange, className }: DateFilterBarProps) {
  const handlePresetClick = (preset: typeof DATE_PRESETS[0]) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    let from: Date;
    let to: Date = new Date(today);

    if (preset.value === 'today') {
      from = new Date(today);
      from.setHours(0, 0, 0, 0);
      console.log('📅 Today selected:', { from, to });
    } else if (preset.special === 'week') {
      from = startOfWeek(today, { weekStartsOn: 1 });
      from.setHours(0, 0, 0, 0);
      console.log('📅 This week selected:', { from, to });
    } else if (preset.special === 'month') {
      from = startOfMonth(today);
      from.setHours(0, 0, 0, 0);
      console.log('📅 This month selected:', { from, to });
    } else if (preset.special === 'year') {
      // Start of this year
      from = new Date(today.getFullYear(), 0, 1);
      from.setHours(0, 0, 0, 0);
      // End of this year (today or Dec 31, whichever is earlier)
      to = new Date(today);
      to.setHours(23, 59, 59, 999);
      console.log('📅 This year selected:', { from, to });
    } else if (preset.special === 'lastYear') {
      // Start of last year
      from = new Date(today.getFullYear() - 1, 0, 1);
      from.setHours(0, 0, 0, 0);
      // End of last year
      to = new Date(today.getFullYear() - 1, 11, 31);
      to.setHours(23, 59, 59, 999);
      console.log('📅 Last year selected:', { from, to });
    } else {
      from = new Date(today);
      from.setDate(from.getDate() - (preset.days || 0));
      from.setHours(0, 0, 0, 0);
      console.log(`📅 Last ${preset.days || 0} days selected:`, { from, to });
    }

    const newRange = { from, to, preset: preset.value };
    console.log('🔄 Date range changing to:', newRange);
    onDateRangeChange(newRange);
  };

  const getDateRangeLabel = () => {
    if (dateRange.from && dateRange.to) {
      const isSameDay = format(dateRange.from, 'yyyy-MM-dd') === format(dateRange.to, 'yyyy-MM-dd');
      if (isSameDay) {
        return format(dateRange.from, 'MMM dd, yyyy');
      }
      return `${format(dateRange.from, 'MMM dd')} - ${format(dateRange.to, 'MMM dd, yyyy')}`;
    }
    return 'Select date range';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex items-center gap-3', className)}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'justify-start text-left font-normal min-w-[240px]',
              'hover:bg-accent hover:text-accent-foreground',
              'transition-all duration-200'
            )}
          >
            <Calendar className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="flex-1 truncate">{getDateRangeLabel()}</span>
            <ChevronDown className="ml-2 h-4 w-4 opacity-50 flex-shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[240px]">
          {DATE_PRESETS.map((preset) => (
            <DropdownMenuItem
              key={preset.value}
              onClick={() => handlePresetClick(preset)}
              className={cn(
                'cursor-pointer',
                dateRange.preset === preset.value && 'bg-accent'
              )}
            >
              <span className="flex-1">{preset.label}</span>
              {dateRange.preset === preset.value && (
                <span className="text-xs text-muted-foreground">✓</span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
}
