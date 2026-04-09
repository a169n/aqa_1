import { parseReportTarget } from '../services/report.service';

describe('report.service unit logic', () => {
  it('rejects report inputs that target both entities or neither entity', () => {
    expect(() =>
      parseReportTarget({
        commentId: 22,
        postId: 11,
      }),
    ).toThrow('Report must target exactly one post or comment.');

    expect(() => parseReportTarget({})).toThrow('Report must target exactly one post or comment.');
  });
});
