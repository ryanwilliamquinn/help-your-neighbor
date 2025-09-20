import { render, screen } from '@testing-library/react';
import { describe, it, expect } from '@jest/globals';
import App from './App';

describe('App', () => {
  it('should render the app with Vite and React logos', () => {
    render(<App />);

    // Check if the main content is rendered
    const element = screen.getByText(/Vite \+ React/i);
    expect(element).toBeTruthy();
  });

  it('should render the counter button', () => {
    render(<App />);

    // Check if the counter button is present
    const button = screen.getByRole('button', { name: /count is/i });
    expect(button).toBeTruthy();
  });
});
