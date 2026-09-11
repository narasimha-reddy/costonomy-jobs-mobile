import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Avatar } from '@/components/ui/Avatar';

describe('Avatar', () => {
  it('uses initials from words that start with a letter', async () => {
    await render(<Avatar name="Chai & Tiffin Co." />);
    expect(screen.getByText('CT')).toBeTruthy();
  });

  it('falls back to initials when the photo fails to load', async () => {
    await render(<Avatar name="Priya Sharma" uri="https://expired.example/photo.jpg" />);
    expect(screen.queryByText('PS')).toBeNull();

    await fireEvent(screen.getByLabelText('Priya Sharma'), 'error');
    expect(screen.getByText('PS')).toBeTruthy();
  });
});
