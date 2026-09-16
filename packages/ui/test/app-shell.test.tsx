import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AppShell } from '../src/index.js';

describe('AppShell', () => {
  it('renderiza a identidade do produto e o conteúdo da página', () => {
    render(
      <AppShell productName="ApexFinance">
        <p>Fundação pronta</p>
      </AppShell>,
    );

    expect(screen.getByRole('banner')).toHaveTextContent('ApexFinance');
    expect(screen.getByText('Fundação pronta')).toBeInTheDocument();
  });
});
