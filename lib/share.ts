import { Linking, Platform, Share } from 'react-native';
import type { Job } from '@/lib/api';
import { translate } from '@/lib/i18n';
import { salaryRange } from '@/lib/format';

/**
 * Shares a job as plain text — the way restaurant jobs actually travel, through
 * WhatsApp groups and staff who know someone.
 *
 * Plain text, no link: there is no public job page to point at yet, and a link
 * that opens nothing is worse than none. The text says where to find it.
 */
export async function shareJob(job: Job): Promise<void> {
  const where = [job.restaurantName, job.localityDisplay ?? job.outletName].filter(Boolean).join(', ');
  const message = translate('share.job', {
    title: job.title,
    where,
    salary: salaryRange(job.minSalary, job.maxSalary, job.salaryPeriod),
  });

  // Browsers without the Web Share API: WhatsApp is where this is going anyway.
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && !('share' in navigator)) {
    await Linking.openURL(`https://wa.me/?text=${encodeURIComponent(message)}`);
    return;
  }
  try {
    await Share.share({ message });
  } catch {
    await Linking.openURL(`https://wa.me/?text=${encodeURIComponent(message)}`);
  }
}
