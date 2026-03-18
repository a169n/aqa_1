import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminNav } from '@/components/common/admin-nav';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/table';
import { adminApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { formatDate } from '@/lib/utils';
import type { ReportStatus } from '@/types/api';

export const AdminReportsPage = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('open');

  const reportsQuery = useQuery({
    queryKey: ['admin', 'reports', statusFilter],
    queryFn: () => adminApi.reports(statusFilter === 'all' ? undefined : statusFilter),
  });

  const updateReportMutation = useMutation({
    mutationFn: ({ reportId, status }: { reportId: number; status: ReportStatus }) =>
      adminApi.updateReport(reportId, { status }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
    },
  });

  if (reportsQuery.isLoading) {
    return <LoadingState label="Loading moderation reports..." />;
  }

  if (reportsQuery.isError) {
    return <ErrorState message={getErrorMessage(reportsQuery.error)} />;
  }

  const reports = reportsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <Card className="surface-glow">
        <CardContent className="space-y-4">
          <Badge variant="accent" className="w-fit">
            Admin Reports
          </Badge>
          <h1 className="text-4xl">Moderate flagged posts and comments</h1>
          <AdminNav />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Report queue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-xs">
            <Select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as ReportStatus | 'all')}
            >
              <option value="all">all statuses</option>
              <option value="open">open</option>
              <option value="resolved">resolved</option>
              <option value="dismissed">dismissed</option>
            </Select>
          </div>

          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Target</TableHeaderCell>
                <TableHeaderCell>Reason</TableHeaderCell>
                <TableHeaderCell>Reporter</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Created</TableHeaderCell>
                <TableHeaderCell className="text-right">Actions</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>
                    {report.post ? `Post: ${report.post.title}` : null}
                    {report.comment ? `Comment: ${report.comment.content}` : null}
                  </TableCell>
                  <TableCell className="max-w-md whitespace-pre-wrap">{report.reason}</TableCell>
                  <TableCell>{report.reporter.name}</TableCell>
                  <TableCell>
                    <Badge variant={report.status === 'open' ? 'outline' : 'accent'}>
                      {report.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(report.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={updateReportMutation.isPending || report.status === 'resolved'}
                        onClick={() =>
                          updateReportMutation.mutate({ reportId: report.id, status: 'resolved' })
                        }
                      >
                        Resolve
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={updateReportMutation.isPending || report.status === 'dismissed'}
                        onClick={() =>
                          updateReportMutation.mutate({ reportId: report.id, status: 'dismissed' })
                        }
                      >
                        Dismiss
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
