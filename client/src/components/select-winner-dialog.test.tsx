import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SelectWinnerDialog from './select-winner-dialog';
import { vi } from 'vitest';

describe('SelectWinnerDialog', () => {
  const mockOnClose = vi.fn();
  const mockOnSelect = vi.fn();
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onSelect: mockOnSelect,
    team1: 'Team A',
    team2: 'Team B'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the dialog with correct title and options', () => {
    render(<SelectWinnerDialog {...defaultProps} />);
    
    expect(screen.getByText('Select Match Winner')).toBeInTheDocument();
    expect(screen.getByText('Team A')).toBeInTheDocument();
    expect(screen.getByText('Team B')).toBeInTheDocument();
    expect(screen.getByText('No Result')).toBeInTheDocument();
  });

  it('calls onSelect with Team A when Team A is selected', async () => {
    render(<SelectWinnerDialog {...defaultProps} />);
    
    const selectTrigger = screen.getByRole('combobox');
    fireEvent.click(selectTrigger);
    
    const teamAOption = screen.getByText('Team A');
    fireEvent.click(teamAOption);
    
    await waitFor(() => {
      expect(mockOnSelect).toHaveBeenCalledWith('Team A');
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('calls onSelect with Team B when Team B is selected', async () => {
    render(<SelectWinnerDialog {...defaultProps} />);
    
    const selectTrigger = screen.getByRole('combobox');
    fireEvent.click(selectTrigger);
    
    const teamBOption = screen.getByText('Team B');
    fireEvent.click(teamBOption);
    
    await waitFor(() => {
      expect(mockOnSelect).toHaveBeenCalledWith('Team B');
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('calls onSelect with null when No Result is selected', async () => {
    render(<SelectWinnerDialog {...defaultProps} />);
    
    const selectTrigger = screen.getByRole('combobox');
    fireEvent.click(selectTrigger);
    
    const noResultOption = screen.getByText('No Result');
    fireEvent.click(noResultOption);
    
    await waitFor(() => {
      expect(mockOnSelect).toHaveBeenCalledWith(null);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('does not render when isOpen is false', () => {
    render(<SelectWinnerDialog {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText('Select Match Winner')).not.toBeInTheDocument();
  });

  it('resets value when dialog opens', () => {
    const { rerender } = render(<SelectWinnerDialog {...defaultProps} isOpen={false} />);
    
    // Open dialog
    rerender(<SelectWinnerDialog {...defaultProps} isOpen={true} />);
    
    const selectTrigger = screen.getByRole('combobox');
    expect(selectTrigger).toHaveTextContent('Select winner');
  });
}); 