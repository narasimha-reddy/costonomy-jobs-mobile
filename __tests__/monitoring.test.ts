import { scrub, stripQuery } from '@/lib/monitoring';

describe('crash report scrubbing', () => {
  it('masks Indian mobile numbers in every common shape', () => {
    expect(scrub('no user for +919876543210')).toBe('no user for [phone]');
    expect(scrub('call +91 98765 43210')).toBe('call [phone]');
    expect(scrub('9876543210 failed')).toBe('[phone] failed');
    expect(scrub('job 12345 at ₹18000')).toBe('job 12345 at ₹18000');
  });

  it('strips query strings, where signed file URLs carry their credential', () => {
    expect(stripQuery('https://bucket.s3.amazonaws.com/a.jpg?X-Amz-Signature=abc')).toBe('https://bucket.s3.amazonaws.com/a.jpg');
  });
});
