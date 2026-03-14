import * as React from 'react';
import { cn } from '@/lib/utils';

export const Table = React.forwardRef<HTMLTableElement, React.TableHTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="w-full overflow-x-auto">
      <table ref={ref} className={cn('w-full min-w-[640px] text-left text-sm', className)} {...props} />
    </div>
  ),
);

export const TableHead = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn('border-b border-border/70 text-xs uppercase tracking-[0.18em] text-muted-foreground', className)} {...props} />
));

export const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => <tbody ref={ref} className={cn(className)} {...props} />);

export const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr ref={ref} className={cn('border-b border-border/50 last:border-0', className)} {...props} />
  ),
);

export const TableHeaderCell = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th ref={ref} className={cn('px-4 py-3 font-semibold', className)} {...props} />
));

export const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td ref={ref} className={cn('px-4 py-4 align-top text-foreground/90', className)} {...props} />
));

Table.displayName = 'Table';
TableHead.displayName = 'TableHead';
TableBody.displayName = 'TableBody';
TableRow.displayName = 'TableRow';
TableHeaderCell.displayName = 'TableHeaderCell';
TableCell.displayName = 'TableCell';

