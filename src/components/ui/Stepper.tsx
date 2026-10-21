import { View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

import { AppText } from './AppText';
import { Button } from './Button';

interface StepperProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  format: (value: number) => string;
  decreaseLabel: string;
  increaseLabel: string;
}

export function Stepper({ value, min, max, onChange, format, decreaseLabel, increaseLabel }: StepperProps) {
  const { spacing } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
      <Button
        variant="ghost"
        size="sm"
        label="−"
        accessibilityLabel={decreaseLabel}
        disabled={value <= min}
        onPress={() => onChange(Math.max(min, value - 1))}
      />
      <AppText variant="heading" accessibilityLiveRegion="polite" style={{ minWidth: 80, textAlign: 'center' }}>
        {format(value)}
      </AppText>
      <Button
        variant="ghost"
        size="sm"
        label="+"
        accessibilityLabel={increaseLabel}
        disabled={value >= max}
        onPress={() => onChange(Math.min(max, value + 1))}
      />
    </View>
  );
}
