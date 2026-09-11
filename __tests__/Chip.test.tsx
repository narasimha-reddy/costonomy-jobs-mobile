import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Chip } from '@/components/ui/Chip';

describe('Chip', () => {
  it('fires its own press and its remove button independently', async () => {
    const onPress = jest.fn();
    const onRemove = jest.fn();
    await render(<Chip label="Madhapur" selected onPress={onPress} onRemove={onRemove} />);

    await fireEvent.press(screen.getByLabelText('Remove Madhapur'));
    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onPress).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByText('Madhapur'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('is not a button at all when it has no action', async () => {
    await render(<Chip label="Tandoor" />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
